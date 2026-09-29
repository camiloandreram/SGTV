// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const nodemailer = require('nodemailer');
const util = require('util');
require('dotenv').config();

const queryPromise = util.promisify(db.query).bind(db);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }

  const selectQuery = `
    SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,
           pro.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP
    FROM \`Usuario\` u
    JOIN \`Perfil\` p ON u.idPerfil = p.idPerfil
    JOIN \`Departamento\` d ON u.idDepartamento = d.idDepartamento
    LEFT JOIN \`Usuario_Proyecto\` up ON u.idUsuario = up.idUsuarioUP
    LEFT JOIN \`Proyecto\` pro ON (up.idProyecto = pro.idProyecto OR u.idUsuario = pro.idResponsableP)
    WHERE u.email = ?
    LIMIT 1`;

  try {
    const results = await queryPromise(selectQuery, [email]);
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.contraseña);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.idUsuario, perfil: user.idPerfil, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    delete user.contraseña;
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Error en LOGIN:', err);
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
};

// Solicitar restablecimiento de contraseña
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
  }

  try {
    // Verificar si el email existe
    const checkUserQuery = 'SELECT idUsuario, email, Nombre FROM Usuario WHERE email = ?';
    const users = await queryPromise(checkUserQuery, [email]);

    if (users.length === 0) {
      // Por seguridad, no revelamos si el email existe
      return res.status(200).json({
        success: true,
        message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.'
      });
    }

    const user = users[0];

    // Generar token JWT (expira en 1 hora)
    const resetToken = jwt.sign(
      { id: user.idUsuario, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Guardar token en la tabla password_resets
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const insertTokenQuery = 'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)';
    await queryPromise(insertTokenQuery, [email, resetToken, expiresAt]);

    // Construir enlace de restablecimiento
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    // Enviar correo
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Restablecimiento de contraseña - SGTV',
      html: `
        <h2>Hola, ${user.Nombre || 'usuario'}</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        <p>Saludos,<br>Equipo SGTV</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña.'
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    // Si falla, intentamos eliminar el token si existe (pero no es crítico)
    try {
      // Nota: no tenemos resetToken aquí si falló antes de definirlo, pero lo dejamos como opcional
      if (resetToken) {
        await queryPromise('DELETE FROM password_resets WHERE token = ?', [resetToken]);
      }
    } catch (e) {}
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud. Intenta nuevamente más tarde.'
    });
  }
};

// Restablecer contraseña (con token)
// Función para restablecer la contraseña (con token)
const resetPassword = async (req, res) => {
  const { token, nuevaContraseña, confirmarContraseña } = req.body;

  // Limpiar espacios en blanco
  const pass1 = nuevaContraseña?.trim() || '';
  const pass2 = confirmarContraseña?.trim() || '';

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token no proporcionado.' });
  }

  if (!pass1 || !pass2) {
    return res.status(400).json({ success: false, message: 'La contraseña no puede estar vacía.' });
  }

  if (pass1 !== pass2) {
    return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
  }

  // Validar fortaleza de la contraseña (después del trim)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(pass1)) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
    });
  }

  // Verificar token en la base de datos
  const checkTokenQuery = 'SELECT email, expires_at FROM password_resets WHERE token = ?';
  db.query(checkTokenQuery, [token], async (err, results) => {
    if (err) {
      console.error('Error al verificar token:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de restablecimiento no es válido o ya ha sido usado. Solicita uno nuevo.'
      });
    }

    const { email, expires_at } = results[0];

    // Verificar expiración
    const now = new Date();
    const expiry = new Date(expires_at);
    if (now > expiry) {
      // Eliminar token expirado
      db.query('DELETE FROM password_resets WHERE token = ?', [token]);
      return res.status(400).json({
        success: false,
        message: 'El enlace de restablecimiento ha expirado. Solicita uno nuevo.'
      });
    }

    // Hashear nueva contraseña
    try {
      const hashedPassword = await bcrypt.hash(pass1, 10);

      // Actualizar contraseña en la tabla Usuario
      const updateUserQuery = 'UPDATE Usuario SET contraseña = ? WHERE email = ?';
      db.query(updateUserQuery, [hashedPassword, email], (err) => {
        if (err) {
          console.error('Error al actualizar contraseña:', err);
          return res.status(500).json({ success: false, message: 'Error al actualizar la contraseña.' });
        }

        // Eliminar token usado
        db.query('DELETE FROM password_resets WHERE token = ?', [token]);

        res.json({
          success: true,
          message: '¡Contraseña restablecida con éxito! Ahora puedes iniciar sesión con tu nueva contraseña.'
        });
      });
    } catch (hashError) {
      console.error('Error al hashear contraseña:', hashError);
      return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  });
};

module.exports = { login, forgotPassword, resetPassword };
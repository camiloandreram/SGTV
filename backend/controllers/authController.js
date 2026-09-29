// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { Resend } = require('resend');
const util = require('util');
require('dotenv').config();

const queryPromise = util.promisify(db.query).bind(db);

// Inicializar cliente de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// LOGIN
// ============================================================
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }

  const selectQuery = `
    SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,
           pro.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP
    FROM \`usuario\` u
    JOIN \`perfil\` p ON u.idPerfil = p.idPerfil
    JOIN \`departamento\` d ON u.idDepartamento = d.idDepartamento
    LEFT JOIN \`usuario_proyecto\` up ON u.idUsuario = up.idUsuarioUP
    LEFT JOIN \`proyecto\` pro ON (up.idProyecto = pro.idProyecto OR u.idUsuario = pro.idResponsableP)
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

// ============================================================
// SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA
// ============================================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
  }

  let resetToken = null;
  try {
    // Verificar si el email existe
    const checkUserQuery = 'SELECT idUsuario, email, Nombre FROM usuario WHERE email = ?';
    const users = await queryPromise(checkUserQuery, [email]);

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.'
      });
    }

    const user = users[0];

    // Generar token JWT (expira en 1 hora)
    resetToken = jwt.sign(
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

    // Enviar correo con Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Restablecimiento de contraseña - SGTV',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C62828;">Hola, ${user.Nombre || 'usuario'}</h2>
          <p>Has solicitado restablecer tu contraseña en SGTV.</p>
          <p>Haz clic en el siguiente botón para continuar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #C62828; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 12px;">
            ${resetLink}
          </p>
          <p style="color: #666; font-size: 12px;">Este enlace expirará en 1 hora.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 11px;">
            Si no solicitaste este cambio, ignora este mensaje.<br>
            Saludos,<br>Equipo SGTV
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error de Resend:', error);
      throw new Error(error.message || 'Error al enviar el correo');
    }

    console.log('✅ Correo enviado con Resend. ID:', data?.id);

    res.status(200).json({
      success: true,
      message: 'Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña.'
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    try {
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

// ============================================================
// RESTABLECER CONTRASEÑA (con token)
// ============================================================
const resetPassword = async (req, res) => {
  const { token, nuevaContraseña, confirmarContraseña } = req.body;

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

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(pass1)) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
    });
  }

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

    const now = new Date();
    const expiry = new Date(expires_at);
    if (now > expiry) {
      db.query('DELETE FROM password_resets WHERE token = ?', [token]);
      return res.status(400).json({
        success: false,
        message: 'El enlace de restablecimiento ha expirado. Solicita uno nuevo.'
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(pass1, 10);

      const updateUserQuery = 'UPDATE usuario SET contraseña = ? WHERE email = ?';
      db.query(updateUserQuery, [hashedPassword, email], (err) => {
        if (err) {
          console.error('Error al actualizar contraseña:', err);
          return res.status(500).json({ success: false, message: 'Error al actualizar la contraseña.' });
        }

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
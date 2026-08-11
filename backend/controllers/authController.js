// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

// Login de usuario
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

  db.query(selectQuery, [email], async (err, results) => {
    if (err) {
      console.error('Error en LOGIN SQL:', err);
      return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
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
  });
};

module.exports = { login };
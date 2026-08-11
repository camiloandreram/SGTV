// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Login
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
      console.error("Error en LOGIN SQL:", err);
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

// Obtener todos los usuarios
const getUsuarios = (req, res) => {
  const query = `
    SELECT u.idUsuario, u.Nombre, u.Apellido, u.telefono, u.email, u.direccion, u.Estado, u.vacaciones_disponibles, u.idPerfil, u.idDepartamento,
           p.Nombre AS NombrePerfil, d.Nombre AS NombreDepartamento
    FROM \`Usuario\` u
    LEFT JOIN \`Perfil\` p ON u.idPerfil = p.idPerfil
    LEFT JOIN \`Departamento\` d ON u.idDepartamento = d.idDepartamento
    ORDER BY u.idUsuario DESC`;
  db.query(query, [], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    res.json({ success: true, data: results });
  });
};

// Crear nuevo usuario
const createUsuario = async (req, res) => {
  const { nombre, apellido, telefono, contraseña, email, direccion, idPerfil, idDepartamento } = req.body;

  if (!nombre || !apellido || !email || !contraseña || !idPerfil || !idDepartamento) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios requeridos.'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const estadoInicial = 'Activo';
    const vacacionesIniciales = 15.00;
    const fechaActual = new Date().toISOString().split('T')[0];

    const sqlInsert = `
      INSERT INTO \`Usuario\` 
      (\`Nombre\`, \`Apellido\`, \`telefono\`, \`contraseña\`, \`email\`, \`direccion\`, \`Fecha_de_Nacimiento\`, \`Fecha_de_Ingreso\`, \`Estado\`, \`idPerfil\`, \`idDepartamento\`, \`vacaciones_disponibles\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlInsert, [
      nombre, apellido, telefono || null,
      hashedPassword,
      email, direccion || null,
      fechaActual, fechaActual,
      estadoInicial, idPerfil, idDepartamento, vacacionesIniciales
    ], (err, result) => {
      if (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra asignado a otro empleado.' });
        }
        return res.status(500).json({ success: false, message: 'Error al intentar guardar el empleado.' });
      }
      return res.json({ success: true, message: 'El empleado ha sido registrado con éxito.', idUsuario: result.insertId });
    });
  } catch (error) {
    console.error('Error al hashear la contraseña:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// Actualizar usuario
const updateUsuario = (req, res) => {
  const idUsuario = req.params.id;
  const { nombre, apellido, telefono, contraseña, email, direccion, Estado, idPerfil, idDepartamento, vacaciones_disponibles } = req.body;

  if (!nombre || !apellido || !email || !idPerfil || !idDepartamento) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios requeridos.' });
  }

  let sqlUpdate = `
    UPDATE \`Usuario\` SET 
      \`Nombre\` = ?, \`Apellido\` = ?, \`telefono\` = ?, \`email\` = ?, \`direccion\` = ?, \`Estado\` = ?, \`idPerfil\` = ?, \`idDepartamento\` = ?, \`vacaciones_disponibles\` = ?
  `;
  const params = [nombre, apellido, telefono || null, email, direccion || null, Estado || 'Activo', idPerfil, idDepartamento, vacaciones_disponibles || 15.00];

  if (contraseña && contraseña.trim() !== '') {
    // Si se envía una nueva contraseña, hashearla
    // Pero aquí debemos usar async, mejor lo manejamos con una función separada
    // Por simplicidad, omitimos hasheo en este controlador, lo dejamos en una versión posterior
    // O podemos usar bcrypt.hashSync para simplicidad
    const hashedPassword = bcrypt.hashSync(contraseña, 10);
    sqlUpdate += `, \`contraseña\` = ? `;
    params.push(hashedPassword);
  }

  sqlUpdate += ` WHERE \`idUsuario\` = ?`;
  params.push(idUsuario);

  db.query(sqlUpdate, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    return res.json({ success: true, message: 'Los datos del empleado fueron actualizados correctamente.' });
  });
};

// Inactivar usuario (lógica)
const inactivarUsuario = (req, res) => {
  const idUsuario = req.params.id;
  const sqlInactivar = 'UPDATE `Usuario` SET `Estado` = \'Inactivo\' WHERE `idUsuario` = ?';
  db.query(sqlInactivar, [idUsuario], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al inactivar.' });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    return res.json({ success: true, message: 'El empleado ha sido inactivado con éxito.' });
  });
};

// Eliminar usuario (físico)
const deleteUsuario = (req, res) => {
  const idUsuario = req.params.id;
  const sqlDelete = 'DELETE FROM `Usuario` WHERE `idUsuario` = ?';
  db.query(sqlDelete, [idUsuario], (err, result) => {
    if (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ success: false, message: 'No se puede eliminar de forma física porque posee registros vinculados.' });
      }
      return res.status(500).json({ success: false, message: 'Error al eliminar.' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    return res.json({ success: true, message: 'El registro del usuario ha sido borrado físicamente.' });
  });
};

// Obtener datos de un usuario específico
const getUsuarioById = (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,
           pro.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP
    FROM \`Usuario\` u
    JOIN \`Perfil\` p ON u.idPerfil = p.idPerfil
    JOIN \`Departamento\` d ON u.idDepartamento = d.idDepartamento
    LEFT JOIN \`Usuario_Proyecto\` up ON u.idUsuario = up.idUsuarioUP
    LEFT JOIN \`Proyecto\` pro ON (up.idProyecto = pro.idProyecto OR u.idUsuario = pro.idResponsableP)
    WHERE u.idUsuario = ?`;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error en el servidor' });
    if (results.length > 0) {
      const user = results[0];
      delete user.contraseña;
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
  });
};

// Obtener perfiles
const getPerfiles = (req, res) => {
  db.query('SELECT idPerfil, Nombre FROM Perfil ORDER BY Nombre ASC', [], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al obtener perfiles' });
    res.json({ success: true, data: results });
  });
};

// Obtener departamentos
const getDepartamentos = (req, res) => {
  db.query('SELECT idDepartamento, Nombre FROM Departamento ORDER BY Nombre ASC', [], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al obtener departamentos' });
    res.json({ success: true, data: results });
  });
};

module.exports = {
  login,
  getUsuarios,
  createUsuario,
  updateUsuario,
  inactivarUsuario,
  deleteUsuario,
  getUsuarioById,
  getPerfiles,
  getDepartamentos
};
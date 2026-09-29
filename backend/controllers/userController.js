// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Función para verificar si el usuario tiene permisos de administrador o jefe líder
const verificarPermisos = (req, res, next) => {
  const perfil = req.user?.perfil;
  if (perfil !== 1 && perfil !== 2) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción. Solo Administradores o Jefes Líder pueden gestionar empleados.'
    });
  }
  next();
};

// Login
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

// Obtener todos los usuarios (solo permitido para admins/jefes)
const getUsuarios = (req, res) => {
  verificarPermisos(req, res, () => {
    const query = `
      SELECT u.idUsuario, u.Nombre, u.Apellido, u.telefono, u.email, u.direccion, u.Estado, u.vacaciones_disponibles, u.idPerfil, u.idDepartamento,
             p.Nombre AS NombrePerfil, d.Nombre AS NombreDepartamento
      FROM \`usuario\` u
      LEFT JOIN \`perfil\` p ON u.idPerfil = p.idPerfil
      LEFT JOIN \`departamento\` d ON u.idDepartamento = d.idDepartamento
      ORDER BY u.idUsuario DESC`;
    db.query(query, [], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
      res.json({ success: true, data: results });
    });
  });
};

// Crear nuevo usuario
const createUsuario = async (req, res) => {
  verificarPermisos(req, res, async () => {
    console.log('📥 Datos recibidos para creación:', req.body);
    const {
      nombre, apellido, telefono, contraseña, email, direccion,
      idPerfil, idDepartamento, fechaNacimiento, fechaIngreso
    } = req.body;

    const camposRequeridos = [
      'nombre', 'apellido', 'telefono', 'email', 'contraseña',
      'direccion', 'idPerfil', 'idDepartamento', 'fechaNacimiento', 'fechaIngreso'
    ];
    for (const campo of camposRequeridos) {
      const valor = req.body[campo];
      if (valor === undefined || valor === null || valor.toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `El campo "${campo}" es obligatorio y no puede estar vacío.`
        });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no tiene un formato válido.'
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fechaNacimiento) || isNaN(new Date(fechaNacimiento).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento no tiene un formato válido (YYYY-MM-DD).'
      });
    }
    if (!dateRegex.test(fechaIngreso) || isNaN(new Date(fechaIngreso).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de ingreso no tiene un formato válido (YYYY-MM-DD).'
      });
    }

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    if (nacimiento > hoy) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento no puede ser una fecha futura.'
      });
    }

    if (!/^\d{1,10}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe contener solo números y tener máximo 10 dígitos.'
      });
    }

    if (direccion.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'La dirección debe tener al menos 5 caracteres.'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(contraseña)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
      });
    }

    const perfilId = parseInt(idPerfil, 10);
    const deptoId = parseInt(idDepartamento, 10);
    if (isNaN(perfilId) || perfilId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El Perfil / Rol de Acceso debe ser un número válido.'
      });
    }
    if (isNaN(deptoId) || deptoId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El Departamento Organizacional debe ser un número válido.'
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(contraseña, 10);

      const telefonoFinal = telefono.trim();
      const direccionFinal = direccion.trim();
      const estadoInicial = 'Activo';
      const vacacionesIniciales = 15.00;

      const sqlInsert = `
        INSERT INTO \`usuario\` 
        (\`Nombre\`, \`Apellido\`, \`telefono\`, \`contraseña\`, \`email\`, \`direccion\`, 
         \`Fecha_de_Nacimiento\`, \`Fecha_de_Ingreso\`, \`Estado\`, 
         \`idPerfil\`, \`idDepartamento\`, \`vacaciones_disponibles\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(sqlInsert, [
        nombre.trim(),
        apellido.trim(),
        telefonoFinal,
        hashedPassword,
        email.trim(),
        direccionFinal,
        fechaNacimiento,
        fechaIngreso,
        estadoInicial,
        perfilId,
        deptoId,
        vacacionesIniciales
      ], (err, result) => {
        if (err) {
          console.error('❌ Error en INSERT de usuario:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
              success: false,
              message: 'El correo electrónico ya se encuentra asignado a otro empleado.'
            });
          }
          return res.status(500).json({
            success: false,
            message: 'Error al intentar guardar el empleado en la base de datos.',
            error: err.message
          });
        }

        console.log(`✅ Usuario creado con ID: ${result.insertId}`);
        return res.json({
          success: true,
          message: 'El empleado ha sido registrado con éxito.',
          idUsuario: result.insertId
        });
      });
    } catch (error) {
      console.error('❌ Error en el proceso de creación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al procesar la solicitud.'
      });
    }
  });
};

// Actualizar usuario
const updateUsuario = (req, res) => {
  verificarPermisos(req, res, () => {
    const idUsuario = req.params.id;
    const { nombre, apellido, telefono, contraseña, email, direccion, Estado, idPerfil, idDepartamento, vacaciones_disponibles } = req.body;

    if (!nombre || !apellido || !email || !idPerfil || !idDepartamento) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios requeridos.' });
    }

    if (telefono && telefono.trim() !== '') {
      if (!/^\d{1,10}$/.test(telefono.trim())) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono debe contener solo números y tener máximo 10 dígitos.'
        });
      }
    }

    if (direccion && direccion.trim() !== '' && direccion.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'La dirección debe tener al menos 5 caracteres.'
      });
    }

    let sqlUpdate = `
      UPDATE \`usuario\` SET 
        \`Nombre\` = ?, \`Apellido\` = ?, \`telefono\` = ?, \`email\` = ?, \`direccion\` = ?, \`Estado\` = ?, \`idPerfil\` = ?, \`idDepartamento\` = ?, \`vacaciones_disponibles\` = ?
    `;
    const params = [
      nombre.trim(),
      apellido.trim(),
      telefono ? telefono.trim() : null,
      email.trim(),
      direccion ? direccion.trim() : null,
      Estado || 'Activo',
      idPerfil,
      idDepartamento,
      vacaciones_disponibles || 15.00
    ];

    if (contraseña && contraseña.trim() !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(contraseña)) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
        });
      }
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
  });
};

// Inactivar usuario (solo admins/jefes)
const inactivarUsuario = (req, res) => {
  verificarPermisos(req, res, () => {
    const idUsuario = req.params.id;
    const sqlInactivar = 'UPDATE `usuario` SET `Estado` = \'Inactivo\' WHERE `idUsuario` = ?';
    db.query(sqlInactivar, [idUsuario], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al inactivar.' });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return res.json({ success: true, message: 'El empleado ha sido inactivado con éxito.' });
    });
  });
};

// Activar usuario (solo admins/jefes)
const activarUsuario = (req, res) => {
  verificarPermisos(req, res, () => {
    const idUsuario = req.params.id;
    const sqlActivar = 'UPDATE `usuario` SET `Estado` = \'Activo\' WHERE `idUsuario` = ?';
    db.query(sqlActivar, [idUsuario], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al activar.' });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return res.json({ success: true, message: 'El empleado ha sido activado con éxito.' });
    });
  });
};

// Eliminar usuario (solo admins/jefes)
const deleteUsuario = (req, res) => {
  verificarPermisos(req, res, () => {
    const idUsuario = req.params.id;
    const sqlDelete = 'DELETE FROM `usuario` WHERE `idUsuario` = ?';
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
  });
};

// Obtener datos de un usuario específico
const getUsuarioById = (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,
           pro.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP
    FROM \`usuario\` u
    JOIN \`perfil\` p ON u.idPerfil = p.idPerfil
    JOIN \`departamento\` d ON u.idDepartamento = d.idDepartamento
    LEFT JOIN \`usuario_proyecto\` up ON u.idUsuario = up.idUsuarioUP
    LEFT JOIN \`proyecto\` pro ON (up.idProyecto = pro.idProyecto OR u.idUsuario = pro.idResponsableP)
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

// Obtener perfiles (público)
const getPerfiles = (req, res) => {
  db.query('SELECT idPerfil, Nombre FROM `perfil` ORDER BY Nombre ASC', [], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al obtener perfiles' });
    res.json({ success: true, data: results });
  });
};

// Obtener departamentos (público)
const getDepartamentos = (req, res) => {
  db.query('SELECT idDepartamento, Nombre FROM `departamento` ORDER BY Nombre ASC', [], (err, results) => {
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
  activarUsuario,
  deleteUsuario,
  getUsuarioById,
  getPerfiles,
  getDepartamentos
};
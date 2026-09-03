// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Función para verificar si el usuario tiene permisos de administrador o jefe líder
const verificarPermisos = (req, res, next) => {
  // Asumimos que el middleware auth ya agregó req.user con { id, perfil, email }
  const perfil = req.user?.perfil;
  // Solo perfil 1 (Admin) o 2 (Jefe líder) pueden realizar acciones de gestión
  if (perfil !== 1 && perfil !== 2) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para realizar esta acción. Solo Administradores o Jefes Líder pueden gestionar empleados.'
    });
  }
  next();
};

// Login (sin cambios)
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

// Obtener todos los usuarios (solo permitido para admins/jefes)
const getUsuarios = (req, res) => {
  verificarPermisos(req, res, () => {
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
  });
};

// Crear nuevo usuario (con validación de campos, fechas, contraseña, teléfono y dirección)
const createUsuario = async (req, res) => {
  verificarPermisos(req, res, async () => {
    console.log('📥 Datos recibidos para creación:', req.body);
    const {
      nombre, apellido, telefono, contraseña, email, direccion,
      idPerfil, idDepartamento, fechaNacimiento, fechaIngreso
    } = req.body;

    // 1. Validar que todos los campos obligatorios estén presentes y no vacíos
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

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no tiene un formato válido.'
      });
    }

    // 3. Validar formato de fechas (YYYY-MM-DD)
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

    // 4. Validar que la fecha de nacimiento no sea futura
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    if (nacimiento > hoy) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de nacimiento no puede ser una fecha futura.'
      });
    }

    // 5. Validar teléfono (solo números y máximo 10 dígitos)
    if (!/^\d{1,10}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe contener solo números y tener máximo 10 dígitos.'
      });
    }

    // 6. Validar dirección (mínimo 5 caracteres)
    if (direccion.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'La dirección debe tener al menos 5 caracteres.'
      });
    }

    // 7. Validar contraseña con condiciones estrictas
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(contraseña)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
      });
    }

    // 8. Validar que los IDs sean números enteros positivos
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
      // 9. Hash de la contraseña
      const hashedPassword = await bcrypt.hash(contraseña, 10);

      // 10. Valores por defecto para campos NOT NULL (ya están validados, pero por seguridad)
      const telefonoFinal = telefono.trim();
      const direccionFinal = direccion.trim();
      const estadoInicial = 'Activo';
      const vacacionesIniciales = 15.00;

      // 11. Consulta de inserción
      const sqlInsert = `
        INSERT INTO \`Usuario\` 
        (\`Nombre\`, \`Apellido\`, \`telefono\`, \`contraseña\`, \`email\`, \`direccion\`, 
         \`Fecha_de_Nacimiento\`, \`Fecha_de_Ingreso\`, \`Estado\`, 
         \`idPerfil\`, \`idDepartamento\`, \`vacaciones_disponibles\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // 12. Ejecutar la consulta con las fechas recibidas
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

// Actualizar usuario (solo admins/jefes) con las mismas validaciones
const updateUsuario = (req, res) => {
  verificarPermisos(req, res, () => {
    const idUsuario = req.params.id;
    const { nombre, apellido, telefono, contraseña, email, direccion, Estado, idPerfil, idDepartamento, vacaciones_disponibles } = req.body;

    // Validar campos obligatorios
    if (!nombre || !apellido || !email || !idPerfil || !idDepartamento) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios requeridos.' });
    }

    // Validar teléfono (si se envía y no está vacío)
    if (telefono && telefono.trim() !== '') {
      if (!/^\d{1,10}$/.test(telefono.trim())) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono debe contener solo números y tener máximo 10 dígitos.'
        });
      }
    }

    // Validar dirección (si se envía y no está vacía)
    if (direccion && direccion.trim() !== '' && direccion.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'La dirección debe tener al menos 5 caracteres.'
      });
    }

    let sqlUpdate = `
      UPDATE \`Usuario\` SET 
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
      // Validar que la nueva contraseña cumpla condiciones
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
    const sqlInactivar = 'UPDATE `Usuario` SET `Estado` = \'Inactivo\' WHERE `idUsuario` = ?';
    db.query(sqlInactivar, [idUsuario], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error al inactivar.' });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      return res.json({ success: true, message: 'El empleado ha sido inactivado con éxito.' });
    });
  });
};

// Eliminar usuario (solo admins/jefes)
const deleteUsuario = (req, res) => {
  verificarPermisos(req, res, () => {
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
  });
};

// Obtener datos de un usuario específico (puede ser accedido por el propio usuario o por admins/jefes)
// Para simplificar, permitimos que cualquier autenticado lo vea, o podríamos restringir.
const getUsuarioById = (req, res) => {
  // No aplicamos verificarPermisos aquí para que el usuario pueda ver sus propios datos
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

// Obtener perfiles (público)
const getPerfiles = (req, res) => {
  db.query('SELECT idPerfil, Nombre FROM Perfil ORDER BY Nombre ASC', [], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error al obtener perfiles' });
    res.json({ success: true, data: results });
  });
};

// Obtener departamentos (público)
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
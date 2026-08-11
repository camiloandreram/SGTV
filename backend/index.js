/**
 * ------------------------------------------------------------------------------------------------
 * @Name         index.js
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-24
 * @Group        Backend - API REST
 * @Description  Servidor principal de la aplicación SGTV. Expone endpoints para autenticación,
 *               gestión de usuarios (CRUD completo), catálogos, vacaciones (con cálculo de festivos
 *               colombianos y formatos planos directos) y reporte de horas semanales/mensuales.
 * @Changes      (most recent first)
 * 2026-06-24    Camilo Andres Ramirez Ospina    Unificación completa de endpoints CRUD de usuarios y vacaciones
 * 2026-06-19    Camilo Andres Ramirez Ospina    Corrección definitiva de formatos de respuesta de vacaciones
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

require('dotenv').config({ path: './process.env'});
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// ============================================================
// IMPORTACIÓN ROBUSTA DE LIBRERÍAS (Solución al TypeError)
// ============================================================
const colombianHolidays = require('colombian-holidays');
const getHolidaysByYear = colombianHolidays.getHolidaysByYear || colombianHolidays.default?.getHolidaysByYear;
const auth = require('./middleware/auth');
const app = express();

// ============================================================
// CONFIGURACIÓN DEL SERVIDOR
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// FUNCIÓN AUXILIAR: CÁLCULO DE DÍAS HÁBILES (COLOMBIA)
// ============================================================
function calcularDiasHabilesColombia(fechaInicioStr, fechaFinStr) {
    let fechaActual = new Date(fechaInicioStr + 'T00:00:00');
    const fechaFin = new Date(fechaFinStr + 'T00:00:00');

    if (fechaActual > fechaFin) return 0;

    const anoActual = fechaActual.getFullYear();
    let festivos = [];

    try {
        festivos = getHolidaysByYear(anoActual).map(h => h.date);
    } catch (e) {
        console.error("Error al obtener festivos oficiales:", e);
    }

    let diasHabiles = 0;

    while (fechaActual <= fechaFin) {
        const diaSemana = fechaActual.getDay(); // 0 = Domingo, 6 = Sábado
        const stringFecha = fechaActual.toISOString().split('T')[0];

        const esFinDeSemana = (diaSemana === 0 || diaSemana === 6);
        const esFestivo = festivos.includes(stringFecha);

        if (!esFinDeSemana && !esFestivo) {
            diasHabiles++;
        }

        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return diasHabiles;
}

// ============================================================
// ENDPOINT: LOGIN CON JOIN A PROYECTO Y DEPARTAMENTO
// ============================================================
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post('/api/login', async (req, res) => {
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
    // Comparar contraseña hasheada
    const match = await bcrypt.compare(password, user.contraseña);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.idUsuario, perfil: user.idPerfil, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    delete user.contraseña;
    res.json({ success: true, token, user });
  });
});

// ============================================================
// APLICAR MIDDLEWARE DE AUTENTICACIÓN A RUTAS PROTEGIDAS
// ============================================================
app.use('/api/usuarios', auth);
app.use('/api/vacaciones', auth);
app.use('/api/reporte-horas', auth);
app.use('/api/usuario', auth);
app.use('/api/perfiles', auth);
app.use('/api/departamentos', auth);

// ============================================================
// RUTA: ADICIONADA - REGISTRAR NUEVO EMPLEADO / USUARIO (POST)
// ============================================================
app.post('/api/usuarios', async (req, res) => {
  const { nombre, apellido, telefono, contraseña, email, direccion, idPerfil, idDepartamento } = req.body;

  // Validación de campos obligatorios
  if (!nombre || !apellido || !email || !contraseña || !idPerfil || !idDepartamento) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios requeridos (Nombre, Apellido, Email, Contraseña, Perfil o Departamento).'
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
      hashedPassword,      // <-- aquí usamos la contraseña hasheada
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
});

// ============================================================
// RUTA: ADICIONADA - ACTUALIZAR EMPLEADO / USUARIO (PUT)
// ============================================================
app.put('/api/usuarios/:id', (req, res) => {
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
        sqlUpdate += `, \`contraseña\` = ? `;
        params.push(contraseña);
    }

    sqlUpdate += ` WHERE \`idUsuario\` = ?`;
    params.push(idUsuario);

    db.query(sqlUpdate, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error interno al actualizar.' });
        }
        return res.json({ success: true, message: 'Los datos del empleado fueron actualizados correctamente.' });
    });
});

// ============================================================
// RUTA: ADICIONADA - ELIMINACIÓN LÓGICA / INACTIVAR USUARIO (PATCH)
// ============================================================
app.patch('/api/usuarios/:id/inactivar', (req, res) => {
    const idUsuario = req.params.id;
    const sqlInactivar = 'UPDATE `Usuario` SET `Estado` = \'Inactivo\' WHERE `idUsuario` = ?';
    db.query(sqlInactivar, [idUsuario], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al inactivar.' });
        return res.json({ success: true, message: 'El empleado ha sido inactivado con éxito.' });
    });
});

// ============================================================
// RUTA: ADICIONADA - ELIMINACIÓN FÍSICA (DELETE)
// ============================================================
app.delete('/api/usuarios/:id', (req, res) => {
    const idUsuario = req.params.id;
    const sqlDelete = 'DELETE FROM `Usuario` WHERE `idUsuario` = ?';
    db.query(sqlDelete, [idUsuario], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'No se puede eliminar de forma física porque posee registros vinculados.' });
            }
            return res.status(500).json({ success: false, message: 'Error al eliminar.' });
        }
        return res.json({ success: true, message: 'El registro del usuario ha sido borrado físicamente.' });
    });
});

// ============================================================
// RUTAS AUXILIARES: ADICIONADAS - CATÁLOGOS Y CONSULTA GENERAL
// ============================================================
app.get('/api/perfiles', (req, res) => {
    db.query('SELECT idPerfil, Nombre FROM Perfil ORDER BY Nombre ASC', [], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: results });
    });
});

app.get('/api/departamentos', (req, res) => {
    db.query('SELECT idDepartamento, Nombre FROM Departamento ORDER BY Nombre ASC', [], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: results });
    });
});

app.get('/api/usuarios', (req, res) => {
    const query = `
        SELECT u.idUsuario, u.Nombre, u.Apellido, u.telefono, u.email, u.direccion, u.Estado, u.vacaciones_disponibles, u.idPerfil, u.idDepartamento,
               p.Nombre AS NombrePerfil, d.Nombre AS NombreDepartamento
        FROM \`Usuario\` u
        LEFT JOIN \`Perfil\` p ON u.idPerfil = p.idPerfil
        LEFT JOIN \`Departamento\` d ON u.idDepartamento = d.idDepartamento
        ORDER BY u.idUsuario DESC`;
    db.query(query, [], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: results });
    });
});

// ============================================================
// MÓDULO: GESTIÓN DE VACACIONES (FORMATO SEGURO Y PROTEGIDO)
// ============================================================
app.get('/api/vacaciones/mis-solicitudes/:idUsuario', (req, res) => {
    const { idUsuario } = req.params;

    if (!idUsuario) {
        return res.status(400).json({ success: false, message: 'Falta el idUsuario' });
    }

    const query = `
        SELECT idSolicitud, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, comentarios
        FROM \`Solicitud de Vacaciones\`
        WHERE idUsuarioSV = ?
        ORDER BY Fecha_Solicitud DESC`;

    db.query(query, [idUsuario], (err, solicitudes) => {
        if (err) {
            console.error("Error SQL en mis-solicitudes:", err);
            return res.status(500).json([]);
        }
        res.json({ success: true, solicitudes });
    });
});

app.get('/api/vacaciones/pendientes-lider', (req, res) => {
    const { idLider } = req.query;

    if (!idLider) {
        return res.status(400).json({ success: false, message: 'Falta el idLider' });
    }

    const query = `
        SELECT sv.idSolicitud, sv.Fecha_Inicio, sv.Fecha_Fin, sv.cantidadDias, sv.comentarios,
               u.Nombre AS NombreEmpleado, u.Apellido AS ApellidoEmpleado
        FROM \`Solicitud de Vacaciones\` sv
        JOIN \`Usuario\` u ON sv.idUsuarioSV = u.idUsuario
        WHERE sv.idAprobador = ? AND sv.Estado = 'Pendiente'`;

    db.query(query, [idLider], (err, solicitudes) => {
        if (err) {
            console.error("Error SQL en pendientes-lider:", err);
            return res.status(500).json([]);
        }
        res.json({ success: true, solicitudes });
    });
});

app.post('/api/vacaciones/solicitar', (req, res) => {
    const {
        idUsuario,
        idAprobador,
        fechaInicio,
        fecha_inicio,
        fechaFin,
        fecha_fin,
        comentarios
    } = req.body;

    const fInicio = fechaInicio || fecha_inicio;
    const fFin = fechaFin || fecha_fin;
    const fechaSolicitud = new Date().toISOString().split('T')[0];

    if (!idUsuario || !fInicio || !fFin) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos obligatorios. Asegúrate de seleccionar fechas de inicio y fin.'
        });
    }

    const cantidadDias = calcularDiasHabilesColombia(fInicio, fFin);

    if (cantidadDias === 0) {
        return res.status(400).json({
            success: false,
            message: 'El rango seleccionado no contiene días hábiles (fines de semana o festivos).'
        });
    }

    const idSolicitudUnico = Math.floor(100000 + Math.random() * 900000);

    const insertQuery = `
        INSERT INTO \`Solicitud de Vacaciones\` 
        (idSolicitud, idUsuarioSV, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, Fecha_Solicitud, idAprobador, comentarios)
        VALUES (?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)`;

    db.query(insertQuery, [idSolicitudUnico, idUsuario, fInicio, fFin, cantidadDias, fechaSolicitud, idAprobador, comentarios], (insErr, result) => {
        if (insErr) {
            console.error("Error SQL en inserción:", insErr);
            return res.status(500).json({ success: false, message: 'Error al registrar la solicitud en la base de datos.' });
        }

        res.json({
            success: true,
            message: `Solicitud creada con éxito (${cantidadDias} días hábiles) y enviada a tu líder.`,
            solicitud: {
                idSolicitud: idSolicitudUnico,
                Fecha_Inicio: fInicio,
                Fecha_Fin: fFin,
                cantidadDias: cantidadDias,
                Estado: 'Pendiente',
                comentarios: comentarios
            }
        });
    });
});

app.post('/api/vacaciones/procesar', (req, res) => {
    const { idSolicitud, accion } = req.body;

    if (!idSolicitud || !accion) {
        return res.status(400).json({ success: false, message: 'Parámetros insuficientes.' });
    }

    const nuevoEstado = (accion === 'Aprobar') ? 'Aprobado' : 'Rechazado';
    const fechaAprobacion = new Date().toISOString().split('T')[0];

    const buscarSolicitud = `SELECT idUsuarioSV, cantidadDias FROM \`Solicitud de Vacaciones\` WHERE idSolicitud = ?`;

    db.query(buscarSolicitud, [idSolicitud], (err, results) => {
        if (err || results.length === 0) {
            return res.status(504).json({ success: false, message: 'Solicitud no encontrada.' });
        }

        const { idUsuarioSV, cantidadDias } = results[0];
        const updateSolicitud = `UPDATE \`Solicitud de Vacaciones\` SET Estado = ?, Fecha_Aprobacion = ? WHERE idSolicitud = ?`;

        db.query(updateSolicitud, [nuevoEstado, fechaAprobacion, idSolicitud], (upErr) => {
            if (upErr) {
                return res.status(500).json({ success: false, message: 'Error al procesar la solicitud.' });
            }

            if (nuevoEstado === 'Aprobado') {
                const descontarDiasQuery = `UPDATE \`Usuario\` SET vacaciones_disponibles = vacaciones_disponibles - ? WHERE idUsuario = ?`;
                db.query(descontarDiasQuery, [cantidadDias, idUsuarioSV], (descErr) => {
                    if (descErr) console.error("Error al restar días al usuario:", descErr);
                    return res.json({ success: true, message: 'Solicitud aprobada y días descontados con éxito.' });
                });
            } else {
                res.json({ success: true, message: 'Solicitud rechazazada correctamente.' });
            }
        });
    });
});

// ============================================================
// MÓDULO: REPORTE DE HORAS
// ============================================================
app.post('/api/reporte-horas/guardar', (req, res) => {
    const { idUsuario, fechaInicioSemana, reporte } = req.body;
    if (!idUsuario || !fechaInicioSemana || !reporte) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    const sqlDelete = 'DELETE FROM `Reporte Horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` = ?';
    db.query(sqlDelete, [idUsuario, fechaInicioSemana], (delErr) => {
        if (delErr) return res.status(500).json({ success: false, message: 'Error interno.' });

        let horasLunes = 0, horasMartes = 0, horasMiercoles = 0, horasJueves = 0, horasViernes = 0;
        const idProyectoRH = reporte[0]?.idProyecto || 1;

        reporte.forEach((item) => {
            const dia = new Date(item.fecha + 'T00:00:00').getDay();
            if (dia === 1) horasLunes = parseFloat(item.horas) || 0;
            if (dia === 2) horasMartes = parseFloat(item.horas) || 0;
            if (dia === 3) horasMiercoles = parseFloat(item.horas) || 0;
            if (dia === 4) horasJueves = parseFloat(item.horas) || 0;
            if (dia === 5) horasViernes = parseFloat(item.horas) || 0;
        });

        const sqlInsert = `
            INSERT INTO \`Reporte Horas\`
            (\`idUsuarioRH\`, \`idProyectoRH\`, \`Fecha_Inicio_Semanal\`, \`horasLunes\`, \`horasMartes\`, \`horasMiercoles\`, \`horasJueves\`, \`horasViernes\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(sqlInsert, [idUsuario, idProyectoRH, fechaInicioSemana, horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes], (insErr) => {
            if (insErr) return res.status(500).json({ success: false, message: 'Error al registrar las horas.' });
            return res.status(200).json({ success: true, message: 'Reporte guardado exitosamente.' });
        });
    });
});

app.get('/api/reporte-horas', (req, res) => {
    const { idUsuario, fechaInicioSemana } = req.query;
    if (!idUsuario || !fechaInicioSemana) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos.' });
    }

    const lunes = new Date(fechaInicioSemana + 'T00:00:00');
    const anoActual = lunes.getFullYear();
    let listaFestivosOficiales = [];

    try {
        listaFestivosOficiales = getHolidaysByYear(anoActual).map(h => h.date);
    } catch (libErr) {
        console.warn("Error al consultar festivos semanales:", libErr);
    }

    const festivosSemana = [];
    for (let i = 0; i < 7; i++) {
        const diaEvaluado = new Date(lunes);
        diaEvaluado.setDate(lunes.getDate() + i);
        const isoStr = diaEvaluado.toISOString().split('T')[0];
        festivosSemana.push(listaFestivosOficiales.includes(isoStr));
    }

    const sqlHoras = 'SELECT horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes FROM `Reporte Horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` = ?';
    db.query(sqlHoras, [idUsuario, fechaInicioSemana], (errHoras, rowsHoras) => {
        if (errHoras) return res.status(500).json({ success: false, message: 'Error al consultar horas.' });

        const reportes = [0, 0, 0, 0, 0, 0, 0];
        if (rowsHoras && rowsHoras.length > 0) {
            const registro = rowsHoras[0];
            reportes[0] = parseFloat(registro.horasLunes) || 0;
            reportes[1] = parseFloat(registro.horasMartes) || 0;
            reportes[2] = parseFloat(registro.horasMiercoles) || 0;
            reportes[3] = parseFloat(registro.horasJueves) || 0;
            reportes[4] = parseFloat(registro.horasViernes) || 0;
        }

        const prefijoMes = fechaInicioSemana.substring(0, 7);
        const sqlMes = 'SELECT SUM(horasLunes + horasMartes + horasMiercoles + horasJueves + horasViernes) as totalMes FROM `Reporte Horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` LIKE ?';
        db.query(sqlMes, [idUsuario, `${prefijoMes}%`], (errMes, rowsMes) => {
            if (errMes) return res.status(500).json({ success: false, message: 'Error en métricas mensuales.' });

            const totalHorasMes = rowsMes[0]?.totalMes ? parseFloat(rowsMes[0].totalMes) : 0;
            return res.json({ success: true, reportes, totalHorasMes, minimoHorasMes: 160, festivosSemana });
        });
    });
});

// ============================================================
// ENDPOINT: OBTENER DATOS ACTUALIZADOS DE UN USUARIO (PERFIL)
// ============================================================
app.get('/api/usuario/:id', (req, res) => {
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
        if (err) {
            console.error("Error en USUARIO REFRESH SQL:", err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        if (results.length > 0) {
            const user = results[0];
            delete user.contraseña;
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend unificado corriendo en http://localhost:${PORT}`);
});
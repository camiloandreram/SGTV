const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// LOGIN CON JOIN A PROYECTO Y DEPARTAMENTO
// ==========================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const selectQuery = `
        SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,
               up.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP
        FROM Usuario u
        JOIN Perfil p ON u.idPerfil = p.idPerfil
        JOIN Departamento d ON u.idDepartamento = d.idDepartamento
        LEFT JOIN usuario_proyecto up ON u.idUsuario = up.idUsuarioUP
        LEFT JOIN proyecto pro ON up.idProyecto = pro.idProyecto
        WHERE u.email = ? AND u.contraseña = ?`;

    db.query(selectQuery, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        if (results.length > 0) {
            const user = results[0];

            if (user.Fecha_de_Ingreso) {
                const fechaIngreso = new Date(user.Fecha_de_Ingreso);
                const fechaActual = new Date();
                const diferenciaTiempo = Math.abs(fechaActual - fechaIngreso);
                const diasTrabajados = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
                const totalAcumulado = (diasTrabajados * 15) / 365;

                // Obtener días ya aprobados (usados)
                const queryAprobados = `SELECT SUM(cantidadDias) AS total FROM solicitud_vacaciones WHERE idUsuarioSV = ? AND Estado = 'Aprobado'`;
                db.query(queryAprobados, [user.idUsuario], (errAprob, resAprob) => {
                    if (errAprob) console.error("Error al obtener días aprobados:", errAprob);
                    const diasUsados = resAprob?.[0]?.total || 0;
                    const saldoReal = Math.max(0, totalAcumulado - diasUsados);

                    // Actualizar la base de datos con el saldo real
                    const updateQuery = `UPDATE Usuario SET vacaciones_disponibles = ? WHERE idUsuario = ?`;
                    db.query(updateQuery, [saldoReal, user.idUsuario], (updateErr) => {
                        if (updateErr) console.error("Error al actualizar vacaciones:", updateErr);
                        user.vacaciones_disponibles = saldoReal;
                        delete user.contraseña;
                        return res.json({ success: true, user });
                    });
                });
            } else {
                delete user.contraseña;
                return res.json({ success: true, user });
            }
        } else {
            res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    });
});

// ==========================================
// CREAR UNA NUEVA SOLICITUD DE VACACIONES
// ==========================================
app.post('/api/vacaciones/solicitar', (req, res) => {
    const { idUsuario, idProyecto, idAprobador, fechaInicio, fechaFin, cantidadDias, comentarios } = req.body;
    const fechaSolicitud = new Date().toISOString().split('T')[0];

    const insertQuery = `
        INSERT INTO solicitud_vacaciones 
        (idUsuarioSV, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, Fecha_Solicitud, idAprobador, comentarios)
        VALUES (?, ?, ?, ?, 'Pendiente', ?, ?, ?)`;

    // Arreglo con los 6 parámetros correspondientes a los 6 signos de "?"
    db.query(insertQuery, [idUsuario, fechaInicio, fechaFin, cantidadDias, fechaSolicitud, idAprobador, comentarios], (insErr, result) => {
        if (insErr) {
            console.error(insErr);
            return res.status(500).json({ success: false, message: 'Error al registrar la solicitud en la base de datos.' });
        }

        // Retornamos el objeto recién creado para renderizarlo dinámicamente en el DOM
        res.json({
            success: true,
            message: 'Solicitud creada con éxito y enviada a tu líder.',
            solicitud: {
                idSolicitud: result.insertId,
                Fecha_Inicio: fechaInicio,
                Fecha_Fin: fechaFin,
                cantidadDias: cantidadDias,
                Estado: 'Pendiente',
                comentarios: comentarios
            }
        });
    });
});

// ==========================================
// OBTENER HISTORIAL PROPIO DE UN EMPLEADO (¡ESTE ES EL QUE MODIFICAS!)
// ==========================================
app.get('/api/vacaciones/mis-solicitudes/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario;
    const query = `
        SELECT s.*, p.Nombre AS nombre_proyecto
        FROM solicitud_vacaciones s
        LEFT JOIN usuario_proyecto up ON s.idUsuarioSV = up.idUsuarioUP
        LEFT JOIN proyecto p ON up.idProyecto = p.idProyecto
        WHERE s.idUsuarioSV = ? ORDER BY s.idSolicitud DESC
    `;
    db.query(query, [idUsuario], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error al obtener el historial.' });
        }
        res.json({ success: true, solicitudes: results });
    });
});

// ==========================================
// OBTENER SOLICITUDES PENDIENTES PARA EL LÍDER (¡ESTE LO DEJAS IGUAL!)
// ==========================================
app.get('/api/vacaciones/pendientes/:idLider', (req, res) => {
    const idLider = req.params.idLider;
    const query = `
        SELECT s.*, CONCAT(u.Nombre, ' ', u.Apellido) AS empleado, p.Nombre AS nombre_proyecto
        FROM solicitud_vacaciones s
        JOIN Usuario u ON s.idUsuarioSV = u.idUsuario
        LEFT JOIN usuario_proyecto up ON u.idUsuario = up.idUsuarioUP
        LEFT JOIN proyecto p ON up.idProyecto = p.idProyecto
        WHERE s.idAprobador = ? AND s.Estado = 'Pendiente'
    `;
    db.query(query, [idLider], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error al obtener solicitudes del equipo.' });
        }
        res.json({ success: true, solicitudes: results });
    });
});

// ==========================================
// PROCESAR SOLICITUD (APROBAR / RECHAZAR)
// ==========================================
app.post('/api/vacaciones/procesar', (req, res) => {
    const { idSolicitud, accion } = req.body;
    const nuevoEstado = accion === 'Aprobar' ? 'Aprobado' : 'Rechazado';
    const fechaAprobacion = new Date().toISOString().split('T')[0];

    db.query('SELECT idUsuarioSV, cantidadDias FROM solicitud_vacaciones  WHERE idSolicitud = ?', [idSolicitud], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: 'Solicitud no encontrada.' });
        }

        const { idUsuarioSV, cantidadDias } = results[0];
        const updateSolicitud = `UPDATE solicitud_vacaciones SET Estado = ?, Fecha_Aprobacion = ? WHERE idSolicitud = ?`;

        db.query(updateSolicitud, [nuevoEstado, fechaAprobacion, idSolicitud], (upErr) => {
            if (upErr) {
                return res.status(500).json({ success: false, message: 'Error al procesar la solicitud.' });
            }

            if (nuevoEstado === 'Aprobado') {
                const descontarDiasQuery = `UPDATE Usuario SET vacaciones_disponibles = vacaciones_disponibles - ? WHERE idUsuario = ?`;
                db.query(descontarDiasQuery, [cantidadDias, idUsuarioSV], (descErr) => {
                    if (descErr) console.error("Error al restar días al usuario:", descErr);
                    return res.json({ success: true, message: 'Solicitud aprobada y días descontados con éxito.' });
                });
            } else {
                res.json({ success: true, message: 'Solicitud rechazada correctamente.' });
            }
        });
    });
});

// Obtener datos actualizados de un usuario (incluyendo vacaciones_disponibles)
app.get('/api/usuario/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,
               up.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP
        FROM Usuario u
        JOIN Perfil p ON u.idPerfil = p.idPerfil
        JOIN Departamento d ON u.idDepartamento = d.idDepartamento
        LEFT JOIN usuario_proyecto up ON u.idUsuario = up.idUsuarioUP
        LEFT JOIN proyecto pro ON up.idProyecto = pro.idProyecto
        WHERE u.idUsuario = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(err);
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
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
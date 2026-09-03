// controllers/vacationController.js
const db = require('../db');
const { calcularDiasHabilesColombia } = require('../utils/holidays');


// Obtener solicitudes de un usuario
exports.obtenerMisSolicitudes = (req, res) => {
    const { idUsuario } = req.params;
    if (!idUsuario) {
        return res.status(400).json({ success: false, message: 'Falta el idUsuario' });
    }
    const query = `
        SELECT idSolicitud, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, comentarios
        FROM solicitud_vacaciones
        WHERE idUsuarioSV = ?
        ORDER BY Fecha_Solicitud DESC
    `;
    db.query(query, [idUsuario], (err, solicitudes) => {
        if (err) {
            console.error("Error SQL en mis-solicitudes:", err);
            return res.status(500).json({ success: false, message: 'Error al obtener solicitudes' });
        }
        res.json({ success: true, solicitudes });
    });
};

// Obtener solicitudes pendientes para un líder
exports.obtenerPendientesLider = (req, res) => {
    const { idLider } = req.query;
    if (!idLider) {
        return res.status(400).json({ success: false, message: 'Falta el idLider' });
    }
    const query = `
        SELECT sv.idSolicitud, sv.Fecha_Inicio, sv.Fecha_Fin, sv.cantidadDias, sv.comentarios,
               u.Nombre AS NombreEmpleado, u.Apellido AS ApellidoEmpleado
        FROM solicitud_vacaciones sv
        JOIN usuario u ON sv.idUsuarioSV = u.idUsuario
        WHERE sv.idAprobador = ? AND sv.Estado = 'Pendiente'
    `;
    db.query(query, [idLider], (err, solicitudes) => {
        if (err) {
            console.error("Error SQL en pendientes-lider:", err);
            return res.status(500).json({ success: false, message: 'Error al obtener pendientes' });
        }
        res.json({ success: true, solicitudes });
    });
};

// Crear una nueva solicitud de vacaciones (con autoincrement)
exports.solicitarVacaciones = (req, res) => {
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
    console.log(`Cálculo backend: ${cantidadDias} días hábiles entre ${fInicio} y ${fFin}`);

    if (cantidadDias === 0) {
        return res.status(400).json({
            success: false,
            message: 'El rango seleccionado no contiene días hábiles (fines de semana o festivos).'
        });
    }

    // Verificar días disponibles del usuario
    const disponibilidadQuery = 'SELECT vacaciones_disponibles FROM usuario WHERE idUsuario = ?';
    db.query(disponibilidadQuery, [idUsuario], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, message: 'Error al verificar días disponibles.' });
        }
        const disponibles = results[0].vacaciones_disponibles;
        if (disponibles < cantidadDias) {
            return res.status(400).json({
                success: false,
                message: `No tienes suficientes días disponibles. Tienes ${disponibles} y solicitas ${cantidadDias}.`
            });
        }

        // Insertar sin especificar idSolicitud (auto-increment)
        const insertQuery = `
            INSERT INTO solicitud_vacaciones
            (idUsuarioSV, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, Fecha_Solicitud, idAprobador, comentarios)
            VALUES (?, ?, ?, ?, 'Pendiente', ?, ?, ?)
        `;
        db.query(insertQuery, [idUsuario, fInicio, fFin, cantidadDias, fechaSolicitud, idAprobador, comentarios], (insErr, result) => {
            if (insErr) {
                console.error("Error SQL en inserción:", insErr);
                return res.status(500).json({ success: false, message: 'Error al registrar la solicitud.' });
            }
            res.json({
                success: true,
                message: `Solicitud creada con éxito (${cantidadDias} días hábiles) y enviada a tu líder.`,
                solicitud: {
                    idSolicitud: result.insertId,
                    Fecha_Inicio: fInicio,
                    Fecha_Fin: fFin,
                    cantidadDias,
                    Estado: 'Pendiente',
                    comentarios
                }
            });
        });
    });
};

// Procesar (aprobar/rechazar) con transacción (sin cambios en esta función)
exports.procesarSolicitud = (req, res) => {
    const { idSolicitud, accion } = req.body;
    if (!idSolicitud || !accion) {
        return res.status(400).json({ success: false, message: 'Parámetros insuficientes.' });
    }

    const nuevoEstado = (accion === 'Aprobar') ? 'Aprobado' : 'Rechazado';
    const fechaAprobacion = new Date().toISOString().split('T')[0];

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ success: false, message: 'Error al iniciar transacción.' });
        }

        const buscarSolicitud = `SELECT idUsuarioSV, cantidadDias FROM solicitud_vacaciones WHERE idSolicitud = ?`;
        db.query(buscarSolicitud, [idSolicitud], (err, results) => {
            if (err || results.length === 0) {
                return db.rollback(() => {
                    res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
                });
            }

            const { idUsuarioSV, cantidadDias } = results[0];

            const updateSolicitud = `UPDATE solicitud_vacaciones SET Estado = ?, Fecha_Aprobacion = ? WHERE idSolicitud = ?`;
            db.query(updateSolicitud, [nuevoEstado, fechaAprobacion, idSolicitud], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al actualizar solicitud:', err);
                        res.status(500).json({ success: false, message: 'Error al actualizar la solicitud.' });
                    });
                }

                if (nuevoEstado === 'Aprobado') {
                    const descontarQuery = `UPDATE usuario SET vacaciones_disponibles = vacaciones_disponibles - ? WHERE idUsuario = ?`;
                    db.query(descontarQuery, [cantidadDias, idUsuarioSV], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al descontar días:', err);
                                res.status(500).json({ success: false, message: 'Error al descontar días.' });
                            });
                        }
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error al hacer commit:', err);
                                    res.status(500).json({ success: false, message: 'Error al finalizar la transacción.' });
                                });
                            }
                            res.json({ success: true, message: 'Solicitud aprobada y días descontados con éxito.' });
                        });
                    });
                } else {
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al hacer commit:', err);
                                res.status(500).json({ success: false, message: 'Error al finalizar la transacción.' });
                            });
                        }
                        res.json({ success: true, message: 'Solicitud rechazada correctamente.' });
                    });
                }
            });
        });
    });
};
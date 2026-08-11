// controllers/vacationController.js
const db = require('../db');
const colombianHolidays = require('colombian-holidays');
const { getHolidaysByYear } = colombianHolidays;

// Función auxiliar para calcular días hábiles (incluye festivos colombianos)
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
        const diaSemana = fechaActual.getDay(); // 0=Dom, 6=Sáb
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

// Obtener solicitudes de un usuario
exports.obtenerMisSolicitudes = (req, res) => {
    const { idUsuario } = req.params;
    if (!idUsuario) {
        return res.status(400).json({ success: false, message: 'Falta el idUsuario' });
    }
    const query = `
        SELECT idSolicitud, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, comentarios
        FROM \`Solicitud de Vacaciones\`
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
        FROM \`Solicitud de Vacaciones\` sv
        JOIN \`Usuario\` u ON sv.idUsuarioSV = u.idUsuario
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

// Crear una nueva solicitud de vacaciones
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
    if (cantidadDias === 0) {
        return res.status(400).json({
            success: false,
            message: 'El rango seleccionado no contiene días hábiles (fines de semana o festivos).'
        });
    }

    // Generar un ID único (aunque en producción debería ser autoincrement)
    const idSolicitudUnico = Math.floor(100000 + Math.random() * 900000);

    const insertQuery = `
        INSERT INTO \`Solicitud de Vacaciones\` 
        (idSolicitud, idUsuarioSV, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, Fecha_Solicitud, idAprobador, comentarios)
        VALUES (?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)
    `;
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
};

// Procesar (aprobar/rechazar) una solicitud
exports.procesarSolicitud = (req, res) => {
    const { idSolicitud, accion } = req.body;
    if (!idSolicitud || !accion) {
        return res.status(400).json({ success: false, message: 'Parámetros insuficientes.' });
    }

    const nuevoEstado = (accion === 'Aprobar') ? 'Aprobado' : 'Rechazado';
    const fechaAprobacion = new Date().toISOString().split('T')[0];

    const buscarSolicitud = `SELECT idUsuarioSV, cantidadDias FROM \`Solicitud de Vacaciones\` WHERE idSolicitud = ?`;
    db.query(buscarSolicitud, [idSolicitud], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
        }
        const { idUsuarioSV, cantidadDias } = results[0];

        // Usar transacción para consistencia (pero aquí usamos dos queries secuenciales)
        const updateSolicitud = `UPDATE \`Solicitud de Vacaciones\` SET Estado = ?, Fecha_Aprobacion = ? WHERE idSolicitud = ?`;
        db.query(updateSolicitud, [nuevoEstado, fechaAprobacion, idSolicitud], (upErr) => {
            if (upErr) {
                return res.status(500).json({ success: false, message: 'Error al procesar la solicitud.' });
            }
            if (nuevoEstado === 'Aprobado') {
                const descontarDiasQuery = `UPDATE \`Usuario\` SET vacaciones_disponibles = vacaciones_disponibles - ? WHERE idUsuario = ?`;
                db.query(descontarDiasQuery, [cantidadDias, idUsuarioSV], (descErr) => {
                    if (descErr) {
                        console.error("Error al restar días al usuario:", descErr);
                        // Aquí deberíamos hacer rollback, pero como no tenemos transacción, mejor notificar
                        return res.status(500).json({ success: false, message: 'Error al descontar días. La solicitud se aprobó pero no se descontaron días.' });
                    }
                    return res.json({ success: true, message: 'Solicitud aprobada y días descontados con éxito.' });
                });
            } else {
                res.json({ success: true, message: 'Solicitud rechazada correctamente.' });
            }
        });
    });
};
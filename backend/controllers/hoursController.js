// controllers/hoursController.js
const db = require('../db');
const { getHolidaysForYear } = require('../utils/holidays'); // Importamos nuestra función

// Guardar reporte de horas semanal (soporta múltiples proyectos)
exports.guardarReporteHoras = (req, res) => {
    const { idUsuario, fechaInicioSemana, reporte } = req.body;
    if (!idUsuario || !fechaInicioSemana || !reporte) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    if (!Array.isArray(reporte) || reporte.length === 0) {
        return res.status(400).json({ success: false, message: 'El reporte debe ser un arreglo no vacío.' });
    }

    // Eliminar todos los registros de la semana para este usuario
    const sqlDelete = 'DELETE FROM reporte_horas WHERE idUsuarioRH = ? AND Fecha_Inicio_Semanal = ?';
    db.query(sqlDelete, [idUsuario, fechaInicioSemana], (delErr) => {
        if (delErr) {
            console.error('Error al eliminar reporte anterior:', delErr);
            return res.status(500).json({ success: false, message: 'Error interno.' });
        }

        // Insertar un registro por proyecto
        const insertPromises = reporte.map((item) => {
            const { idProyecto, horas } = item;
            if (!idProyecto || !Array.isArray(horas) || horas.length !== 7) {
                throw new Error('Cada proyecto debe tener un arreglo de 7 horas.');
            }
            const [horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes] = horas;
            return new Promise((resolve, reject) => {
                const sqlInsert = `
                    INSERT INTO reporte_horas
                    (idUsuarioRH, idProyectoRH, Fecha_Inicio_Semanal, horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sqlInsert, [
                    idUsuario,
                    idProyecto,
                    fechaInicioSemana,
                    parseFloat(horasLunes) || 0,
                    parseFloat(horasMartes) || 0,
                    parseFloat(horasMiercoles) || 0,
                    parseFloat(horasJueves) || 0,
                    parseFloat(horasViernes) || 0
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => {
                res.status(200).json({ success: true, message: 'Reporte guardado exitosamente.' });
            })
            .catch((err) => {
                console.error('Error al insertar reporte:', err);
                res.status(500).json({ success: false, message: 'Error al registrar las horas.' });
            });
    });
};

// Obtener reporte de horas de una semana específica (con proyectos)
exports.obtenerReporteHoras = (req, res) => {
    const { idUsuario, fechaInicioSemana } = req.query;
    if (!idUsuario || !fechaInicioSemana) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos.' });
    }

    // Calcular festivos de la semana usando nuestra función
    const lunes = new Date(fechaInicioSemana + 'T00:00:00');
    const anoActual = lunes.getFullYear();
    let listaFestivosOficiales = [];
    try {
        listaFestivosOficiales = getHolidaysForYear(anoActual) || []; // Usamos nuestra función
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

    // Obtener todos los proyectos con sus horas para esta semana
    const sqlProyectos = `
        SELECT idProyectoRH, horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes
        FROM reporte_horas
        WHERE idUsuarioRH = ? AND Fecha_Inicio_Semanal = ?
    `;
    db.query(sqlProyectos, [idUsuario, fechaInicioSemana], (err, rows) => {
        if (err) {
            console.error('Error al consultar horas:', err);
            return res.status(500).json({ success: false, message: 'Error al consultar horas.' });
        }

        const reporteProyectos = rows.map(row => ({
            idProyecto: row.idProyectoRH,
            horas: [
                parseFloat(row.horasLunes) || 0,
                parseFloat(row.horasMartes) || 0,
                parseFloat(row.horasMiercoles) || 0,
                parseFloat(row.horasJueves) || 0,
                parseFloat(row.horasViernes) || 0,
                0, 0
            ]
        }));

        // Total mensual (suma de todas las horas de todos los proyectos)
        const prefijoMes = fechaInicioSemana.substring(0, 7);
        const sqlMes = `
            SELECT SUM(horasLunes + horasMartes + horasMiercoles + horasJueves + horasViernes) as totalMes
            FROM reporte_horas
            WHERE idUsuarioRH = ? AND Fecha_Inicio_Semanal LIKE ?
        `;
        db.query(sqlMes, [idUsuario, `${prefijoMes}%`], (errMes, rowsMes) => {
            if (errMes) {
                console.error('Error en métricas mensuales:', errMes);
                return res.status(500).json({ success: false, message: 'Error en métricas mensuales.' });
            }
            const totalHorasMes = rowsMes[0]?.totalMes ? parseFloat(rowsMes[0].totalMes) : 0;
            return res.json({
                success: true,
                proyectos: reporteProyectos,
                totalHorasMes,
                minimoHorasMes: 160,
                festivosSemana
            });
        });
    });
};
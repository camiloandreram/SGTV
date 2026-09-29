// controllers/hoursController.js
const db = require('../db');
const { getHolidaysForYear, calcularDiasHabilesColombia } = require('../utils/holidays');

// Guardar reporte de horas semanal (sin cambios)
exports.guardarReporteHoras = (req, res) => {
    const { idUsuario, fechaInicioSemana, reporte } = req.body;
    if (!idUsuario || !fechaInicioSemana || !reporte) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }
    if (!Array.isArray(reporte) || reporte.length === 0) {
        return res.status(400).json({ success: false, message: 'El reporte debe ser un arreglo no vacío.' });
    }

    const sqlDelete = 'DELETE FROM reporte_horas WHERE idUsuarioRH = ? AND Fecha_Inicio_Semanal = ?';
    db.query(sqlDelete, [idUsuario, fechaInicioSemana], (delErr) => {
        if (delErr) {
            console.error('Error al eliminar reporte anterior:', delErr);
            return res.status(500).json({ success: false, message: 'Error interno.' });
        }

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
                    idUsuario, idProyecto, fechaInicioSemana,
                    parseFloat(horasLunes) || 0, parseFloat(horasMartes) || 0,
                    parseFloat(horasMiercoles) || 0, parseFloat(horasJueves) || 0,
                    parseFloat(horasViernes) || 0
                ], (err) => err ? reject(err) : resolve());
            });
        });

        Promise.all(insertPromises)
            .then(() => res.status(200).json({ success: true, message: 'Reporte guardado exitosamente.' }))
            .catch((err) => {
                console.error('Error al insertar reporte:', err);
                res.status(500).json({ success: false, message: 'Error al registrar las horas.' });
            });
    });
};

// Obtener reporte de horas de una semana específica
// Obtener reporte de horas de una semana específica
exports.obtenerReporteHoras = (req, res) => {
    const { idUsuario, fechaInicioSemana, mesReferencia } = req.query;
    if (!idUsuario || !fechaInicioSemana) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos.' });
    }

    const lunes = new Date(fechaInicioSemana + 'T00:00:00');
    const anoActual = lunes.getFullYear();

    // Festivos del año (para marcar la semana)
    let listaFestivosOficiales = [];
    try {
        listaFestivosOficiales = getHolidaysForYear(anoActual) || [];
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

    // Proyectos con horas de esta semana
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

        // ============================================================
        // MES DE REFERENCIA = el enviado por el frontend (mes actual real)
        // Fallback: mes actual del servidor
        // ============================================================
        const hoy = new Date();
        const refStr = mesReferencia || `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        const [refAnio, refMes] = refStr.split('-').map(Number);

        const primerDiaMes = new Date(refAnio, refMes - 1, 1);
        const ultimoDiaMes = new Date(refAnio, refMes, 0);

        const desde = new Date(primerDiaMes);
        desde.setDate(desde.getDate() - 6);
        const hasta = new Date(ultimoDiaMes);
        hasta.setDate(hasta.getDate() + 6);

        const toISO = (d) => d.toISOString().split('T')[0];

        const sqlMes = `
            SELECT Fecha_Inicio_Semanal, horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes
            FROM reporte_horas
            WHERE idUsuarioRH = ?
              AND Fecha_Inicio_Semanal BETWEEN ? AND ?
        `;
        db.query(sqlMes, [idUsuario, toISO(desde), toISO(hasta)], (errMes, rowsMes) => {
            if (errMes) {
                console.error('Error en métricas mensuales:', errMes);
                return res.status(500).json({ success: false, message: 'Error en métricas mensuales.' });
            }

            // Atribuir cada día al mes que corresponde (solo suma días del mes de referencia)
            let totalHorasMes = 0;
            rowsMes.forEach(row => {
                const monday = new Date(row.Fecha_Inicio_Semanal + 'T00:00:00');
                const horasPorDia = [
                    parseFloat(row.horasLunes) || 0,
                    parseFloat(row.horasMartes) || 0,
                    parseFloat(row.horasMiercoles) || 0,
                    parseFloat(row.horasJueves) || 0,
                    parseFloat(row.horasViernes) || 0
                ];
                for (let i = 0; i < 5; i++) {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    if (d.getFullYear() === refAnio && (d.getMonth() + 1) === refMes) {
                        totalHorasMes += horasPorDia[i];
                    }
                }
            });

            // Días hábiles del mes de referencia
            let diasHabilesMes = 0;
            try {
                diasHabilesMes = calcularDiasHabilesColombia(toISO(primerDiaMes), toISO(ultimoDiaMes));
            } catch (e) {
                diasHabilesMes = 22;
            }
            const minimoHorasMes = diasHabilesMes * 8;

            return res.json({
                success: true,
                proyectos: reporteProyectos,
                totalHorasMes,
                minimoHorasMes,
                festivosSemana,
                mesReferencia: refStr,
                diasHabilesMes
            });
        });
    });
};
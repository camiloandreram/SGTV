// controllers/hoursController.js
const db = require('../db');
const colombianHolidays = require('colombian-holidays');
const { getHolidaysByYear } = colombianHolidays;

// Guardar reporte de horas semanal
exports.guardarReporteHoras = (req, res) => {
    const { idUsuario, fechaInicioSemana, reporte } = req.body;
    if (!idUsuario || !fechaInicioSemana || !reporte) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    // Eliminar registro anterior de la misma semana para sobreescribir
    const sqlDelete = 'DELETE FROM `Reporte Horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` = ?';
    db.query(sqlDelete, [idUsuario, fechaInicioSemana], (delErr) => {
        if (delErr) {
            console.error('Error al eliminar reporte anterior:', delErr);
            return res.status(500).json({ success: false, message: 'Error interno.' });
        }

        // Construir objeto con horas por día
        let horasLunes = 0, horasMartes = 0, horasMiercoles = 0, horasJueves = 0, horasViernes = 0;
        const idProyectoRH = reporte[0]?.idProyecto || 1; // Asume un solo proyecto, pero debería ser por proyecto

        reporte.forEach((item) => {
            const dia = new Date(item.fecha + 'T00:00:00').getDay();
            const horas = parseFloat(item.horas) || 0;
            if (dia === 1) horasLunes = horas;
            else if (dia === 2) horasMartes = horas;
            else if (dia === 3) horasMiercoles = horas;
            else if (dia === 4) horasJueves = horas;
            else if (dia === 5) horasViernes = horas;
        });

        const sqlInsert = `
            INSERT INTO \`Reporte Horas\`
            (\`idUsuarioRH\`, \`idProyectoRH\`, \`Fecha_Inicio_Semanal\`, \`horasLunes\`, \`horasMartes\`, \`horasMiercoles\`, \`horasJueves\`, \`horasViernes\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sqlInsert, [idUsuario, idProyectoRH, fechaInicioSemana, horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes], (insErr) => {
            if (insErr) {
                console.error('Error al insertar reporte:', insErr);
                return res.status(500).json({ success: false, message: 'Error al registrar las horas.' });
            }
            return res.status(200).json({ success: true, message: 'Reporte guardado exitosamente.' });
        });
    });
};

// Obtener reporte de horas de una semana específica
exports.obtenerReporteHoras = (req, res) => {
    const { idUsuario, fechaInicioSemana } = req.query;
    if (!idUsuario || !fechaInicioSemana) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos.' });
    }

    // Calcular festivos de la semana
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

    // Consultar horas registradas
    const sqlHoras = 'SELECT horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes FROM `Reporte Horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` = ?';
    db.query(sqlHoras, [idUsuario, fechaInicioSemana], (errHoras, rowsHoras) => {
        if (errHoras) {
            console.error('Error al consultar horas:', errHoras);
            return res.status(500).json({ success: false, message: 'Error al consultar horas.' });
        }

        const reportes = [0, 0, 0, 0, 0, 0, 0];
        if (rowsHoras && rowsHoras.length > 0) {
            const registro = rowsHoras[0];
            reportes[0] = parseFloat(registro.horasLunes) || 0;
            reportes[1] = parseFloat(registro.horasMartes) || 0;
            reportes[2] = parseFloat(registro.horasMiercoles) || 0;
            reportes[3] = parseFloat(registro.horasJueves) || 0;
            reportes[4] = parseFloat(registro.horasViernes) || 0;
        }

        // Total mensual
        const prefijoMes = fechaInicioSemana.substring(0, 7);
        const sqlMes = 'SELECT SUM(horasLunes + horasMartes + horasMiercoles + horasJueves + horasViernes) as totalMes FROM `Reporte Horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` LIKE ?';
        db.query(sqlMes, [idUsuario, `${prefijoMes}%`], (errMes, rowsMes) => {
            if (errMes) {
                console.error('Error en métricas mensuales:', errMes);
                return res.status(500).json({ success: false, message: 'Error en métricas mensuales.' });
            }
            const totalHorasMes = rowsMes[0]?.totalMes ? parseFloat(rowsMes[0].totalMes) : 0;
            return res.json({ success: true, reportes, totalHorasMes, minimoHorasMes: 160, festivosSemana });
        });
    });
};
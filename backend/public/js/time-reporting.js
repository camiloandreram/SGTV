// backend/controllers/reporteHorasController.js
const db = require('../config/db'); // Ajusta la ruta a tu conexión de base de datos

export const guardarReporteHoras = async (req, res) => {
  const { idUsuario, fechaInicioSemana, reporte } = req.body;

  if (!idUsuario || !fechaInicioSemana || !reporte) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  try {
    // 1. Limpiamos reportes previos de este usuario para esta semana (evita duplicar al actualizar)
    const sqlDelete = `
      DELETE FROM \`reporte_horas\` 
      WHERE \`idUsuarioRH\` = ? AND \`Fecha_Inicio_Semanal\` = ?
    `;
    await db.query(sqlDelete, [idUsuario, fechaInicioSemana]);

    // 2. Si el usuario ingresó horas, las promediamos o guardamos según tu formato.
    // Como tu tabla actual usa columnas fijas (horasLunes, horasMartes...), agrupamos el reporte en una sola fila:
    let horasLunes = 0, horasMartes = 0, horasMiercoles = 0, horasJueves = 0, horasViernes = 0;
    let idProyectoRH = reporte[0]?.idProyecto || 1; // Tomamos el id del proyecto enviado

    reporte.forEach((item, index) => {
      // index 0=LU, 1=MA, 2=MI, 3=JU, 4=VI (Sincronizado con las cabeceras del Front)
      if (index === 0) horasLunes = item.horas;
      if (index === 1) horasMartes = item.horas;
      if (index === 2) horasMiercoles = item.horas;
      if (index === 3) horasJueves = item.horas;
      if (index === 4) horasViernes = item.horas;
    });

    const sqlInsert = `
      INSERT INTO \`reporte_horas\` 
      (\`idUsuarioRH\`, \`idProyectoRH\`, \`Fecha_Inicio_Semanal\`, \`horasLunes\`, \`horasMartes\`, \`horasMiercoles\`, \`horasJueves\`, \`horasViernes\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sqlInsert, [
      idUsuario,
      idProyectoRH,
      fechaInicioSemana,
      horasLunes,
      horasMartes,
      horasMiercoles,
      horasJueves,
      horasViernes
    ]);

    return res.status(200).json({ success: true, message: 'Reporte guardado exitosamente.' });

  } catch (error) {
    console.error('Error en MySQL al guardar reporte:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const obtenerHorasSemanales = async (req, res) => {
  const { idUsuario, fechaInicioSemana } = req.query;

  try {
    const sql = `
      SELECT * FROM \`reporte_horas\` 
      WHERE \`idUsuarioRH\` = ? AND \`Fecha_Inicio_Semanal\` = ?
    `;
    const [rows] = await db.query(sql, [idUsuario, fechaInicioSemana]);

    // Mapeamos el formato de columnas fijas de la BD al formato de arreglo que espera el Frontend
    const reportesPlanos = [];
    if (rows.length > 0) {
      const r = rows[0];
      // Reconstruimos los días ordenados de Lunes a Domingo para el Front
      reportesPlanos.push({ Fecha: fechaInicioSemana, Horas: r.horasLunes }); // Lunes (Usa la fecha de inicio)

      // Para los días siguientes, el front macheará por fecha o posición.
      // Mandemos una estructura que use el front de forma segura:
      return res.status(200).json({
        success: true,
        reportes: [
          { Fecha: fechaInicioSemana, Horas: r.horasLunes }, // Simulamos fechas consecutivas si es necesario, o resolvemos directo:
        ],
        // Datos puros de respaldo
        datosCrudos: r
      });
    }

    return res.status(200).json({ success: true, reportes: [] });
  } catch (error) {
    console.error('Error en MySQL al obtener reporte:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar tiempos.' });
  }
};
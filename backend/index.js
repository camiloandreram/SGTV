const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const colombianHolidays = require('colombian-holidays');
const getHolidaysByYear = colombianHolidays.getHolidaysByYear || colombianHolidays.default?.getHolidaysByYear;
const app = express();

    app.use(cors());
    app.use(express.json());

    app.use(express.static(path.join(__dirname, 'public')));

    // ==========================================
    // FUNCIÓN AUXILIAR: CALCULO DE DÍAS HÁBILES
    // ==========================================
    function calcularDiasHabilesColombia(fechaInicioStr, fechaFinStr) {
        let fechaActual = new Date(fechaInicioStr + 'T00:00:00');
        const fechaFin = new Date(fechaFinStr + 'T00:00:00');

        // Extrae el año dinámicamente de la fecha seleccionada
        const anoActual = fechaActual.getFullYear();

        // Obtiene el arreglo de festivos colombianos del año y los formatea a "YYYY-MM-DD"
        const festivos = getHolidaysByYear(anoActual).map(h => h.date);

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

    // ==========================================
    // LOGIN CON JOIN A PROYECTO Y DEPARTAMENTO
    // ==========================================
    app.post('/api/login', (req, res) => {
        const { email, password } = req.body;

        const selectQuery = `
            SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,\r
                up.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP\r
            FROM Usuario u\r
            JOIN Perfil p ON u.idPerfil = p.idPerfil\r
            JOIN Departamento d ON u.idDepartamento = d.idDepartamento\r
            LEFT JOIN usuario_proyecto up ON u.idUsuario = up.idUsuarioUP\r
            LEFT JOIN proyecto pro ON up.idProyecto = pro.idProyecto\r
            WHERE u.email = ? AND u.contraseña = ?`;

        db.query(selectQuery, [email, password], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }

            if (results.length > 0) {
                const user = results[0];
                delete user.contraseña; // Seguridad: remover contraseña antes de responder
                res.json({ success: true, user });
            } else {
                res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
            }
        });
    });

    // ==========================================
    // CREAR UNA NUEVA SOLICITUD DE VACACIONES
    // ==========================================
    app.post('/api/vacaciones/solicitar', (req, res) => {
        const { idUsuario, idAprobador, fechaInicio, fechaFin, comentarios } = req.body;
        const fechaSolicitud = new Date().toISOString().split('T')[0];

        // Cálculo dinámico y seguro en el servidor usando la librería
        const cantidadDias = calcularDiasHabilesColombia(fechaInicio, fechaFin);

        if (cantidadDias === 0) {
            return res.status(400).json({
                success: false,
                message: 'El rango seleccionado no contiene días hábiles (fines de semana o festivos).'
            });
        }

        // Consulta con los 7 signos '?' corregidos para evitar desfases de columnas en la DB
        const insertQuery = `
            INSERT INTO solicitud_vacaciones \r
            (idUsuarioSV, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, Fecha_Solicitud, idAprobador, comentarios)\r
            VALUES (?, ?, ?, ?, 'Pendiente', ?, ?, ?)`;

        db.query(insertQuery, [idUsuario, fechaInicio, fechaFin, cantidadDias, fechaSolicitud, idAprobador, comentarios], (insErr, result) => {
            if (insErr) {
                console.error(insErr);
                return res.status(500).json({ success: false, message: 'Error al registrar la solicitud en la base de datos.' });
            }

            res.json({
                success: true,
                message: `Solicitud creada con éxito (${cantidadDias} días hábiles) y enviada a tu líder.`,
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
    // OBTENER HISTORIAL DE SOLICITUDES DEL EMPLEADO
    // ==========================================
    app.get('/api/vacaciones/mis-solicitudes', (req, res) => {
        const { idUsuario } = req.query;

        if (!idUsuario) {
            return res.status(400).json({ success: false, message: 'Falta el idUsuario' });
        }

        const query = `
            SELECT idSolicitud, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, comentarios\r
            FROM solicitud_vacaciones\r
            WHERE idUsuarioSV = ?\r
            ORDER BY Fecha_Solicitud DESC`;

        db.query(query, [idUsuario], (err, solicitudes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Error al obtener solicitudes.' });
            }
            res.json({ success: true, solicitudes });
        });
    });

    // ==========================================
    // OBTENER SOLICITUDES PENDIENTES PARA EL LÍDER
    // ==========================================
    app.get('/api/vacaciones/pendientes-lider', (req, res) => {
        const { idLider } = req.query;

        if (!idLider) {
            return res.status(400).json({ success: false, message: 'Falta el idLider' });
        }

        const query = `
            SELECT sv.idSolicitud, sv.Fecha_Inicio, sv.Fecha_Fin, sv.cantidadDias, sv.comentarios,\r
                u.Nombre AS NombreEmpleado, u.Apellido AS ApellidoEmpleado\r
            FROM solicitud_vacaciones sv\r
            JOIN Usuario u ON sv.idUsuarioSV = u.idUsuario\r
            WHERE sv.idAprobador = ? AND sv.Estado = 'Pendiente'`;

        db.query(query, [idLider], (err, solicitudes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Error al obtener pendientes.' });
            }
            res.json({ success: true, solicitudes });
        });
    });

    // ==========================================
    // PROCESAR SOLICITUD (APROBAR O RECHAZAR)
    // ==========================================
    app.post('/api/vacaciones/procesar', (req, res) => {
        const { idSolicitud, accion } = req.body;
        const nuevoEstado = (accion === 'Aprobar') ? 'Aprobado' : 'Rechazado';
        const fechaAprobacion = new Date().toISOString().split('T')[0];

        const buscarSolicitud = `SELECT idUsuarioSV, cantidadDias FROM solicitud_vacaciones WHERE idSolicitud = ?`;

        db.query(buscarSolicitud, [idSolicitud], (err, results) => {
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

   // =================================================================
    // MÓDULO: REPORTE DE HORAS - SOLUCIÓN COMPLETA DE FLUJO Y MÉTRICAS
    // =================================================================

    // 1. ENDPOINT PARA GUARDAR LAS HORAS (POST)
    app.post('/api/reporte-horas/guardar', (req, res) => {
        const { idUsuario, fechaInicioSemana, reporte } = req.body;

        if (!idUsuario || !fechaInicioSemana || !reporte) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
        }

        // Limpiamos registros previos de esta semana exacta para evitar duplicados
        const sqlDelete = 'DELETE FROM `reporte_horas` WHERE `idUsuarioRH` = ? AND `Fecha_Inicio_Semanal` = ?';

        db.query(sqlDelete, [idUsuario, fechaInicioSemana], (delErr) => {
            if (delErr) {
                console.error('Error al limpiar reporte_horas:', delErr);
                return res.status(500).json({ success: false, message: 'Error interno en el servidor.' });
            }

            let horasLunes = 0, horasMartes = 0, horasMiercoles = 0, horasJueves = 0, horasViernes = 0;
            const idProyectoRH = reporte[0]?.idProyecto || 1;

            // Mapeamos de manera estricta basándonos en el día real de la semana (0=Domingo, 1=Lunes...)
            reporte.forEach((item) => {
                const dia = new Date(item.fecha + 'T00:00:00').getDay();
                if (dia === 1) horasLunes = parseFloat(item.horas) || 0;
                if (dia === 2) horasMartes = parseFloat(item.horas) || 0;
                if (dia === 3) horasMiercoles = parseFloat(item.horas) || 0;
                if (dia === 4) horasJueves = parseFloat(item.horas) || 0;
                if (dia === 5) horasViernes = parseFloat(item.horas) || 0;
            });

            const sqlInsert = `
                INSERT INTO \`reporte_horas\` 
                (\`idUsuarioRH\`, \`idProyectoRH\`, \`Fecha_Inicio_Semanal\`, \`horasLunes\`, \`horasMartes\`, \`horasMiercoles\`, \`horasJueves\`, \`horasViernes\`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            db.query(sqlInsert, [idUsuario, idProyectoRH, fechaInicioSemana, horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes], (insErr) => {
                if (insErr) {
                    console.error('Error al insertar en reporte_horas:', insErr);
                    return res.status(500).json({ success: false, message: 'Error al registrar las horas.' });
                }
                return res.status(200).json({ success: true, message: 'Reporte guardado exitosamente.' });
            });
        });
    });

    app.get('/api/reporte-horas', async (req, res) => {
        try {
            const { idUsuario, fechaInicioSemana } = req.query;

            // Validaciones iniciales básicas
            if (!idUsuario || !fechaInicioSemana) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan parámetros requeridos: idUsuario o fechaInicioSemana.'
                });
            }

            // 1. CÁLCULO DE DÍAS FESTIVOS DE LA SEMANA SELECCIONADA
            // Usamos 'T00:00:00' para evitar desfases por zonas horarias al instanciar la fecha
            const lunes = new Date(fechaInicioSemana + 'T00:00:00');
            const anoActual = lunes.getFullYear();

            let listaFestivosOficiales = [];
            try {
                // Manejo seguro de la importación de la librería corregida
                const getHolidays = colombianHolidays.getHolidaysByYear || colombianHolidays.default?.getHolidaysByYear;
                if (typeof getHolidays === 'function') {
                    listaFestivosOficiales = getHolidays(anoActual).map(h => h.date);
                } else {
                    listaFestivosOficiales = colombianHolidays.getHolidaysByYear(anoActual).map(h => h.date);
                }
            } catch (libErr) {
                console.warn("Advertencia: No se pudo cargar la librería de festivos, se usará arreglo vacío.", libErr);
            }

            // Evaluamos los 7 días (de Lunes a Domingo) construyendo el array de booleanos
            const festivosSemana = [];
            for (let i = 0; i < 7; i++) {
                const diaEvaluado = new Date(lunes);
                diaEvaluado.setDate(lunes.getDate() + i);

                // Extraemos el formato limpio YYYY-MM-DD
                const isoStr = diaEvaluado.toISOString().split('T')[0];
                festivosSemana.push(listaFestivosOficiales.includes(isoStr));
            }


            // 2. CONSULTA DE REGISTROS DE HORAS EN LA BASE DE DATOS (sgtv_db)
            // Ejemplo de Query: Extrae las horas de los 7 días a partir del lunes provisto
            const queryHoras = `
                SELECT horas, fecha 
                FROM reportes_tiempo 
                WHERE id_usuario = ? 
                AND fecha >= ? 
                AND fecha <= DATE_ADD(?, INTERVAL 6 DAY)
                ORDER BY fecha ASC
            `;

            // Ajusta esta línea al conector de base de datos que uses (ej. db.query, pool.execute, etc.)
            const [rowsHoras] = await db.execute(queryHoras, [idUsuario, fechaInicioSemana, fechaInicioSemana]);

            // Mapeamos las filas de la BD a un arreglo posicional estricto de 7 días [Lu, Ma, Mi, Ju, Vi, Sá, Do]
            const reportes = [0, 0, 0, 0, 0, 0, 0];
            for (let i = 0; i < 7; i++) {
                const diaEvaluado = new Date(lunes);
                diaEvaluado.setDate(lunes.getDate() + i);
                const isoStr = diaEvaluado.toISOString().split('T')[0];

                // Buscamos si la base de datos tiene un registro asignado a esta fecha específica
                const registroDia = rowsHoras.find(row => {
                    const rowDateStr = new Date(row.fecha).toISOString().split('T')[0];
                    return rowDateStr === isoStr;
                });

                if (registroDia) {
                    // Forzamos parseFloat para blindar el frontend ante strings numéricos de la BD
                    reportes[i] = parseFloat(registroDia.horas) || 0;
                }
            }


            // 3. CONSULTA DE TOTALES Y METAS MENSUALES (Evitamos nulos crónicos)
            const primerDiaMes = `${fechaInicioSemana.substring(0, 7)}-01`;
            const ultimoDiaMes = new Date(lunes.getFullYear(), lunes.getMonth() + 1, 0).toISOString().split('T')[0];

            const queryMes = `
                SELECT SUM(horas) as totalMes 
                FROM reportes_tiempo 
                WHERE id_usuario = ? 
                AND fecha >= ? 
                AND fecha <= ?
            `;
            const [rowsMes] = await db.execute(queryMes, [idUsuario, primerDiaMes, ultimoDiaMes]);

            // Blindamos el acumulado del mes: si es null (sin registros), devolvemos 0
            const totalHorasMes = rowsMes[0]?.totalMes ? parseFloat(rowsMes[0].totalMes) : 0;

            // Meta mínima exigida mensual (puedes calcularla dinámicamente o traerla de la configuración de la BD)
            // Por ejemplo, un estándar de 160 horas o consultado de una tabla de contratos
            const minimoHorasMes = 160;


            // 4. RESPUESTA DE ÉXITO INTEGRADA
            return res.json({
                success: true,
                reportes,           // Arreglo de 7 posiciones con las horas cargadas [8, 7.5, 0...]
                totalHorasMes,      // Número real blindado (ej. 45.00)
                minimoHorasMes,     // Meta del mes exigida
                festivosSemana      // Arreglo de 7 booleanos mapeados con colombian-holidays [true, false...]
            });

        } catch (error) {
            console.error('Error crítico en el endpoint GET /api/reporte-horas:', error);
            return res.status(500).json({
                success: false,
                message: 'Ocurrió un error interno en el servidor al procesar el reporte de horas.',
                error: error.message
            });
        }
    });

    // ==========================================
    // OBTENER DATOS ACTUALIZADOS DE UN USUARIO
    // ==========================================
    app.get('/api/usuario/:id', (req, res) => {
        const id = req.params.id;
        const query = `
            SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto,\r
                up.idProyecto, pro.Nombre as nombre_proyecto, pro.idResponsableP\r
            FROM Usuario u\r
            JOIN Perfil p ON u.idPerfil = p.idPerfil\r
            JOIN Departamento d ON u.idDepartamento = d.idDepartamento\r
            LEFT JOIN usuario_proyecto up ON u.idUsuario = up.idUsuarioUP\r
            LEFT JOIN proyecto pro ON up.idProyecto = pro.idProyecto\r
            WHERE u.idUsuario = ?`;

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
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
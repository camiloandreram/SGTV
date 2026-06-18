/**
 * ------------------------------------------------------------------------------------------------
 * @Name         index.js
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Backend - API REST
 * @Description  Servidor principal de la aplicación SGTV. Expone endpoints para autenticación,
 *               gestión de vacaciones (solicitud, historial, aprobación/rechazo) y reporte de horas
 *               (guardado y consulta con cálculo de festivos colombianos y métricas mensuales).
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

    const express = require('express');
    const cors = require('cors');
    const path = require('path');
    const db = require('./db');
    const colombianHolidays = require('colombian-holidays');
    const getHolidaysByYear = colombianHolidays.getHolidaysByYear || colombianHolidays.default?.getHolidaysByYear;
    const app = express();

    // ============================================================
    // CONFIGURACIÓN DEL SERVIDOR
    // ============================================================
    // description: Configuración de middlewares y archivos estáticos.

    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    // ============================================================
    // RUTA: REGISTRAR NUEVO EMPLEADO / USUARIO (POST)
    // ============================================================
    /**
     * description: Inserta un nuevo registro de empleado en la tabla usuario
     * utilizando las columnas exactas de la base de datos real.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.post('/api/usuarios', (req, res) => {
        // Extraemos las variables desde el frontend adaptadas a tu tabla
        const { nombre, apellido, telefono, contraseña, email, direccion, idPerfil, idDepartamento } = req.body;

        // Validación de campos obligatorios en base a tu esquema (los que no deberían ser null)
        if (!nombre || !apellido || !email || !contraseña || !idPerfil || !idDepartamento) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios requeridos (Nombre, Apellido, Email, Contraseña, Perfil o Departamento).'
            });
        }

        // Valores por defecto para un empleado nuevo
        const estadoInicial = 'Activo';
        const vacacionesIniciales = 15.00; // O el estándar que maneje tu sistema
        const fechaActual = new Date().toISOString().split('T')[0]; // YYYY-MM-DD para ingreso y nacimiento de prueba

        // OJO: Usamos las columnas exactas de tu tabla `usuario`
        // Si en tu motor de base de datos la columna tiene caracteres extraños por codificación,
        // asegúrate de envolverla en comillas invertidas de esta manera: `contraseña` o `contraseÃ±a`
        const sqlInsert = `
            INSERT INTO \`usuario\` 
            (\`Nombre\`, \`Apellido\`, \`telefono\`, \`contraseña\`, \`email\`, \`direccion\`, \`Fecha_de_Nacimiento\`, \`Fecha_de_Ingreso\`, \`Estado\`, \`idPerfil\`, \`idDepartamento\`, \`vacaciones_disponibles\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sqlInsert, [
            nombre,
            apellido,
            telefono || null, // Si es opcional en tu front
            contraseña,
            email,
            direccion || null,
            fechaActual, // Fecha de Nacimiento (temporal de prueba, puedes añadir el input luego)
            fechaActual, // Fecha de Ingreso (el día de hoy)
            estadoInicial,
            idPerfil,
            idDepartamento,
            vacacionesIniciales
        ], (err, result) => {
            if (err) {
                console.error('Error interno al ejecutar la inserción del usuario:', err);

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        success: false,
                        message: 'Error de registro: El correo electrónico ya se encuentra asignado a otro empleado.'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Ocurrió un error inesperado en el servidor al intentar guardar el empleado.',
                    error: err.sqlMessage || err
                });
            }

            return res.json({
                success: true,
                message: 'El empleado ha sido registrado con éxito en el sistema.',
                idUsuario: result.insertId
            });
        });
    });

    // ============================================================
    // RUTA: ACTUALIZAR EMPLEADO / USUARIO (PUT)
    // ============================================================
    /**
     * description: Actualiza los datos de un usuario existente basándose en su idUsuario
     *              y utilizando las columnas exactas de la tabla real.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.put('/api/usuarios/:id', (req, res) => {
        const idUsuario = req.params.id;
        const { nombre, apellido, telefono, contraseña, email, direccion, Estado, idPerfil, idDepartamento, vacaciones_disponibles } = req.body;

        // Validación mínima de campos obligatorios para mantener consistencia
        if (!nombre || !apellido || !email || !idPerfil || !idDepartamento) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios requeridos (Nombre, Apellido, Email, Perfil o Departamento).'
            });
        }

        // Consulta dinámica: Permite actualizar la contraseña si se envía, o mantener la actual si viene vacía
        let sqlUpdate = `
            UPDATE \`usuario\` SET 
                \`Nombre\` = ?, 
                \`Apellido\` = ?, 
                \`telefono\` = ?, 
                \`email\` = ?, 
                \`direccion\` = ?, 
                \`Estado\` = ?, 
                \`idPerfil\` = ?, 
                \`idDepartamento\` = ?,
                \`vacaciones_disponibles\` = ?
        `;

        const params = [nombre, apellido, telefono || null, email, direccion || null, Estado || 'Activo', idPerfil, idDepartamento, vacaciones_disponibles || 15.00];

        // Si el usuario digitó una nueva contraseña, la incluimos en la actualización
        if (contraseña && contraseña.trim() !== '') {
            sqlUpdate += `, \`contraseña\` = ? `;
            params.push(contraseña);
        }

        sqlUpdate += ` WHERE \`idUsuario\` = ?`;
        params.push(idUsuario);

        db.query(sqlUpdate, params, (err, result) => {
            if (err) {
                console.error('Error al actualizar el usuario:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'El correo electrónico ya está en uso por otro empleado.' });
                }
                return res.status(500).json({ success: false, message: 'Error interno en el servidor al actualizar.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
            }

            return res.json({ success: true, message: 'Los datos del empleado fueron actualizados correctamente.' });
        });
    });

    // ============================================================
    // RUTA: ELIMINACIÓN LÓGICA / INACTIVAR USUARIO (PATCH)
    // ============================================================
    /**
     * description: Cambia el estado de un usuario a 'Inactivo' para restringir su acceso
     *              sin romper la integridad referencial de reportes o vacaciones pasadas.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.patch('/api/usuarios/:id/inactivar', (req, res) => {
        const idUsuario = req.params.id;
        const sqlInactivar = 'UPDATE `usuario` SET `Estado` = \'Inactivo\' WHERE `idUsuario` = ?';

        db.query(sqlInactivar, [idUsuario], (err, result) => {
            if (err) {
                console.error('Error al inactivar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error interno al cambiar el estado.' });
            }
            return res.json({ success: true, message: 'El empleado ha sido inactivado en el sistema con éxito.' });
        });
    });

    // ============================================================
    // RUTA: ELIMINACIÓN FÍSICA (DELETE) - Usar con precaución
    // ============================================================
    /**
     * description: Elimina de manera definitiva el registro del usuario en la base de datos.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.delete('/api/usuarios/:id', (req, res) => {
        const idUsuario = req.params.id;
        const sqlDelete = 'DELETE FROM `usuario` WHERE `idUsuario` = ?';

        db.query(sqlDelete, [idUsuario], (err, result) => {
            if (err) {
                console.error('Error al eliminar físicamente al usuario:', err);
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(400).json({
                        success: false,
                        message: 'No se puede eliminar el registro de forma física porque el usuario posee solicitudes de vacaciones o reportes de horas vinculados. Se recomienda usar inactivación lógica.'
                    });
                }
                return res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar.' });
            }
            return res.json({ success: true, message: 'El registro del usuario ha sido borrado físicamente.' });
        });
    });

    // ============================================================
    // RUTA: OBTENER PERFILES (GET)
    // ============================================================
    /**
     * description: Devuelve la lista completa de perfiles disponibles en el sistema.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.get('/api/perfiles', (req, res) => {
        const query = 'SELECT idPerfil, Nombre FROM Perfil ORDER BY Nombre ASC';
        db.query(query, [], (err, results) => {
            if (err) {
                console.error('Error al obtener perfiles:', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            res.json({ success: true, data: results });
        });
    });

    // ============================================================
    // RUTA: OBTENER DEPARTAMENTOS (GET)
    // ============================================================
    /**
     * description: Devuelve la lista completa de departamentos disponibles.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.get('/api/departamentos', (req, res) => {
        const query = 'SELECT idDepartamento, Nombre FROM Departamento ORDER BY Nombre ASC';
        db.query(query, [], (err, results) => {
            if (err) {
                console.error('Error al obtener departamentos:', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            res.json({ success: true, data: results });
        });
    });

    // ============================================================
    // RUTA: OBTENER TODOS LOS USUARIOS / EMPLEADOS (GET)
    // ============================================================
    /**
     * description: Retorna la lista de todos los colaboradores registrados en el sistema,
     * trayendo los nombres de su Perfil y Departamento asociado.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    app.get('/api/usuarios', (req, res) => {
        const query = `
            SELECT 
                u.idUsuario, u.Nombre, u.Apellido, u.telefono, u.email, u.direccion, u.Estado, u.vacaciones_disponibles, u.idPerfil, u.idDepartamento,
                p.Nombre AS NombrePerfil,
                d.Nombre AS NombreDepartamento
            FROM \`usuario\` u
            LEFT JOIN \`Perfil\` p ON u.idPerfil = p.idPerfil
            LEFT JOIN \`Departamento\` d ON u.idDepartamento = d.idDepartamento
            ORDER BY u.idUsuario DESC
        `;

        db.query(query, [], (err, results) => {
            if (err) {
                console.error('Error al obtener el listado de usuarios:', err);
                return res.status(500).json({ success: false, message: 'Error interno en el servidor' });
            }
            res.json({ success: true, data: results });
        });
    });

    // ============================================================
    // FUNCIÓN AUXILIAR: CÁLCULO DE DÍAS HÁBILES EN COLOMBIA
    // ============================================================
    /**
     * description: Calcula la cantidad de días hábiles (excluyendo fines de semana y festivos
     *              colombianos) entre dos fechas dadas.
     * param: fechaInicioStr - Fecha de inicio en formato YYYY-MM-DD (string)
     * param: fechaFinStr - Fecha de fin en formato YYYY-MM-DD (string)
     * return: Número entero de días hábiles en el rango.
     */
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

    // ============================================================
    // ENDPOINT: LOGIN CON JOIN A PROYECTO Y DEPARTAMENTO
    // ============================================================
    /**
     * description: Autentica al usuario con correo y contraseña. Devuelve los datos del usuario
     *              junto con el perfil, departamento, proyecto asignado y responsable del proyecto.
     * param: email - Correo electrónico del usuario (body)
     * param: password - Contraseña del usuario (body)
     * return: Objeto JSON con success:true y el objeto user, o error 401.
     */
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
                delete user.contraseña;
                res.json({ success: true, user });
            } else {
                res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
            }
        });
    });

    // ============================================================
    // ENDPOINT: CREAR UNA NUEVA SOLICITUD DE VACACIONES
    // ============================================================
    /**
     * description: Registra una solicitud de vacaciones en la base de datos, calcula los días hábiles
     *              usando la función auxiliar y valida que el rango tenga al menos un día hábil.
     * param: idUsuario - ID del usuario solicitante (body)
     * param: idAprobador - ID del líder que aprueba (body)
     * param: fechaInicio - Fecha de inicio (body, YYYY-MM-DD)
     * param: fechaFin - Fecha de fin (body, YYYY-MM-DD)
     * param: comentarios - Comentarios opcionales (body)
     * return: JSON con success:true y los datos de la solicitud creada, o error 400 si no hay días hábiles.
     */
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

        const insertQuery = `
            INSERT INTO solicitud_vacaciones
            (idUsuarioSV, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, Fecha_Solicitud, idAprobador, comentarios)
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

    // ============================================================
    // ENDPOINT: OBTENER HISTORIAL DE SOLICITUDES DEL EMPLEADO
    // ============================================================
    /**
     * description: Devuelve todas las solicitudes de vacaciones de un usuario específico,
     *              ordenadas por fecha de solicitud descendente.
     * param: idUsuario - ID del usuario (query param)
     * return: JSON con success:true y arreglo de solicitudes.
     */
    app.get('/api/vacaciones/mis-solicitudes', (req, res) => {
        const { idUsuario } = req.query;

        if (!idUsuario) {
            return res.status(400).json({ success: false, message: 'Falta el idUsuario' });
        }

        const query = `
            SELECT idSolicitud, Fecha_Inicio, Fecha_Fin, cantidadDias, Estado, comentarios
            FROM solicitud_vacaciones
            WHERE idUsuarioSV = ?
            ORDER BY Fecha_Solicitud DESC`;

        db.query(query, [idUsuario], (err, solicitudes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Error al obtener solicitudes.' });
            }
            res.json({ success: true, solicitudes });
        });
    });

    // ============================================================
    // ENDPOINT: OBTENER SOLICITUDES PENDIENTES PARA EL LÍDER
    // ============================================================
    /**
     * description: Devuelve todas las solicitudes en estado 'Pendiente' asignadas a un líder específico,
     *              incluyendo el nombre del empleado solicitante.
     * param: idLider - ID del líder (query param)
     * return: JSON con success:true y arreglo de solicitudes pendientes.
     */
    app.get('/api/vacaciones/pendientes-lider', (req, res) => {
        const { idLider } = req.query;

        if (!idLider) {
            return res.status(400).json({ success: false, message: 'Falta el idLider' });
        }

        const query = `
            SELECT sv.idSolicitud, sv.Fecha_Inicio, sv.Fecha_Fin, sv.cantidadDias, sv.comentarios,
                u.Nombre AS NombreEmpleado, u.Apellido AS ApellidoEmpleado
            FROM solicitud_vacaciones sv
            JOIN Usuario u ON sv.idUsuarioSV = u.idUsuario
            WHERE sv.idAprobador = ? AND sv.Estado = 'Pendiente'`;

        db.query(query, [idLider], (err, solicitudes) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Error al obtener pendientes.' });
            }
            res.json({ success: true, solicitudes });
        });
    });

    // ============================================================
    // ENDPOINT: PROCESAR SOLICITUD (APROBAR O RECHAZAR)
    // ============================================================
    /**
     * description: Cambia el estado de una solicitud a 'Aprobado' o 'Rechazado'. Si se aprueba,
     *              descuenta los días hábiles del saldo de vacaciones del usuario.
     * param: idSolicitud - ID de la solicitud (body)
     * param: accion - 'Aprobar' o 'Rechazar' (body)
     * return: JSON con success:true y mensaje de confirmación.
     */
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

    // ============================================================
    // MÓDULO: REPORTE DE HORAS - ENDPOINTS
    // ============================================================

    // --- ENDPOINT: GUARDAR REPORTE SEMANAL (POST) ---
    /**
     * description: Guarda o actualiza el reporte de horas de una semana completa para un usuario.
     *              Elimina registros previos de la misma semana para evitar duplicados.
     * param: idUsuario - ID del usuario (body)
     * param: fechaInicioSemana - Fecha de inicio de la semana (body, YYYY-MM-DD)
     * param: reporte - Arreglo de objetos con idProyecto, fecha y horas (body)
     * return: JSON con success:true y mensaje de confirmación.
     */
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

    // --- ENDPOINT: OBTENER REPORTE SEMANAL CON MÉTRICAS (GET) ---
    /**
     * description: Devuelve el reporte de horas de una semana específica adaptado a la tabla
     *              reporte_horas. Calcula los festivos semanales y consolida las horas del mes.
     * param: idUsuario - ID del usuario (query)
     * param: fechaInicioSemana - Fecha de inicio de la semana (query, YYYY-MM-DD)
     */
    app.get('/api/reporte-horas', (req, res) => {
        const { idUsuario, fechaInicioSemana } = req.query;

        // Validaciones iniciales básicas
        if (!idUsuario || !fechaInicioSemana) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros requeridos: idUsuario o fechaInicioSemana.'
            });
        }

        // 1. CÁLCULO DE FESTIVOS UTILIZANDO TU INSTANCIA getHolidaysByYear
        const lunes = new Date(fechaInicioSemana + 'T00:00:00');
        const anoActual = lunes.getFullYear();
        let listaFestivosOficiales = [];

        try {
            if (typeof getHolidaysByYear === 'function') {
                listaFestivosOficiales = getHolidaysByYear(anoActual).map(h => h.date);
            }
        } catch (libErr) {
            console.warn("Advertencia: No se pudo mapear la librería de festivos:", libErr);
        }

        const festivosSemana = [];
        for (let i = 0; i < 7; i++) {
            const diaEvaluado = new Date(lunes);
            diaEvaluado.setDate(lunes.getDate() + i);
            const isoStr = diaEvaluado.toISOString().split('T')[0];
            festivosSemana.push(listaFestivosOficiales.includes(isoStr));
        }

        // 2. CONSULTA DE HORAS DE LA SEMANA EN TU TABLA REAL (reporte_horas)
        const sqlHoras = `
            SELECT horasLunes, horasMartes, horasMiercoles, horasJueves, horasViernes 
            FROM \`reporte_horas\` 
            WHERE \`idUsuarioRH\` = ? AND \`Fecha_Inicio_Semanal\` = ?
        `;

        db.query(sqlHoras, [idUsuario, fechaInicioSemana], (errHoras, rowsHoras) => {
            if (errHoras) {
                console.error('Error al consultar horas semanales:', errHoras);
                return res.status(500).json({ success: false, message: 'Error interno al consultar horas.' });
            }

            // Mapeamos las columnas de tu tabla a un arreglo de 7 posiciones para el frontend [Lu, Ma, Mi, Ju, Vi, Sá, Do]
            const reportes = [0, 0, 0, 0, 0, 0, 0];
            if (rowsHoras && rowsHoras.length > 0) {
                const registro = rowsHoras[0];
                reportes[0] = parseFloat(registro.horasLunes) || 0;
                reportes[1] = parseFloat(registro.horasMartes) || 0;
                reportes[2] = parseFloat(registro.horasMiercoles) || 0;
                reportes[3] = parseFloat(registro.horasJueves) || 0;
                reportes[4] = parseFloat(registro.horasViernes) || 0;
                // Sábado y Domingo quedan en 0 por defecto al no existir en tu estructura actual de columnas
            }

            // 3. CONSULTA CONSOLIDADA DEL MES COMPLETAMENTE ADAPTADA A TU TABLA
            const prefijoMes = fechaInicioSemana.substring(0, 7); // Extrae "YYYY-MM"

            const sqlMes = `
                SELECT 
                    SUM(horasLunes + horasMartes + horasMiercoles + horasJueves + horasViernes) as totalMes
                FROM \`reporte_horas\`
                WHERE \`idUsuarioRH\` = ? AND \`Fecha_Inicio_Semanal\` LIKE ?
            `;

            db.query(sqlMes, [idUsuario, `${prefijoMes}%`], (errMes, rowsMes) => {
                if (errMes) {
                    console.error('Error al calcular el consolidado mensual:', errMes);
                    return res.status(500).json({ success: false, message: 'Error interno al procesar métricas del mes.' });
                }

                const totalHorasMes = rowsMes[0]?.totalMes ? parseFloat(rowsMes[0].totalMes) : 0;
                const minimoHorasMes = 160; // Meta fija de horas mensuales exigidas

                // 4. RETORNO DE DATA SINCRONIZADA
                return res.json({
                    success: true,
                    reportes,
                    totalHorasMes,
                    minimoHorasMes,
                    festivosSemana
                });
            });
        });
    });

    // ============================================================
    // ENDPOINT: OBTENER DATOS ACTUALIZADOS DE UN USUARIO
    // ============================================================
    /**
     * description: Devuelve los datos completos de un usuario (incluyendo perfil, departamento,
     *              proyecto asignado y responsable) a partir de su ID.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: id - ID del usuario (path param)
     * return: JSON con success:true y el objeto user.
     */
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

    // ============================================================
    // RUTA PRINCIPAL - SERVIDOR DE ARCHIVOS ESTÁTICOS
    // ============================================================
    /**
     * description: Sirve el archivo index.html del frontend para la ruta raíz.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     */
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // ============================================================
    // INICIO DEL SERVIDOR
    // ============================================================
    /**
     * description: Inicia el servidor en el puerto especificado (3000 por defecto).
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     */
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
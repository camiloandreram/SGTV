/**
 * ------------------------------------------------------------------------------------------------
 * @Name         api.js
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Services / API
 * @Description  Servicio centralizado de comunicación con el backend usando Axios.
 *               Contiene todos los endpoints para los módulos de autenticación,
 *               vacaciones y reporte de horas.
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

  // src/services/api.js
  import axios from 'axios';

  /**
   * description: Instancia de Axios configurada con la URL base del backend y el Content-Type por defecto.
   * author: Camilo Andres Ramirez Ospina | 2026-06-17
   */
  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  /**
   * description: Objeto que agrupa todos los métodos de llamada a la API.
   * author: Camilo Andres Ramirez Ospina | 2026-06-17
   */
  export const apiService = {

    /**
     * description: Autentica al usuario con correo y contraseña.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: email - Correo electrónico del usuario
     * param: password - Contraseña del usuario
     * return: Promise con los datos de la respuesta (usuario y token)
     */
    login: async (email, password) => {
      const response = await api.post('/login', { email, password });
      return response.data; // Axios guarda la respuesta del servidor directamente en .data
    },
    // --- MÓDULO GESTIÓN DE EMPLEADOS ---

    /**
     * description: Obtiene la lista de perfiles/roles disponibles desde el backend.
     * author: Camilo Andres Ramirez Ospina | 2026-06-18
     */
    obtenerPerfiles: async () => {
      const response = await api.get('/perfiles');
      return response.data;
    },

    /**
     * description: Obtiene la lista de departamentos de la organización.
     * author: Camilo Andres Ramirez Ospina | 2026-06-18
     */
    obtenerDepartamentos: async () => {
      const response = await api.get('/departamentos');
      return response.data;
    },

    /**
     * description: Envía los datos del formulario para dar de alta a un nuevo empleado.
     * author: Camilo Andres Ramirez Ospina | 2026-06-18
     */
    guardarUsuario: async (datosUsuario) => {
      const response = await api.post('/usuarios', datosUsuario);
      return response.data;
    },
    // Apéndice dentro del bloque: --- MÓDULO GESTIÓN DE EMPLEADOS ---

    /**
     * description: Envía los cambios de un usuario específico para ser actualizados.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     * param:       idUsuario - ID del empleado a modificar
     * param:       datosActualizados - Objeto con los nuevos valores de las columnas
     */
    actualizarUsuario: async (idUsuario, datosActualizados) => {
      const response = await api.put(`/usuarios/${idUsuario}`, datosActualizados);
      return response.data;
    },

    /**
     * description: Realiza una baja lógica cambiando el estado del colaborador a Inactivo.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    inactivarUsuario: async (idUsuario) => {
      const response = await api.patch(`/usuarios/${idUsuario}/inactivar`);
      return response.data;
    },

    /**
     * description: Borra de forma definitiva el registro del usuario (Físico).
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    eliminarUsuarioFisico: async (idUsuario) => {
      const response = await api.delete(`/usuarios/${idUsuario}`);
      return response.data;
    },

    /**
     * description: Obtiene la lista completa de colaboradores con sus departamentos y perfiles mapeados.
     * author:      Camilo Andres Ramirez Ospina | 2026-06-18
     */
    obtenerTodosLosUsuarios: async () => {
      const response = await api.get('/usuarios');
      return response.data;
    },

    // --- MÓDULO DE VACACIONES ---

    /**
     * description: Envía una solicitud de vacaciones al backend.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: datosSolicitud - Objeto con idUsuario, idAprobador, fechaInicio, fechaFin, comentarios
     * return: Promise con el resultado de la operación
     */
    solicitarVacaciones: async (datosSolicitud) => {
      const response = await api.post('/vacaciones/solicitar', datosSolicitud);
      return response.data;
    },

    /**
     * description: Obtiene el historial de solicitudes de vacaciones de un usuario.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: idUsuario - Identificador del usuario
     * return: Promise con la lista de solicitudes
     */
    obtenerMisSolicitudes: async (idUsuario) => {
      const response = await api.get(`/vacaciones/mis-solicitudes/${idUsuario}`);
      return response.data;
    },

    /**
     * description: Obtiene las solicitudes de vacaciones pendientes de aprobación para un líder.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: idLider - Identificador del líder
     * return: Promise con la lista de solicitudes pendientes
     */
    obtenerPendientesLider: async (idLider) => {
      const response = await api.get(`/vacaciones/pendientes-lider`, {
        params: { idLider }
      });
      return response.data;
    },

    /**
     * description: Procesa (aprueba o rechaza) una solicitud de vacaciones.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: idSolicitud - Identificador de la solicitud
     * param: accion - 'Aprobar' o 'Rechazar'
     * return: Promise con el resultado de la operación
     */
    procesarSolicitud: async (idSolicitud, accion) => {
      const response = await api.post('/vacaciones/procesar', { idSolicitud, accion });
      return response.data;
    },

    /**
     * description: Obtiene los datos actualizados de un usuario (días de vacaciones restantes, etc.).
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: idUsuario - Identificador del usuario
     * return: Promise con los datos del usuario
     */
    obtenerDatosUsuarioActualizados: async (idUsuario) => {
      const response = await api.get(`/usuario/${idUsuario}`);
      return response.data;
    },

    // --- MÓDULO REPORTE DE HORAS ---

    /**
     * description: Obtiene las horas registradas de una semana específica para un usuario.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: idUsuario - Identificador del usuario
     * param: fechaInicioSemana - Fecha de inicio de la semana en formato YYYY-MM-DD
     * return: Promise con los reportes, festivos y métricas mensuales
     */
    obtenerHorasSemanales: async (idUsuario, fechaInicioSemana) => {
      const response = await api.get('/reporte-horas', {
        params: { idUsuario, fechaInicioSemana }
      });
      return response.data;
    },

    /**
     * description: Guarda el reporte de horas de una semana completa.
     * author: Camilo Andres Ramirez Ospina | 2026-06-17
     * param: datosReporte - Objeto con idUsuario, fechaInicioSemana y reporte (array de registros diarios)
     * return: Promise con el resultado de la operación
     */
    guardarReporteHoras: async (datosReporte) => {
      const response = await api.post('/reporte-horas/guardar', datosReporte);
      return response.data;
    }
};
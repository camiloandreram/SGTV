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
 * 2026-08-09    Camilo Andres Ramirez Ospina    Agregado interceptor JWT y guardado de token
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url === '/login';
      if (!isLoginRequest) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.success) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error en el servidor' };
      }
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  },

  obtenerPerfiles: async () => {
    try {
      const response = await api.get('/usuarios/perfiles');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Error al obtener perfiles' };
    }
  },
  obtenerDepartamentos: async () => {
    try {
      const response = await api.get('/usuarios/departamentos');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Error al obtener departamentos' };
    }
  },
  obtenerTodosLosUsuarios: async () => {
    try {
      const response = await api.get('/usuarios');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Error al obtener usuarios' };
    }
  },
  obtenerUsuarioPorId: async (id) => {
    try {
      const response = await api.get(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      return { success: false, message: 'Error al obtener el usuario' };
    }
  },
  guardarUsuario: async (datos) => {
    try {
      const response = await api.post('/usuarios', datos);
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al guardar el usuario' };
      }
      return { success: false, message: 'Error de conexión al guardar' };
    }
  },
  actualizarUsuario: async (id, datos) => {
    try {
      const response = await api.put(`/usuarios/${id}`, datos);
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al actualizar' };
      }
      return { success: false, message: 'Error de conexión al actualizar' };
    }
  },
  inactivarUsuario: async (id) => {
    try {
      const response = await api.patch(`/usuarios/${id}/inactivar`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al inactivar' };
      }
      return { success: false, message: 'Error de conexión al inactivar' };
    }
  },
  eliminarUsuarioFisico: async (id) => {
    try {
      const response = await api.delete(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al eliminar' };
      }
      return { success: false, message: 'Error de conexión al eliminar' };
    }
  },

  // Vacaciones
  obtenerMisSolicitudes: async (idUsuario) => {
    try {
      const response = await api.get(`/vacaciones/mis-solicitudes/${idUsuario}`);
      return response.data;
    } catch (error) {
      return { success: false, message: 'Error al obtener solicitudes' };
    }
  },
  obtenerPendientesLider: async (idLider) => {
    try {
      const response = await api.get('/vacaciones/pendientes-lider', { params: { idLider } });
      return response.data;
    } catch (error) {
      return { success: false, message: 'Error al obtener pendientes' };
    }
  },
  solicitarVacaciones: async (datos) => {
    try {
      const response = await api.post('/vacaciones/solicitar', datos);
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al solicitar vacaciones' };
      }
      return { success: false, message: 'Error de conexión' };
    }
  },
  procesarSolicitud: async (idSolicitud, accion) => {
    try {
      const response = await api.post('/vacaciones/procesar', { idSolicitud, accion });
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al procesar' };
      }
      return { success: false, message: 'Error de conexión' };
    }
  },

  // Reporte de horas
  obtenerHorasSemanales: async (idUsuario, fechaInicioSemana) => {
    try {
      const response = await api.get('/reporte-horas', {
        params: { idUsuario, fechaInicioSemana }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al obtener horas' };
      }
      return { success: false, message: 'Error de conexión' };
    }
  },
  guardarReporteHoras: async (datos) => {
    try {
      const response = await api.post('/reporte-horas/guardar', datos);
      return response.data;
    } catch (error) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Error al guardar reporte' };
      }
      return { success: false, message: 'Error de conexión' };
    }
  },
forgotPassword: async (email) => {
  try {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  } catch (error) {
    if (error.response) {
      return { success: false, message: error.response.data?.message || 'Error al procesar la solicitud.' };
    }
    return { success: false, message: 'Error de conexión con el servidor.' };
  }
},
resetPassword: async (token, nuevaContraseña, confirmarContraseña) => {
  try {
    const response = await api.post('/reset-password', { token, nuevaContraseña, confirmarContraseña });
    return response.data;
  } catch (error) {
    if (error.response) {
      return { success: false, message: error.response.data?.message || 'Error al restablecer la contraseña.' };
    }
    return { success: false, message: 'Error de conexión con el servidor.' };
  }
}
};
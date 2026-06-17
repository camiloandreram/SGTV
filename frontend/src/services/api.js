// src/services/api.js
import axios from 'axios';

// Creamos una instancia centralizada de Axios con la URL base de tu backend
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiService = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data; // Axios guarda la respuesta del servidor directamente en .data
  },

  // --- MÓDULO DE VACACIONES ---
  solicitarVacaciones: async (datosSolicitud) => {
    const response = await api.post('/vacaciones/solicitar', datosSolicitud);
    return response.data;
  },

  obtenerMisSolicitudes: async (idUsuario) => {
    const response = await api.get(`/vacaciones/mis-solicitudes/${idUsuario}`);
    return response.data;
  },

  obtenerPendientesLider: async (idLider) => {
    const response = await api.get(`/vacaciones/pendientes-lider`, {
      params: { idLider }
    });
    return response.data;
  },

  procesarSolicitud: async (idSolicitud, accion) => {
    const response = await api.post('/vacaciones/procesar', { idSolicitud, accion });
    return response.data;
  },

  obtenerDatosUsuarioActualizados: async (idUsuario) => {
    const response = await api.get(`/usuario/${idUsuario}`);
    return response.data;
  },

  // --- MÓDULO REPORTE DE HORAS ---
  obtenerHorasSemanales: async (idUsuario, fechaInicioSemana) => {
    const response = await api.get('/reporte-horas', {
      params: { idUsuario, fechaInicioSemana }
    });
    return response.data;
  },

  guardarReporteHoras: async (datosReporte) => {
    const response = await api.post('/reporte-horas/guardar', datosReporte);
    return response.data;
  }
};



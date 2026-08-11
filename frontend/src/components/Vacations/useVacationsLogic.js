import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';

export const useVacationsLogic = (user, refreshUser) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [solicitudesPendientesLider, setSolicitudesPendientesLider] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    if (!startDate || !endDate) {
      setCalculatedDays(0);
      return;
    }
    let fechaActual = new Date(startDate + 'T00:00:00');
    const fechaFin = new Date(endDate + 'T00:00:00');

    if (fechaActual > fechaFin) {
      setCalculatedDays(0);
      return;
    }

    let diasHabiles = 0;
    while (fechaActual <= fechaFin) {
      const diaSemana = fechaActual.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasHabiles++;
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    setCalculatedDays(diasHabiles);
  }, [startDate, endDate]);

  const cargarMisSolicitudes = useCallback(async () => {
    if (!user?.idUsuario) return;
    try {
      const data = await apiService.obtenerMisSolicitudes(user.idUsuario);
      if (data.success) setMisSolicitudes(data.solicitudes);
    } catch (err) {
      console.error('Error cargando solicitudes con Axios:', err);
    }
  }, [user?.idUsuario]);

  const cargarSolicitudesLider = useCallback(async () => {
    if (!user?.idUsuario) return;
    try {
      const data = await apiService.obtenerPendientesLider(user.idUsuario);
      if (data.success) setSolicitudesPendientesLider(data.solicitudes);
    } catch (err) {
      console.error('Error cargando solicitudes de líder con Axios:', err);
    }
  }, [user?.idUsuario]);

  // CORREGIDO: Se ejecuta si es responsable directo O si su idPerfil es 2 (Líder)
  useEffect(() => {
    if (user) {
      cargarMisSolicitudes();
      if (user.idUsuario === user.idResponsableP || user.idPerfil === 2) {
        cargarSolicitudesLider();
      }
    }
  }, [user, cargarMisSolicitudes, cargarSolicitudesLider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!startDate || !endDate) {
      setMessage({ text: 'Por favor, selecciona ambas fechas.', type: 'danger' });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setMessage({ text: 'La fecha de inicio no puede ser mayor a la fecha de fin.', type: 'danger' });
      return;
    }

    if (calculatedDays === 0) {
      setMessage({ text: 'El rango seleccionado solo contiene días no hábiles.', type: 'danger' });
      return;
    }

    setLoading(true);

    try {
      const data = await apiService.solicitarVacaciones({
        idUsuario: user.idUsuario,
        idAprobador: user.idResponsableP || 1,
        fecha_inicio: startDate,
        fecha_fin: endDate,
        comentarios: comments
      });

      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        setStartDate('');
        setEndDate('');
        setComments('');
        cargarMisSolicitudes();
        refreshUser();
      } else {
        setMessage({ text: data.message, type: 'danger' });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage({ text: err.response.data.message, type: 'danger' });
      } else {
        setMessage({ text: 'Error de conexión con el servidor.', type: 'danger' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarSolicitud = async (idSolicitud, accion) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${accion.toLowerCase()} esta solicitud?`)) return;

    try {
      const data = await apiService.procesarSolicitud(idSolicitud, accion);
      if (data.success) {
        alert(data.message);
        cargarSolicitudesLider();
        cargarMisSolicitudes();
        refreshUser();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error al procesar solicitud con Axios:', err);
      alert('No se pudo procesar la solicitud en este momento.');
    }
  };

  return {
    startDate, setStartDate,
    endDate, setEndDate,
    comments, setComments,
    misSolicitudes,
    solicitudesPendientesLider,
    message,
    loading,
    calculatedDays,
    handleSubmit,
    handleProcesarSolicitud
  };
};
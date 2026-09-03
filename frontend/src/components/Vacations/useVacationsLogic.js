import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { calcularDiasHabilesColombia } from '../../utils/holidays';

export const useVacationsLogic = (user, refreshUser) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [solicitudesPendientesLider, setSolicitudesPendientesLider] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Cálculo de días hábiles en frontend (solo estimación)
  useEffect(() => {
    if (!startDate || !endDate) {
      setCalculatedDays(0);
      return;
    }
    const dias = calcularDiasHabilesColombia(startDate, endDate);
    setCalculatedDays(dias);
  }, [startDate, endDate]);

  const cargarMisSolicitudes = useCallback(async () => {
    if (!user?.idUsuario) return;
    try {
      const data = await apiService.obtenerMisSolicitudes(user.idUsuario);
      if (data.success) setMisSolicitudes(data.solicitudes);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    }
  }, [user?.idUsuario]);

  const cargarSolicitudesLider = useCallback(async () => {
    if (!user?.idUsuario) return;
    try {
      const data = await apiService.obtenerPendientesLider(user.idUsuario);
      if (data.success) setSolicitudesPendientesLider(data.solicitudes);
    } catch (err) {
      console.error('Error cargando solicitudes de líder:', err);
    }
  }, [user?.idUsuario]);

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
      setMessage({ text: 'Error de conexión con el servidor.', type: 'danger' });
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
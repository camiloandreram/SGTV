import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../../services/api';
import { calcularDiasHabilesColombia } from '../../utils/holidays';

// Helpers de fecha
const toLocalISO = (str) => String(str).substring(0, 10);
const fmtFecha = (str) => {
  const s = toLocalISO(str);
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

export const useVacationsLogic = (user, refreshUser) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [solicitudesPendientesLider, setSolicitudesPendientesLider] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [conflicto, setConflicto] = useState(null);

  // Cálculo de días hábiles en frontend (solo estimación)
  useEffect(() => {
    if (!startDate || !endDate) {
      setCalculatedDays(0);
      return;
    }
    const dias = calcularDiasHabilesColombia(startDate, endDate);
    setCalculatedDays(dias);
  }, [startDate, endDate]);

  // Detectar solapamiento con solicitudes existentes (Pendiente o Aprobado)
  useEffect(() => {
    if (!startDate || !endDate) {
      setConflicto(null);
      return;
    }
    const iniNuevo = new Date(startDate + 'T00:00:00');
    const finNuevo = new Date(endDate + 'T00:00:00');
    if (isNaN(iniNuevo.getTime()) || isNaN(finNuevo.getTime())) {
      setConflicto(null);
      return;
    }

    const encontrada = misSolicitudes.find(sol => {
      if (sol.Estado === 'Rechazado') return false;
      const ini = new Date(toLocalISO(sol.Fecha_Inicio) + 'T00:00:00');
      const fin = new Date(toLocalISO(sol.Fecha_Fin) + 'T00:00:00');
      return iniNuevo <= fin && ini <= finNuevo;
    });

    setConflicto(encontrada || null);
  }, [startDate, endDate, misSolicitudes]);

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
    if (conflicto) {
      setMessage({
        text: `Ya tienes una solicitud ${conflicto.Estado.toLowerCase()} en el rango ${fmtFecha(conflicto.Fecha_Inicio)} a ${fmtFecha(conflicto.Fecha_Fin)}. Elige otras fechas.`,
        type: 'danger'
      });
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
        setConflicto(null);
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
    conflicto,
    handleSubmit,
    handleProcesarSolicitud
  };
};
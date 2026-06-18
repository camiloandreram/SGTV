/**
 * ------------------------------------------------------------------------------------------------
 * @Name         useVacationsLogic
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Vacations Module
 * @Description  Custom React hook que maneja la lógica de solicitudes de vacaciones: cálculo de días,
 *               envío de formulario, aprobación/rechazo y consulta de historial.
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial (adaptado de LWC a React)
 * ------------------------------------------------------------------------------------------------
**/

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';

/**
 * Hook principal que encapsula toda la lógica de negocio de vacaciones.
 *
 * description: Hook para gestionar solicitudes de vacaciones.
 * param: {Object} user - Objeto usuario con idUsuario, idResponsableP, etc.
 * param: {Function} refreshUser - Función para refrescar los datos del usuario.
 * return: {Object} - Variables de estado y funciones para el componente.
**/
export const useVacationsLogic = (user, refreshUser) => {

  // Fecha de inicio del periodo de vacaciones (formato YYYY-MM-DD)
  const [startDate, setStartDate] = useState('');

  // Fecha de fin del periodo de vacaciones (formato YYYY-MM-DD)
  const [endDate, setEndDate] = useState('');

  // Comentarios opcionales que el usuario escribe al solicitar vacaciones
  const [comments, setComments] = useState('');

  // Lista de solicitudes de vacaciones que ha hecho el usuario actual (historial)
  const [misSolicitudes, setMisSolicitudes] = useState([]);

  // Lista de solicitudes pendientes que el líder debe revisar
  const [solicitudesPendientesLider, setSolicitudesPendientesLider] = useState([]);

  // Mensaje de retroalimentación para el usuario (texto y tipo: 'success' o 'danger')
  const [message, setMessage] = useState({ text: '', type: '' });

  // Indicador de carga para deshabilitar la interfaz durante operaciones asíncronas
  const [loading, setLoading] = useState(false);

  // Número de días hábiles (sin fines de semana) calculado a partir de startDate y endDate
  const [calculatedDays, setCalculatedDays] = useState(0);

  /**
   * description: Efecto que recalcula los días hábiles cada vez que cambian startDate o endDate.
   *              Recorre día a día contando solo de lunes a viernes.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
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

  /**
   * description: Obtiene el historial de solicitudes del usuario actual mediante apiService.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const cargarMisSolicitudes = useCallback(async () => {
    if (!user?.idUsuario) return;
    try {
      const data = await apiService.obtenerMisSolicitudes(user.idUsuario);
      if (data.success) setMisSolicitudes(data.solicitudes);
    } catch (err) {
      console.error('Error cargando solicitudes con Axios:', err);
    }
  }, [user?.idUsuario]);

  /**
   * description: Obtiene las solicitudes pendientes de aprobación si el usuario es líder.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const cargarSolicitudesLider = useCallback(async () => {
    if (!user?.idUsuario) return;
    try {
      const data = await apiService.obtenerPendientesLider(user.idUsuario);
      if (data.success) setSolicitudesPendientesLider(data.solicitudes);
    } catch (err) {
      console.error('Error cargando solicitudes de líder con Axios:', err);
    }
  }, [user?.idUsuario]);

  /**
   * description: Al cargar el usuario, se obtienen sus solicitudes y si es líder, también las pendientes.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  useEffect(() => {
    if (user) {
      cargarMisSolicitudes();
      if (user.idUsuario === user.idResponsableP) {
        cargarSolicitudesLider();
      }
    }
  }, [user, cargarMisSolicitudes, cargarSolicitudesLider]);

  /**
   * description: Maneja el envío del formulario para crear una nueva solicitud de vacaciones.
   *              Valida fechas, días hábiles y envía los datos al API.
   * param: {Event} e - Evento del formulario.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
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
        fechaInicio: startDate,
        fechaFin: endDate,
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

  /**
   * description: Maneja la aprobación o rechazo de una solicitud pendiente (acción del líder).
   * param: {number|string} idSolicitud - ID de la solicitud.
   * param: {string} accion - 'Aprobar' o 'Rechazar'.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
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

  /**
   * description: Exposición de variables y funciones para el componente que consuma este hook.
   * return: {Object} - Interfaz para el componente.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
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
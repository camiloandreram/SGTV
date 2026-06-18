/**
 * ------------------------------------------------------------------------------------------------
 * @Name         useTimeReportingLogic
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Time Reporting Module
 * @Description  Custom React hook para la gestión de reporte de horas semanal: navegación,
 *               carga/guardado de horas, manejo de festivos y cálculo de métricas mensuales.
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';

/**
 * Hook principal para la lógica de reporte de tiempos.
 * description: Gestiona navegación semanal, horas por proyecto, festivos, acumulados y envío.
 * param: {Object} user - Objeto usuario con idUsuario, idProyecto, etc.
 * return: {Object} - Variables de estado y funciones para el componente.
 * author: Camilo Andres Ramirez Ospina
 * date: 2026-06-17
**/
export const useTimeReportingLogic = (user) => {

  // Fecha de referencia para calcular la semana actual (lunes a domingo)
  const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());

  // Texto que muestra el rango de la semana en formato ISO (YYYY-MM-DD - YYYY-MM-DD)
  const [weekRangeText, setWeekRangeText] = useState('');

  // Arreglo de objetos que representan cada día de la semana (etiqueta, fecha de visualización e ISO)
  const [weekHeaders, setWeekHeaders] = useState([]);

  // Lista de proyectos con sus arreglos de horas diarias
  const [projects, setProjects] = useState([]);

  // Mensaje de retroalimentación (texto y tipo)
  const [message, setMessage] = useState({ text: '', type: '' });

  // Meta de horas semanales (se ajusta dinámicamente según festivos)
  const [metaHoras, setMetaHoras] = useState(40);

  // Total de horas trabajadas en el mes (acumulado de todas las semanas)
  const [totalMesTrabajado, setTotalMesTrabajado] = useState(0);

  // Mínimo de horas mensuales exigido por el proyecto o empresa
  const [minimoMesExigido, setMinimoMesExigido] = useState(0);

  // Indica si la semana mostrada pertenece a un mes futuro (se deshabilitan ediciones)
  const [esMesFuturo, setEsMesFuturo] = useState(false);

  // Arreglo de 7 booleanos que indican si cada día es festivo (proporcionado por el Backend)
  const [festivosSemana, setFestivosSemana] = useState([false, false, false, false, false, false, false]);

  // Etiquetas cortas para los días de la semana (lunes a domingo)
  const weekDaysLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

  /**
   * description: Convierte un objeto Date a cadena ISO (YYYY-MM-DD).
   * param: {Date} date - La fecha a convertir.
   * return: {string} - Cadena ISO.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const obtenerFormatoISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * description: Reconstruye el esqueleto visual y cronológico de la semana a partir de una fecha base.
   *              Calcula el lunes, los encabezados de días y la bandera de mes futuro.
   * param: {Date} baseDate - Fecha de referencia para anclar la semana.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const updateWeekPeriod = useCallback((baseDate) => {
    const d = new Date(baseDate);
    const dayOfWeek = d.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(d);
    monday.setDate(d.getDate() + distanceToMonday);

    const hoy = new Date();
    const inicioMesHoy = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesFila = new Date(monday.getFullYear(), monday.getMonth(), 1);
    setEsMesFuturo(inicioMesFila > inicioMesHoy);

    const headers = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      const stringFechaISO = obtenerFormatoISO(currentDay);

      headers.push({
        label: weekDaysLabels[i],
        display: `${weekDaysLabels[i]} ${currentDay.getDate()}/${currentDay.getMonth() + 1}`,
        fullDateStr: stringFechaISO
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setWeekRangeText(`${obtenerFormatoISO(monday)} - ${obtenerFormatoISO(sunday)}`);
    setWeekHeaders(headers);
  }, []);

  /**
   * description: Carga las horas semanales, acumulados mensuales y festivos desde el Backend.
   *              Construye la lista de proyectos con el proyecto asignado y los datos de horas.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const cargarHorasRegistradas = useCallback(async () => {
    if (!user?.idUsuario || weekHeaders.length === 0) return;

    const proyectoBase = {
      id: user.idProyecto || 1,
      name: user.nombre_proyecto || 'Proyecto Asignado',
      description: 'Asignación Actual / Desarrollo',
      hours: [0, 0, 0, 0, 0, 0, 0]
    };

    try {
      const fechaInicioSemana = weekHeaders[0].fullDateStr;
      const response = await apiService.obtenerHorasSemanales(user.idUsuario, fechaInicioSemana);

      if (response && response.success) {
        if (response.totalHorasMes !== undefined) setTotalMesTrabajado(response.totalHorasMes);
        if (response.minimoHorasMes !== undefined) setMinimoMesExigido(response.minimoHorasMes);

        if (response.festivosSemana && response.festivosSemana.length === 7) {
          setFestivosSemana(response.festivosSemana);

          let diasFestivosLaborales = 0;
          for (let i = 0; i < 5; i++) {
            if (response.festivosSemana[i] === true) diasFestivosLaborales++;
          }
          setMetaHoras(40 - (diasFestivosLaborales * 8));
        } else {
          setFestivosSemana([false, false, false, false, false, false, false]);
          setMetaHoras(40);
        }

        if (response.reportes && response.reportes.length > 0) {
          response.reportes.forEach((horas, index) => {
            proyectoBase.hours[index] = horas;
          });
        }
      } else {
        setMessage({ text: 'No se pudieron sincronizar las metas mensuales con el servidor.', type: 'danger' });
      }
      setProjects([proyectoBase]);
    } catch (err) {
      console.error('Error al recuperar horas desde el hook:', err);
      setMessage({ text: 'Error de red con el servidor. Desplegando entorno local.', type: 'danger' });
      setProjects([proyectoBase]);
    }
  }, [user, weekHeaders]);

  /**
   * description: Cuando cambia la fecha de referencia, se reconstruye la semana.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  useEffect(() => {
    updateWeekPeriod(currentReferenceDate);
  }, [currentReferenceDate, updateWeekPeriod]);

  /**
   * description: Cuando los encabezados de semana están listos, se cargan las horas.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  useEffect(() => {
    if (weekHeaders.length > 0) {
      cargarHorasRegistradas();
    }
  }, [weekHeaders, cargarHorasRegistradas]);

  /**
   * description: Navega una semana hacia adelante o hacia atrás.
   *              Reinicia proyectos, festivos y limpia mensajes.
   * param: {string} direction - 'prev' o 'next'.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const handleNavigateWeek = (direction) => {
    const newDate = new Date(currentReferenceDate);
    if (direction === 'prev') {
      newDate.setDate(currentReferenceDate.getDate() - 7);
    } else if (direction === 'next') {
      newDate.setDate(currentReferenceDate.getDate() + 7);
    }
    setCurrentReferenceDate(newDate);
    setProjects([]);
    setFestivosSemana([false, false, false, false, false, false, false]);
    setMessage({ text: '', type: '' });
  };

  /**
   * description: Actualiza el valor de horas de un proyecto y día específico.
   *              No permite editar si el mes es futuro o el día es festivo.
   * param: {number} projectIndex - Índice del proyecto en el arreglo projects.
   * param: {number} dayIndex - Índice del día (0=lunes, 6=domingo).
   * param: {string|number} value - Nuevo valor de horas.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const handleHourChange = (projectIndex, dayIndex, value) => {
    const esFestivo = festivosSemana[dayIndex];
    if (esMesFuturo || esFestivo) return;

    let numericValue = parseFloat(value) || 0;
    if (numericValue < 0) numericValue = 0;
    if (numericValue > 24) numericValue = 24;

    const updatedProjects = [...projects];
    updatedProjects[projectIndex].hours[dayIndex] = numericValue;
    setProjects(updatedProjects);
  };

  /**
   * description: Calcula el total de horas de un proyecto.
   * param: {number[]} hours - Arreglo de horas diarias.
   * return: {number} - Suma de las horas.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const getProjectTotal = (hours) => hours.reduce((sum, h) => sum + h, 0);

  /**
   * description: Calcula el total de horas de un día específico (sumando todos los proyectos).
   * param: {number} dayIndex - Índice del día.
   * return: {number} - Total de horas para ese día.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const getDayTotal = (dayIndex) => projects.reduce((sum, p) => sum + (p.hours[dayIndex] || 0), 0);

  /**
   * description: Calcula el gran total de horas de todos los proyectos y días.
   * return: {number} - Gran total.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const getGrandTotal = () => projects.reduce((sum, p) => sum + getProjectTotal(p.hours), 0);

  /**
   * description: Envía el reporte semanal al Backend.
   *              Valida que no sea un mes futuro y luego envía cada registro diario.
   * author: Camilo Andres Ramirez Ospina
   * date: 2026-06-17
   */
  const handleSubmitReport = async () => {
    if (esMesFuturo) {
      setMessage({ text: 'No está permitido almacenar horas en meses futuros.', type: 'danger' });
      return;
    }

    setMessage({ text: '', type: '' });
    const registrosAEnviar = [];
    projects.forEach(proj => {
      proj.hours.forEach((horasVal, index) => {
        registrosAEnviar.push({
          idUsuario: user.idUsuario,
          idProyecto: proj.id,
          fecha: weekHeaders[index].fullDateStr,
          horas: horasVal
        });
      });
    });

    try {
      const response = await apiService.guardarReporteHoras({
        idUsuario: user.idUsuario,
        fechaInicioSemana: weekHeaders[0].fullDateStr,
        reporte: registrosAEnviar
      });

      if (response && response.success) {
        setMessage({ text: '¡Excelente! El registro de tiempos semanal fue actualizado con éxito.', type: 'success' });
        cargarHorasRegistradas();
      } else {
        setMessage({ text: response.message || 'Error al procesar el guardado.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error de comunicación al intentar salvar los cambios.', type: 'danger' });
    }
  };

  /**
   * description: Exposición de todas las variables y funciones para el componente.
   * return: {Object} - Interfaz para el componente.
   * date: 2026-06-17
   */
  return {
    weekRangeText,
    weekHeaders,
    projects,
    message,
    metaHoras,
    totalMesTrabajado,
    minimoMesExigido,
    esMesFuturo,
    festivosSemana,
    handleNavigateWeek,
    handleHourChange,
    getProjectTotal,
    getDayTotal,
    getGrandTotal,
    handleSubmitReport
  };
};
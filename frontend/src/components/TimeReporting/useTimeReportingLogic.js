import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';

export const useTimeReportingLogic = (user) => {
  const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());
  const [weekRangeText, setWeekRangeText] = useState('');
  const [weekHeaders, setWeekHeaders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Estados dinámicos controlados por la data del Backend
  const [metaHoras, setMetaHoras] = useState(40);
  const [totalMesTrabajado, setTotalMesTrabajado] = useState(0);
  const [minimoMesExigido, setMinimoMesExigido] = useState(0);
  const [esMesFuturo, setEsMesFuturo] = useState(false);

  // Guardará el array de 7 booleanos que dictamina el Backend [false, false, ..., true, false]
  const [festivosSemana, setFestivosSemana] = useState([false, false, false, false, false, false, false]);

  const weekDaysLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

  const obtenerFormatoISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Reconstrucción puramente visual y cronológica del esqueleto de la semana
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

  // 2. Consumo de API: Sincroniza horas, acumulados mensuales Y banderas de festivos
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

        // Mapeamos los festivos que calculó el Backend de forma segura
        if (response.festivosSemana && response.festivosSemana.length === 7) {
          setFestivosSemana(response.festivosSemana);

          // Calculamos la meta dinámicamente en base a los festivos laborales recibidos (posiciones 0 a 4 correspondientes a L-V)
          let diasFestivosLaborales = 0;
          for (let i = 0; i < 5; i++) {
            if (response.festivosSemana[i] === true) diasFestivosLaborales++;
          }
          setMetaHoras(40 - (diasFestivosLaborales * 8));
        } else {
          // Fallback por defecto si la data de festivos no llega
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

  useEffect(() => {
    updateWeekPeriod(currentReferenceDate);
  }, [currentReferenceDate, updateWeekPeriod]);

  useEffect(() => {
    if (weekHeaders.length > 0) {
      cargarHorasRegistradas();
    }
  }, [weekHeaders, cargarHorasRegistradas]);

  const handleNavigateWeek = (direction) => {
    const newDate = new Date(currentReferenceDate);
    if (direction === 'prev') {
      newDate.setDate(currentReferenceDate.getDate() - 7);
    } else if (direction === 'next') {
      newDate.setDate(currentReferenceDate.getDate() + 7);
    }
    setCurrentReferenceDate(newDate);
    setProjects([]);
    setFestivosSemana([false, false, false, false, false, false, false]); // Reseteo limpio de colores al transicionar
    setMessage({ text: '', type: '' });
  };

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

  const getProjectTotal = (hours) => hours.reduce((sum, h) => sum + h, 0);
  const getDayTotal = (dayIndex) => projects.reduce((sum, p) => sum + (p.hours[dayIndex] || 0), 0);
  const getGrandTotal = () => projects.reduce((sum, p) => sum + getProjectTotal(p.hours), 0);

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

  return {
    weekRangeText,
    weekHeaders,
    projects,
    message,
    metaHoras,
    totalMesTrabajado,
    minimoMesExigido,
    esMesFuturo,
    festivosSemana, // <-- Exponemos el arreglo hacia la vista HTML
    handleNavigateWeek,
    handleHourChange,
    getProjectTotal,
    getDayTotal,
    getGrandTotal,
    handleSubmitReport
  };
};
/**
 * ------------------------------------------------------------------------------------------------
 * @Name         useTimeReportingLogic
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Time Reporting Module
 * @Description  Custom React hook para la gestión de reporte de horas semanal.
 *               Corregido para evitar bucles infinitos de actualización.
 * @Changes      (most recent first)
 * 2026-08-31    Corrección de bucles: se estabilizan dependencias y se usa useRef para evitar cargas duplicadas.
 * ------------------------------------------------------------------------------------------------
**/

import { useState, useEffect, useCallback, useRef} from 'react';
import { apiService } from '../../services/api';

// Constantes fuera del componente (no cambian)
const weekDaysLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

const obtenerFormatoISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const useTimeReportingLogic = (user) => {
    const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());
    const [weekRangeText, setWeekRangeText] = useState('');
    const [weekHeaders, setWeekHeaders] = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [metaHoras, setMetaHoras] = useState(40);
    const [totalMesTrabajado, setTotalMesTrabajado] = useState(0);
    const [minimoMesExigido, setMinimoMesExigido] = useState(0);
    const [esMesFuturo, setEsMesFuturo] = useState(false);
    const [festivosSemana, setFestivosSemana] = useState([false, false, false, false, false, false, false]);

    // Referencia para evitar cargar la misma semana dos veces
    const lastLoadedWeekRef = useRef(null);

    // Actualiza la semana (encabezados, rango, etc.) a partir de una fecha base
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
            headers.push({
                label: weekDaysLabels[i],
                display: `${weekDaysLabels[i]} ${currentDay.getDate()}/${currentDay.getMonth() + 1}`,
                fullDateStr: obtenerFormatoISO(currentDay)
            });
        }
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        setWeekRangeText(`${obtenerFormatoISO(monday)} - ${obtenerFormatoISO(sunday)}`);
        setWeekHeaders(headers);
    }, []); // ⬅️ Dependencias vacías porque weekDaysLabels y obtenerFormatoISO son externos

    // Función para cargar horas, recibe la fecha de inicio como parámetro
    const cargarHoras = useCallback(async (fechaInicioSemana) => {
        if (!user?.idUsuario || !fechaInicioSemana) return;
        // Evitar cargar la misma semana dos veces seguidas
        if (lastLoadedWeekRef.current === fechaInicioSemana) return;
        lastLoadedWeekRef.current = fechaInicioSemana;

        try {
            const response = await apiService.obtenerHorasSemanales(user.idUsuario, fechaInicioSemana);
            if (response && response.success) {
                setTotalMesTrabajado(response.totalHorasMes || 0);
                setMinimoMesExigido(response.minimoHorasMes || 160);
                setFestivosSemana(response.festivosSemana || [false, false, false, false, false, false, false]);

                let diasFestivosLaborales = 0;
                for (let i = 0; i < 5; i++) {
                    if (response.festivosSemana && response.festivosSemana[i]) diasFestivosLaborales++;
                }
                setMetaHoras(40 - (diasFestivosLaborales * 8));

                if (response.proyectos && response.proyectos.length > 0) {
                    setProyectos(response.proyectos.map(p => ({
                        id: p.idProyecto,
                        name: `Proyecto ${p.idProyecto}`,
                        description: 'Proyecto asignado',
                        hours: p.horas || [0, 0, 0, 0, 0, 0, 0]
                    })));
                } else {
                    // Fallback: un proyecto por defecto
                    setProyectos([{
                        id: user.idProyecto || 1,
                        name: user.nombre_proyecto || 'Proyecto Asignado',
                        description: 'Asignación Actual',
                        hours: [0, 0, 0, 0, 0, 0, 0]
                    }]);
                }
                setMessage({ text: '', type: '' });
            } else {
                setMessage({ text: 'No se pudieron sincronizar los datos con el servidor.', type: 'danger' });
                setProyectos([{
                    id: user.idProyecto || 1,
                    name: user.nombre_proyecto || 'Proyecto Asignado',
                    description: 'Asignación Actual',
                    hours: [0, 0, 0, 0, 0, 0, 0]
                }]);
            }
        } catch (err) {
            console.error('Error al recuperar horas:', err);
            setMessage({ text: 'Error de red con el servidor.', type: 'danger' });
        }
    }, [user]);

    // Efecto para actualizar la semana cuando cambia la fecha de referencia
    useEffect(() => {
        updateWeekPeriod(currentReferenceDate);
    }, [currentReferenceDate, updateWeekPeriod]);

    // Efecto para cargar horas cuando cambia la semana (weekHeaders)
    useEffect(() => {
        if (weekHeaders.length > 0 && user?.idUsuario) {
            const fechaInicio = weekHeaders[0].fullDateStr;
            cargarHoras(fechaInicio);
        }
    }, [weekHeaders, cargarHoras, user]);

    // Navegación entre semanas
    const handleNavigateWeek = (direction) => {
        const newDate = new Date(currentReferenceDate);
        if (direction === 'prev') newDate.setDate(currentReferenceDate.getDate() - 7);
        else if (direction === 'next') newDate.setDate(currentReferenceDate.getDate() + 7);
        setCurrentReferenceDate(newDate);
        // Limpiar proyectos y mensajes mientras se carga la nueva semana
        setProyectos([]);
        setFestivosSemana([false, false, false, false, false, false, false]);
        setMessage({ text: '', type: '' });
        // Resetear referencia para permitir carga de la nueva semana
        lastLoadedWeekRef.current = null;
    };

    // Manejar cambio de horas en un input
    const handleHourChange = (projectIndex, dayIndex, value) => {
        const esFestivo = festivosSemana[dayIndex];
        if (esMesFuturo || esFestivo) return;
        let numericValue = parseFloat(value) || 0;
        if (numericValue < 0) numericValue = 0;
        if (numericValue > 24) numericValue = 24;
        const updatedProyectos = [...proyectos];
        updatedProyectos[projectIndex].hours[dayIndex] = numericValue;
        setProyectos(updatedProyectos);
    };

    // Cálculo de totales
    const getProjectTotal = (hours) => hours.reduce((sum, h) => sum + h, 0);
    const getDayTotal = (dayIndex) => proyectos.reduce((sum, p) => sum + (p.hours[dayIndex] || 0), 0);
    const getGrandTotal = () => proyectos.reduce((sum, p) => sum + getProjectTotal(p.hours), 0);

    // Guardar reporte
    const handleSubmitReport = async () => {
        if (esMesFuturo) {
            setMessage({ text: 'No está permitido almacenar horas en meses futuros.', type: 'danger' });
            return;
        }
        setMessage({ text: '', type: '' });
        const reporte = proyectos.map(proj => ({
            idProyecto: proj.id,
            horas: proj.hours
        }));
        try {
            const response = await apiService.guardarReporteHoras({
                idUsuario: user.idUsuario,
                fechaInicioSemana: weekHeaders[0].fullDateStr,
                reporte
            });
            if (response && response.success) {
                setMessage({ text: '¡Reporte guardado exitosamente!', type: 'success' });
                // Recargar los datos para reflejar los cambios
                const fechaInicio = weekHeaders[0].fullDateStr;
                // Resetear referencia para forzar recarga
                lastLoadedWeekRef.current = null;
                cargarHoras(fechaInicio);
            } else {
                setMessage({ text: response.message || 'Error al guardar el reporte.', type: 'danger' });
            }
        } catch (err) {
            setMessage({ text: 'Error de comunicación al guardar.', type: 'danger' });
        }
    };

    return {
        weekRangeText,
        weekHeaders,
        projects: proyectos,
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
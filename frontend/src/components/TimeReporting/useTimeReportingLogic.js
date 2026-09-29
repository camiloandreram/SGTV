/**
 * useTimeReportingLogic.js
 * Referencia del mes = MES ACTUAL (hoy), no el mes del lunes visible.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../../services/api';

const weekDaysLabels = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

const obtenerFormatoISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Devuelve "YYYY-MM" del mes actual real
const getMesActualStr = () => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};

export const useTimeReportingLogic = (user) => {
    const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());
    const [weekRangeText, setWeekRangeText] = useState('');
    const [mesReferenciaTexto, setMesReferenciaTexto] = useState('');
    const [weekHeaders, setWeekHeaders] = useState([]);
    const [diasMesActual, setDiasMesActual] = useState([false,false,false,false,false,false,false]);
    const [proyectos, setProyectos] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [metaHoras, setMetaHoras] = useState(40);
    const [totalMesTrabajado, setTotalMesTrabajado] = useState(0);
    const [minimoMesExigido, setMinimoMesExigido] = useState(0);
    const [esMesFuturo, setEsMesFuturo] = useState(false);
    const [festivosSemana, setFestivosSemana] = useState([false,false,false,false,false,false,false]);

    const lastLoadedWeekRef = useRef(null);

    const updateWeekPeriod = useCallback((baseDate) => {
        const d = new Date(baseDate);
        const dayOfWeek = d.getDay();
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + distanceToMonday);

        // ============================================================
        // REFERENCIA = MES ACTUAL REAL (hoy), no el mes del lunes
        // ============================================================
        const hoy = new Date();
        const mesRef = hoy.getMonth();
        const anioRef = hoy.getFullYear();

        // esMesFuturo: la semana (lunes) pertenece a un mes posterior al actual
        const inicioMesHoy = new Date(anioRef, mesRef, 1);
        const inicioMesFila = new Date(monday.getFullYear(), monday.getMonth(), 1);
        setEsMesFuturo(inicioMesFila > inicioMesHoy);

        // Badge = mes actual real
        setMesReferenciaTexto(`${MESES_ES[mesRef]} ${anioRef}`);

        const headers = [];
        const diasDelMes = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(monday);
            currentDay.setDate(monday.getDate() + i);
            // Comparar contra el MES ACTUAL REAL
            const mismoMes = currentDay.getMonth() === mesRef && currentDay.getFullYear() === anioRef;
            diasDelMes.push(mismoMes);
            headers.push({
                label: weekDaysLabels[i],
                display: `${weekDaysLabels[i]} ${currentDay.getDate()}/${currentDay.getMonth() + 1}`,
                fullDateStr: obtenerFormatoISO(currentDay),
                perteneceAlMes: mismoMes
            });
        }
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        setWeekRangeText(`${obtenerFormatoISO(monday)} - ${obtenerFormatoISO(sunday)}`);
        setWeekHeaders(headers);
        setDiasMesActual(diasDelMes);
    }, []);

    const cargarHoras = useCallback(async (fechaInicioSemana) => {
        if (!user?.idUsuario || !fechaInicioSemana) return;
        if (lastLoadedWeekRef.current === fechaInicioSemana) return;
        lastLoadedWeekRef.current = fechaInicioSemana;

        try {
            const mesReferencia = getMesActualStr();
            const response = await apiService.obtenerHorasSemanales(
                user.idUsuario,
                fechaInicioSemana,
                mesReferencia
            );

            if (response && response.success) {
                setTotalMesTrabajado(response.totalHorasMes || 0);
                setMinimoMesExigido(response.minimoHorasMes || 160);
                setFestivosSemana(response.festivosSemana || [false,false,false,false,false,false,false]);

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
                        hours: p.horas || [0,0,0,0,0,0,0]
                    })));
                } else {
                    setProyectos([{
                        id: user.idProyecto || 1,
                        name: user.nombre_proyecto || 'Proyecto Asignado',
                        description: 'Asignación Actual',
                        hours: [0,0,0,0,0,0,0]
                    }]);
                }
                setMessage({ text: '', type: '' });
            } else {
                setMessage({ text: 'No se pudieron sincronizar los datos con el servidor.', type: 'danger' });
                setProyectos([{
                    id: user.idProyecto || 1,
                    name: user.nombre_proyecto || 'Proyecto Asignado',
                    description: 'Asignación Actual',
                    hours: [0,0,0,0,0,0,0]
                }]);
            }
        } catch (err) {
            console.error('Error al recuperar horas:', err);
            setMessage({ text: 'Error de red con el servidor.', type: 'danger' });
        }
    }, [user]);

    useEffect(() => {
        updateWeekPeriod(currentReferenceDate);
    }, [currentReferenceDate, updateWeekPeriod]);

    useEffect(() => {
        if (weekHeaders.length > 0 && user?.idUsuario) {
            cargarHoras(weekHeaders[0].fullDateStr);
        }
    }, [weekHeaders, cargarHoras, user]);

    const handleNavigateWeek = (direction) => {
        const newDate = new Date(currentReferenceDate);
        if (direction === 'prev') newDate.setDate(currentReferenceDate.getDate() - 7);
        else if (direction === 'next') newDate.setDate(currentReferenceDate.getDate() + 7);
        setCurrentReferenceDate(newDate);
        setProyectos([]);
        setFestivosSemana([false,false,false,false,false,false,false]);
        setMessage({ text: '', type: '' });
        lastLoadedWeekRef.current = null;
    };

    const handleHourChange = (projectIndex, dayIndex, value) => {
        const esFestivo = festivosSemana[dayIndex];
        const esDeOtroMes = !diasMesActual[dayIndex];
        if (esMesFuturo || esFestivo || esDeOtroMes) return;
        let numericValue = parseFloat(value) || 0;
        if (numericValue < 0) numericValue = 0;
        if (numericValue > 24) numericValue = 24;
        const updatedProyectos = [...proyectos];
        updatedProyectos[projectIndex].hours[dayIndex] = numericValue;
        setProyectos(updatedProyectos);
    };

    const getProjectTotal = (hours) => hours.reduce((sum, h) => sum + h, 0);
    const getDayTotal = (dayIndex) => proyectos.reduce((sum, p) => sum + (p.hours[dayIndex] || 0), 0);
    const getGrandTotal = () => proyectos.reduce((sum, p) => sum + getProjectTotal(p.hours), 0);

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
                lastLoadedWeekRef.current = null;
                cargarHoras(weekHeaders[0].fullDateStr);
            } else {
                setMessage({ text: response.message || 'Error al guardar el reporte.', type: 'danger' });
            }
        } catch (err) {
            setMessage({ text: 'Error de comunicación al guardar.', type: 'danger' });
        }
    };

    return {
        weekRangeText,
        mesReferenciaTexto,
        weekHeaders,
        diasMesActual,
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
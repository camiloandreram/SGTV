// src/utils/holidays.js
import colombianHolidays from 'colombian-holidays';

/**
 * Obtiene la lista de festivos para un año dado.
 * @param {number} year - Año a consultar.
 * @returns {Array<string>} - Lista de fechas en formato 'YYYY-MM-DD'.
 */
function getHolidaysForYear(year) {
    try {
        const candidates = [
            () => colombianHolidays.getHolidaysByYear?.(year),
            () => colombianHolidays.holidays?.(year),
            () => colombianHolidays.default?.getHolidaysByYear?.(year),
            () => colombianHolidays.default?.holidays?.(year),
            () => (typeof colombianHolidays === 'function' ? colombianHolidays(year) : null)
        ];

        for (const fn of candidates) {
            try {
                const result = fn();
                if (result && Array.isArray(result) && result.length > 0) {
                    const dates = result.map(item => {
                        if (typeof item === 'string') return item;
                        if (item && typeof item === 'object' && item.date) return item.date;
                        return String(item);
                    }).filter(d => d && d.length === 10);
                    if (dates.length > 0) {
                        console.log(`✅ Festivos obtenidos para ${year}: ${dates.length} días`);
                        return dates;
                    }
                }
            } catch (e) {}
        }

        console.warn(`❌ No se pudo obtener festivos para el año ${year}.`);
        console.warn('Estructura de colombianHolidays:', Object.keys(colombianHolidays));
        if (colombianHolidays.default) {
            console.warn('Propiedades de default:', Object.keys(colombianHolidays.default));
        }
        return [];
    } catch (error) {
        console.error(`Error al obtener festivos para ${year}:`, error);
        return [];
    }
}

/**
 * Calcula el número de días hábiles entre dos fechas (inclusive),
 * excluyendo fines de semana y festivos colombianos.
 * @param {string} fechaInicioStr - Fecha de inicio en formato 'YYYY-MM-DD'.
 * @param {string} fechaFinStr - Fecha de fin en formato 'YYYY-MM-DD'.
 * @returns {number} - Número de días hábiles.
 */
export function calcularDiasHabilesColombia(fechaInicioStr, fechaFinStr) {
    const fechaActual = new Date(fechaInicioStr + 'T00:00:00');
    const fechaFin = new Date(fechaFinStr + 'T00:00:00');

    if (fechaActual > fechaFin) return 0;

    const anoInicio = fechaActual.getFullYear();
    const anoFin = fechaFin.getFullYear();
    let festivos = [];

    for (let year = anoInicio; year <= anoFin; year++) {
        const holidays = getHolidaysForYear(year);
        festivos = festivos.concat(holidays);
    }

    festivos = [...new Set(festivos)];

    let diasHabiles = 0;
    while (fechaActual <= fechaFin) {
        const diaSemana = fechaActual.getDay();
        const stringFecha = fechaActual.toISOString().split('T')[0];
        const esFinDeSemana = (diaSemana === 0 || diaSemana === 6);
        const esFestivo = festivos.includes(stringFecha);

        if (!esFinDeSemana && !esFestivo) {
            diasHabiles++;
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return diasHabiles;
}
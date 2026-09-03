// backend/utils/holidays.js
const colombianHolidays = require('colombian-holidays');

/**
 * Obtiene la lista de festivos para un año dado.
 * @param {number} year - Año a consultar.
 * @returns {Array<string>} - Lista de fechas en formato 'YYYY-MM-DD'.
 */
function getHolidaysForYear(year) {
    try {
        // Lista de posibles formas de acceder a los festivos
        const candidates = [
            // Método específico que aparece en la estructura del backend
            () => colombianHolidays.getHolidaysForYear?.(year),
            // Propiedad anidada "colombianHolidays" que también tiene el método
            () => colombianHolidays.colombianHolidays?.getHolidaysForYear?.(year),
            // Otros métodos comunes
            () => colombianHolidays.getHolidaysByYear?.(year),
            () => colombianHolidays.holidays?.(year),
            // Si existe default (aunque en tu caso está vacío)
            () => colombianHolidays.default?.getHolidaysForYear?.(year),
            () => colombianHolidays.default?.getHolidaysByYear?.(year),
            () => colombianHolidays.default?.holidays?.(year),
            // Último recurso: si la librería es una función
            () => (typeof colombianHolidays === 'function' ? colombianHolidays(year) : null)
        ];

        for (const fn of candidates) {
            try {
                const result = fn();
                if (result && Array.isArray(result) && result.length > 0) {
                    // Normalizar: extraer fechas en formato YYYY-MM-DD
                    const dates = result.map(item => {
                        if (typeof item === 'string') return item;
                        if (item && typeof item === 'object' && item.date) return item.date;
                        // Si es un objeto Date o similar, convertirlo a ISO string
                        if (item instanceof Date) return item.toISOString().split('T')[0];
                        return String(item);
                    }).filter(d => d && d.length === 10 && !isNaN(new Date(d).getTime()));

                    if (dates.length > 0) {
                        console.log(`✅ Festivos obtenidos para ${year}: ${dates.length} días`);
                        return dates;
                    }
                }
            } catch (e) {
                // Silencioso, seguimos con el siguiente candidato
            }
        }

        // Si llegamos aquí, no se pudo obtener la lista
        console.warn(`❌ No se pudo obtener festivos para el año ${year}.`);
        console.warn('Estructura de colombianHolidays:', Object.keys(colombianHolidays));
        // Intentamos ver si la propiedad colombianHolidays tiene métodos
        if (colombianHolidays.colombianHolidays) {
            console.warn('Métodos en colombianHolidays.colombianHolidays:', Object.keys(colombianHolidays.colombianHolidays));
        }
        return [];
    } catch (error) {
        console.error(`Error al obtener festivos para ${year}:`, error);
        return [];
    }
}

/**
 * Calcula el número de días hábiles entre dos fechas (inclusive).
 * @param {string} fechaInicioStr - Fecha de inicio 'YYYY-MM-DD'.
 * @param {string} fechaFinStr - Fecha de fin 'YYYY-MM-DD'.
 * @returns {number} - Número de días hábiles.
 */
function calcularDiasHabilesColombia(fechaInicioStr, fechaFinStr) {
    const fechaActual = new Date(fechaInicioStr + 'T00:00:00');
    const fechaFin = new Date(fechaFinStr + 'T00:00:00');
    if (fechaActual > fechaFin) return 0;

    const anoInicio = fechaActual.getFullYear();
    const anoFin = fechaFin.getFullYear();
    let festivos = [];

    for (let year = anoInicio; year <= anoFin; year++) {
        const holidays = getHolidaysForYear(year);
        if (holidays && holidays.length > 0) {
            festivos = festivos.concat(holidays);
        }
    }

    // Eliminar duplicados
    festivos = [...new Set(festivos)];

    let diasHabiles = 0;
    while (fechaActual <= fechaFin) {
        const diaSemana = fechaActual.getDay(); // 0=Dom, 6=Sáb
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

module.exports = {
    calcularDiasHabilesColombia,
    getHolidaysForYear
};
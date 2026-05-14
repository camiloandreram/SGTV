document.addEventListener('DOMContentLoaded', function() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const vacDaysSpan = document.getElementById('vacDays');

    // Mostrar saldo real
    vacDaysSpan.textContent = getVacationBalance();

    function daysBetween(start, end) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((new Date(start) - new Date(end)) / oneDay)) + 1;
    }

    window.submitVacation = function() {
        const s = startDate.value;
        const e = endDate.value;
        if (!s || !e) {
            openModal('Por favor, selecciona las fechas de inicio y fin.');
            return;
        }
        if (e < s) {
            openModal('La fecha de fin no puede ser anterior a la de inicio.');
            return;
        }

        const daysRequested = daysBetween(s, e);
        const saldoActual = getVacationBalance();

        if (daysRequested > saldoActual) {
            openModal(`Días insuficientes. Solicitas ${daysRequested} días, pero solo tienes ${saldoActual}.`);
            return;
        }

        // Registrar consumo
        const consumidosAntes = parseFloat(localStorage.getItem('vacationDaysConsumed') || '0');
        localStorage.setItem('vacationDaysConsumed', (consumidosAntes + daysRequested).toFixed(2));

        // Actualizar visualización
        const nuevoSaldo = getVacationBalance();
        vacDaysSpan.textContent = nuevoSaldo;

        openModal(`¡Solicitud enviada! Has solicitado ${daysRequested} días. Tu nuevo saldo es ${nuevoSaldo} días.`);
        startDate.value = '';
        endDate.value = '';
    };
});
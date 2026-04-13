document.addEventListener('DOMContentLoaded', function() {
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const vacDaysSpan = document.getElementById('vacDays');

  function updateVacDaysDisplay() {
    let available = localStorage.getItem('vacationDays');
    if (available === null) available = 27.88;
    vacDaysSpan.textContent = available;
  }
  updateVacDaysDisplay();

  function daysBetween(start, end) {
    const oneDay = 24 * 60 * 60 * 1000;
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffDays = Math.round(Math.abs((startDateObj - endDateObj) / oneDay)) + 1;
    return diffDays;
  }

  window.submitVacation = function() {
    const s = startDate.value;
    const e = endDate.value;
    if (!s || !e) {
      openModal('Seleccione fecha inicio y fin.');
      return;
    }
    if (e < s) {
      openModal('La fecha fin no puede ser anterior a la de inicio.');
      return;
    }
    const daysRequested = daysBetween(s, e);
    let available = parseFloat(localStorage.getItem('vacationDays') || '27.88');
    if (daysRequested > available) {
      openModal(`No tienes suficientes días. Disponibles: ${available.toFixed(2)}`);
      return;
    }
    available -= daysRequested;
    localStorage.setItem('vacationDays', available.toFixed(2));
    openModal(`Solicitud enviada por ${daysRequested} días. Nuevo saldo: ${available.toFixed(2)}`);
    updateVacDaysDisplay();
    startDate.value = '';
    endDate.value = '';
  };
});
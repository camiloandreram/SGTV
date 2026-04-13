document.addEventListener('DOMContentLoaded', function() {
  const user = getUser();
  if (user) {
    const profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = user.name;
  }

  const vacDaysSpan = document.querySelector('.tile a[href="vacations.html"] strong');
  if (vacDaysSpan) {
    let available = localStorage.getItem('vacationDays');
    if (available === null) {
      available = 27.88;
      localStorage.setItem('vacationDays', available);
    }
    vacDaysSpan.textContent = available + ' Días';
  }
});
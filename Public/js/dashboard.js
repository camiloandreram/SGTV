document.addEventListener('DOMContentLoaded', function() {
    setupUserProfile();
    setupVacationDays();
    animateDashboardTiles();
});

function setupUserProfile() {
    const user = (typeof getUser === 'function') ? getUser() : null;

    const profileName = document.getElementById('profileName');
    const profileCargo = document.getElementById('profileCargo');
    const profileSede = document.getElementById('profileSede');
    const profileBadge = document.getElementById('profileBadge');
    const profileEstado = document.getElementById('profileEstado');
    const profileProjects = document.getElementById('profileProjects');

    if (user) {
        if (profileName) profileName.textContent = user.nombre || 'Sin nombre';
        if (profileCargo) profileCargo.textContent = user.cargo || 'Sin cargo';
        if (profileSede) profileSede.textContent = user.sede || 'Sin sede';
        if (profileBadge) {
            const inicial = user.nombre ? user.nombre.trim().charAt(0).toUpperCase() : '?';
            profileBadge.textContent = inicial;
        }
        if (profileEstado) profileEstado.textContent = user.estado || 'N/D';

        // Proyectos desde la lista global, no desde el usuario
        if (profileProjects) {
            const nombres = getAllProjectNames(); // tomados directamente de SGTV_DB.proyectos
            profileProjects.textContent = nombres.join(', ') || 'Ninguno';
        }
    } else {
        if (profileName) profileName.textContent = 'No autenticado';
    }
}

function setupVacationDays() {
    const vacationDisplay = document.getElementById('vacationDaysDisplay');
    if (vacationDisplay) {
        const saldo = getVacationBalance(); // calculado al instante
        vacationDisplay.textContent = `${saldo} Días`;
    }
}

function animateDashboardTiles() {
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach((tile, index) => {
        tile.style.opacity = "0";
        tile.style.transform = "translateY(20px)";
        tile.style.transition = "all 0.5s ease";
        setTimeout(() => {
            tile.style.opacity = "1";
            tile.style.transform = "translateY(0)";
        }, 100 * (index + 1));
    });
}

function logout() {
    if (typeof clearSession === 'function') {
        clearSession();
    } else {
        sessionStorage.clear();
    }

    window.location.href = 'login.html';
}
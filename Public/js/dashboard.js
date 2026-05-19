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

    if (user) {
        // Mostramos Nombre y Apellido
        if (profileName) profileName.textContent = `${user.Nombre} ${user.Apellido}`;

        // ¡Aquí está el truco! Usamos los nuevos nombres del JOIN
        if (profileCargo) profileCargo.textContent = user.nombre_perfil || 'Sin cargo';
        if (profileSede) profileSede.textContent = user.nombre_depto || 'Sin sede';

        if (profileBadge) {
            const inicial = user.Nombre ? user.Nombre.trim().charAt(0).toUpperCase() : '?';
            profileBadge.textContent = inicial;
        }

        // Estado y Vacaciones (usando los nombres de tu DB)
        if (document.getElementById('profileEstado')) {
            document.getElementById('profileEstado').textContent = user.Estado;
        }
        if (document.getElementById('vacationDaysDisplay')) {
            document.getElementById('vacationDaysDisplay').textContent = `${user.vacaciones_disponibles} Días`;
        }
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
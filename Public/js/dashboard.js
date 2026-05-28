document.addEventListener('DOMContentLoaded', function() {
    setupUserProfile();
    animateDashboardTiles();
});

function setupUserProfile() {
    const user = (typeof getUser === 'function') ? getUser() : null;

    const profileName = document.getElementById('profileName');
    const profileCargo = document.getElementById('profileCargo');
    const profileSede = document.getElementById('profileSede');
    const profileBadge = document.getElementById('profileBadge');
    const profileProjects = document.getElementById('profileProjects');

    if (user) {
        if (profileName) profileName.textContent = `${user.Nombre} ${user.Apellido}`;
        if (profileCargo) profileCargo.textContent = user.nombre_perfil || 'Sin cargo';
        if (profileSede) profileSede.textContent = user.nombre_depto || 'Sin sede';

        if (profileBadge) {
            const inicial = user.Nombre ? user.Nombre.trim().charAt(0).toUpperCase() : '?';
            profileBadge.textContent = inicial;
        }

        // Mostrar el proyecto activo del usuario (tabla usuario_proyecto)
        if (profileProjects) {
            profileProjects.textContent = user.nombre_proyecto || 'Sin proyecto activo';
        }

        if (document.getElementById('profileEstado')) {
            document.getElementById('profileEstado').textContent = user.Estado;
        }
        if (document.getElementById('vacationDaysDisplay')) {
            const diasEnteros = Math.floor(user.vacaciones_disponibles || 0);
            document.getElementById('vacationDaysDisplay').textContent = `${diasEnteros} Días`;
        }
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
            tile.style.transform = "translateY(0)\";";
        }, 100 * (index + 1));
    });
}

function logout() {
    if (typeof clearSession === 'function') {
        clearSession();
    } else {
        sessionStorage.clear();
        localStorage.clear();
    }
    window.location.href = 'login.html';
}
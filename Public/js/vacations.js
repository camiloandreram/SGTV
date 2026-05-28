document.addEventListener('DOMContentLoaded', function() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const vacDaysSpan = document.getElementById('vacDays');
    const commentsInput = document.getElementById('comments');

    const user = (typeof getUser === 'function') ? getUser() : null;

    if (user && vacDaysSpan) {
        const diasEnteros = Math.floor(user.vacaciones_disponibles || 0);
        vacDaysSpan.textContent = diasEnteros;
    }

    function daysBetween(start, end) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((new Date(start) - new Date(end)) / oneDay)) + 1;
    }

    // Cargar historial inicial del propio empleado al entrar a la pantalla
    if (user) {
        cargarMisSolicitudes(user.idUsuario, user.nombre_proyecto);
    }

    // ==========================================
    // ENVIAR SOLICITUD (EMPLEADO)
    // ==========================================
    window.submitVacation = function() {
        const s = startDate.value;
        const e = endDate.value;
        const comentarios = commentsInput ? commentsInput.value : '';

        if (!s || !e) {
            openModal('Por favor, selecciona las fechas de inicio y fin.');
            return;
        }
        if (e < s) {
            openModal('La fecha de fin no puede ser anterior a la de inicio.');
            return;
        }

        const daysRequested = daysBetween(s, e);
        const saldoActual = user ? Math.floor(user.vacaciones_disponibles || 0) : 0;

        if (daysRequested > saldoActual) {
            openModal(`Días insuficientes. Solicitas ${daysRequested} días, pero solo tienes ${saldoActual}.`);
            return;
        }

        if (!user.idProyecto || !user.idResponsableP) {
            openModal('Error: No cuentas con un proyecto o líder aprobador asignado.');
            return;
        }

        const payload = {
            idUsuario: user.idUsuario,
            idProyecto: user.idProyecto,
            idAprobador: user.idResponsableP,
            fechaInicio: s,
            fechaFin: e,
            cantidadDias: daysRequested,
            comentarios: comentarios
        };

        fetch('/api/vacaciones/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Descontar saldo localmente para feedback inmediato
                user.vacaciones_disponibles -= daysRequested;
                setUser(user);
                vacDaysSpan.textContent = Math.floor(user.vacaciones_disponibles);
                if (typeof saveUser === 'function') saveUser(user);
                vacDaysSpan.textContent = Math.floor(user.vacaciones_disponibles);

                // AGREGAR ABAJO EN LA TABLA SIN REFRESCAR LA PÁGINA
                agregarSolicitudALaLista(data.solicitud, user.nombre_proyecto);

                openModal(`¡Solicitud enviada! Queda bajo revisión de tu líder en el proyecto ${user.nombre_proyecto}.`);

                startDate.value = '';
                endDate.value = '';
                if (commentsInput) commentsInput.value = '';
            } else {
                openModal('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error(err);
            openModal('No se pudo conectar con el servidor.');
        });
    };

    // VISTA DE ACCESO PARA LÍDER / JEFE
   if (user && (user.nombre_perfil === 'Lider' || user.nombre_perfil === 'Jefe lider')) {
        cargarSolicitudesPendientes(user.idUsuario);
    }
});

// Carga las solicitudes del usuario actual
function cargarMisSolicitudes(idUsuario, nombreProyecto) {
    fetch(`/api/vacaciones/mis-solicitudes/${idUsuario}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.solicitudes.length > 0) {
                data.solicitudes.forEach(sol => {
                    agregarSolicitudALaLista(sol, sol.nombre_proyecto);
                });
            }
        });
}

// Inserta dinámicamente un nodo tr dentro del contenedor id="solicitudesContainer"
function agregarSolicitudALaLista(solicitud, nombreProyecto) {
    const contenedor = document.getElementById('solicitudesContainer');
    if (!contenedor) return;

    const fila = document.createElement('tr');
    fila.id = `solicitud-${solicitud.idSolicitud}`;

    // Validar el formato de badges según el Estado
    let badgeClass = 'bg-warning text-dark';
    if (solicitud.Estado === 'Aprobado') badgeClass = 'bg-success text-white';
    if (solicitud.Estado === 'Rechazado') badgeClass = 'bg-danger text-white';

    fila.innerHTML = `
        <td>${nombreProyecto || 'N/A'}</td>
        <td>${solicitud.Fecha_Inicio.split('T')[0]}</td>
        <td>${solicitud.Fecha_Fin.split('T')[0]}</td>
        <td><strong>${solicitud.cantidadDias} días</strong></td>
        <td><span class="badge ${badgeClass}">${solicitud.Estado}</span></td>
    `;
    // Insertamos al principio para que las más nuevas salgan arriba
    contenedor.insertBefore(fila, contenedor.firstChild);
}

// Carga las bandejas pendientes si el perfil es administrador/líder
function cargarSolicitudesPendientes(idLider) {
    const mainSection = document.querySelector('main') || document.body;

    fetch(`/api/vacaciones/pendientes/${idLider}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.solicitudes.length > 0) {
                const contenedor = document.createElement('div');
                contenedor.className = 'profile-card';
                contenedor.style.marginTop = '30px';

                let html = `
                    <h3 style="margin-bottom:20px; color:var(--primary);"><i class="fa-solid fa-user-check"></i> Solicitudes de tu Equipo</h3>
                    <table class="table-custom" style="width:100%; text-align:left; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:2px solid var(--border-color); font-weight:bold;">
                                <th style="padding:10px;">Empleado</th>
                                <th>Proyecto</th>
                                <th>Inicio</th>
                                <th>Fin</th>
                                <th>Días</th>
                                <th style="text-align:right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                data.solicitudes.forEach(sol => {
                    html += `
                        <tr style="border-bottom: 1px solid var(--border-color);" id="lider-sol-${sol.idSolicitud}">
                            <td style="padding:12px 10px;">${sol.empleado}</td>
                            <td>${sol.nombre_proyecto || 'N/A'}</td>
                            <td>${sol.Fecha_Inicio.split('T')[0]}</td>
                            <td>${sol.Fecha_Fin.split('T')[0]}</td>
                            <td><strong>${sol.cantidadDias}</strong></td>
                            <td style="text-align:right;">
                                <button class="btn-primary-custom" style="padding:5px 12px; font-size:12px; background:#27ae60; border-color:#27ae60; margin-right:5px; width:auto;" onclick="procesarSolicitud(${sol.idSolicitud}, 'Aprobar')">Aprobar</button>
                                <button class="btn-logout-modern" style="padding:5px 12px; font-size:12px; margin:0; width:auto; background:#c0392b; color:#fff;" onclick="procesarSolicitud(${sol.idSolicitud}, 'Rechazar')">Rechazar</button>
                            </td>
                        </tr>
                    `;
                });

                html += `</tbody></table>`;
                contenedor.innerHTML = html;
                mainSection.appendChild(contenedor);
            }
        });
}

// Acción asíncrona del líder para procesar
window.procesarSolicitud = function(idSolicitud, accion) {
    if (confirm(`¿Estás seguro de ${accion.toLowerCase()} esta solicitud?`)) {
        fetch('/api/vacaciones/procesar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idSolicitud, accion })
        })
        .then(res => res.json())
        .then(async (data) => {
            if (data.success) {
                alert(data.message);
                // Refrescar el usuario en sessionStorage
                await refreshUserSession();
                // Recargar la página para reflejar saldos actualizados
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        });
    }
};
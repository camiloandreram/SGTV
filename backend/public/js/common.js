function openModal(msg) {
  console.log('openModal llamado con:', msg);
  alert('AVISO: ' + msg);
}

function closeModal() {
  console.log('closeModal llamado');
}

function setUser(user) {
  console.log('setUser llamado:', user);
  sessionStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  const userStr = sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function logout() {
  sessionStorage.removeItem('user');
  window.location.href = 'login.html';
}

if (!window.location.pathname.includes('login.html')) {
  const user = getUser();
  if (!user) {
    console.log('No hay usuario, redirigiendo a login');
    window.location.href = 'login.html';
  }
}
// const SGTV_DB = {
//     "usuarios": [
//         {
//             "id": "2026-VASS",
//             "nombre": "Camilo Andres Ramirez",
//             "correo": "camilo.ramirez@vass.com",
//             "fecha_inicio_contrato": "2025-05-06",
//             "password": "123",
//             "cargo": "Semillero",
//             "sede": "Medellin, Colombia",
//             "vacaciones_disponibles": 0,
//             "estado": "Activo"
//         }
//     ],
//     "proyectos": [
//         { "id": "TK-103", "nombre": "TK/103626-001", "descripcion": "Engineer" },
//         { "id": "INT-ACT", "nombre": "Internal Activities", "descripcion": "Training" }
//     ],
//     "reportes": [
//         {
//             "usuarioId": "2026-VASS",
//             "semana": "2026-05-04",
//             "registros": [
//                 { "proyectoId": "TK-103", "horas": [8, 8, 8, 8, 8, 0, 0] },
//                 { "proyectoId": "INT-ACT", "horas": [0, 0, 0, 0, 0, 0, 0] }
//             ]
//         }
//     ]
// };
function getAllProjectNames() {
    return SGTV_DB.proyectos.map(p => p.nombre);
}

function getVacationBalance() {
    const user = getUser();
    if (!user || !user.fecha_inicio_contrato) return 0;

    const fechaInicio = new Date(user.fecha_inicio_contrato);
    const hoy = new Date(); // En producción podrías usar la fecha del servidor
    const diffMs = hoy - fechaInicio;
    const diasTrabajados = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diasGanados = (diasTrabajados * 15) / 365;
    const diasConsumidos = parseFloat(localStorage.getItem('vacationDaysConsumed') || '0');

    return Math.floor(Math.max(0, diasGanados - diasConsumidos));
}
async function refreshUserSession() {
    const oldUser = getUser();
    if (!oldUser || !oldUser.idUsuario) return null;
    try {
        const response = await fetch(`/api/usuario/${oldUser.idUsuario}`);
        const data = await response.json();
        if (data.success) {
            setUser(data.user);
            return data.user;
        }
    } catch (error) {
        console.error('Error refrescando usuario:', error);
    }
    return null;
}
console.log('✅ common.js cargado correctamente');

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
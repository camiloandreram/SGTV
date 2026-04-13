console.log('✅ login.js cargado');

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) {
    console.error('Formulario de login no encontrado');
    return;
  }

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (!email || !pass) {
      openModal('Por favor ingrese usuario y contraseña.');
      return;
    }

    const user = { name: 'Camilo Andres Ramirez', email: email };
    setUser(user);
    console.log('Usuario guardado, redirigiendo a dashboard...');
    window.location.href = 'dashboard.html';
  });
});
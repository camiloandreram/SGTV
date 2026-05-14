document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.querySelector('#togglePassword');
  const passwordInput = document.querySelector('#password');
  const eyeIcon = document.querySelector('#eyeIcon');

  // Estilos para limpiar iconos nativos del navegador
  const style = document.createElement('style');
  style.innerHTML = `
    input::-ms-reveal,
    input::-ms-clear {
      display: none;
    }
  `;
  document.head.appendChild(style);

  // Lógica para mostrar/ocultar contraseña
  if (togglePassword && passwordInput && eyeIcon) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      eyeIcon.classList.toggle('fa-eye');
      eyeIcon.classList.toggle('fa-eye-slash');
    });
  }

  if (!loginForm) {
    console.error('Formulario de login no encontrado');
    return;
  }

  // Lógica de autenticación
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();

    // 1. Validación de campos vacíos
    if (!email || !pass) {
      mostrarMensaje('Campos incompletos', 'Por favor ingrese usuario y contraseña.', 'warning');
      return;
    }

    // 2. Buscar usuario en SGTV_DB (definida en common.js)
    // Usamos toLowerCase() para que no importe si escriben en mayúsculas
    const usuarioEncontrado = SGTV_DB.usuarios.find(u =>
        u.correo.toLowerCase() === email.toLowerCase() &&
        u.password === pass
    );

    // 3. Validación de credenciales
    if (usuarioEncontrado) {
        // ÉXITO: Guardamos TODO el objeto del usuario en la sesión
        // Esto incluye 'nombre', 'fecha_inicio_contrato', etc.
        setUser(usuarioEncontrado);

        console.log('Login exitoso para:', usuarioEncontrado.nombre);

        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
    } else {
        // ERROR: Credenciales incorrectas
        mostrarMensaje('Error de acceso', 'Usuario o contraseña incorrectos.', 'error');
    }
  });

  /**
   * Función para mostrar alertas usando SweetAlert2 o Alert normal
   */
  function mostrarMensaje(titulo, texto, icono) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: titulo,
        text: texto,
        icon: icono,
        confirmButtonColor: '#C62828'
      });
    } else {
      alert(`${titulo}: ${texto}`);
    }
  }
});
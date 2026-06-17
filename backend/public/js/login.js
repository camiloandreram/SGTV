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
  // Lógica de autenticación REAL conectada a la base de datos
  loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      const email = document.getElementById('email').value.trim();
      const pass = document.getElementById('password').value.trim();

      // 1. Validación de campos vacíos
      if (!email || !pass) {
          mostrarMensaje('Campos incompletos', 'Por favor ingrese usuario y contraseña.', 'warning');
          return;
      }

      try {
          // 2. Petición al servidor de Node.js
          const response = await fetch('http://localhost:3000/api/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: email, password: pass })
          });

          const data = await response.json();

          // 3. Validación de la respuesta del servidor
          if (data.success) {
              // ÉXITO: Guardamos el usuario que vino de MySQL en la sesión
              // Nota: data.user contiene lo que devolvió el SELECT de la DB
              setUser(data.user);

              console.log('Login exitoso para:', data.user.Nombre);

              // Redirigir al dashboard
              window.location.href = 'dashboard.html';
          } else {
              // ERROR: Credenciales incorrectas (lo que configuramos en index.js)
              mostrarMensaje('Error de acceso', data.message, 'error');
          }
      } catch (error) {
          console.error('Error de conexión:', error);
          mostrarMensaje('Error técnico', 'No se pudo conectar con el servidor. ¿Olvidaste iniciar node index.js?', 'error');
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
/**
 * ------------------------------------------------------------------------------------------------
 * @Name         Login.jsx
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Authentication Module
 * @Description  Componente visual de la página de inicio de sesión. Muestra el formulario de login
 *               con campos de correo y contraseña, maneja la visualización de errores y el estado
 *               de carga durante la autenticación.
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

// Login.jsx - La interfaz visual (HTML / JSX)
import React from 'react';
import { useLoginLogic } from './useLoginLogic';

/**
 * description: Componente principal de la página de login.
 * author: Camilo Andres Ramirez Ospina | 2026-06-17
 * param: Ninguno (usa el hook useLoginLogic para la lógica)
 * return: JSX con el formulario de autenticación.
 */
const Login = () => {
  // Instanciamos y conectamos nuestro controlador JS
  const logic = useLoginLogic();

  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 relative overflow-hidden">

        {/* ============================================================
            DECORACIÓN SUPERIOR
            ============================================================
            description: Barra decorativa en la parte superior de la tarjeta con gradiente rojo. */}

        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary-dark"></div>

        {/* ============================================================
            BRANDING Y LOGO
            ============================================================
            description: Muestra el logo de la aplicación (SGTV), el título
                         y una breve descripción de bienvenida. */}

        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-primary font-bold text-2xl mb-4 shadow-md shadow-red-200/30 border border-red-100">
            SG
          </div>
          <h1 className="text-xl font-bold text-text-main">Bienvenido a SGTV</h1>
          <p className="text-xs text-text-muted mt-1.5">Ingresa tus credenciales para acceder a la plataforma</p>
        </div>

        {/* ============================================================
            FORMULARIO DE INICIO DE SESIÓN
            ============================================================
            description: Formulario que captura las credenciales del usuario y
                         las envía al backend mediante el hook useLoginLogic.
                         Contiene campos de correo, contraseña y botón de envío. */}

        <form onSubmit={logic.handleSubmit} className="space-y-5">

          {/* ------------------------------------------------------------
              CAMPO: CORREO ELECTRÓNICO
              ------------------------------------------------------------
              description: Input para el correo del usuario con icono y validación
                           de tipo email. Está enlazado al estado 'email' del hook. */}

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted text-sm">
                <i className="fa-regular fa-envelope"></i>
              </span>
              <input
                type="email"
                placeholder="nombre.apellido@vass.com"
                value={logic.email}
                onChange={(e) => logic.setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* ------------------------------------------------------------
              CAMPO: CONTRASEÑA
              ------------------------------------------------------------
              description: Input para la contraseña con icono de candado y botón
                           para mostrar/ocultar el texto. Enlazado al estado 'password'
                           y al toggle 'showPassword' del hook. */}

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted text-sm">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type={logic.showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={logic.password}
                onChange={(e) => logic.setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={() => logic.setShowPassword(!logic.showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-primary transition-colors text-sm"
              >
                <i className={`fa-solid ${logic.showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------
              MENSAJES DE ERROR
              ------------------------------------------------------------
              description: Muestra un mensaje de error (rojo) cuando falla la
                           autenticación. Se oculta automáticamente al reintentar. */}

          {logic.error && (
            <div className="bg-red-50 text-primary text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{logic.error}</span>
            </div>
          )}

          {/* ------------------------------------------------------------
              BOTÓN DE ENVÍO
              ------------------------------------------------------------
              description: Botón principal para enviar el formulario. Muestra un
                           spinner y se deshabilita durante la carga para evitar
                           múltiples envíos. */}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-red-700/20 hover:shadow-red-700/30 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-sm"
            disabled={logic.loading}
          >
            {logic.loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-spinner animate-spin"></i> Cargando...
              </span>
            ) : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* ============================================================
            ENLACE DE RECUPERACIÓN DE CONTRASEÑA
            ============================================================
            description: Enlace (aún no funcional) para restablecer la contraseña
                         en caso de olvido. */}

        <div className="text-center mt-6">
          <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors underline underline-offset-4">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
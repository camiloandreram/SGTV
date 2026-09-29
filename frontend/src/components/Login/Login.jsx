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

import React from 'react';
import { useLoginLogic } from './useLoginLogic';
import { Link } from 'react-router-dom';
import sgtvImg from '../../assets/SGTVimg.png';

const Login = () => {
  const logic = useLoginLogic();

  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex">

      {/* ============================================================
          PANEL IZQUIERDO - Branding + Imagen
          ============================================================ */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 overflow-hidden">

        {/* Círculos decorativos de fondo */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5"></div>
        <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-white/5"></div>
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 rounded-full bg-white/5"></div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">

          {/* Logo/Branding */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-red-700 flex items-center justify-center font-black text-lg shadow-lg">
              SG
            </div>
            <div className="text-white">
              <div className="font-black text-xl leading-none">SGTV</div>
              <div className="text-xs text-red-100 mt-0.5">Gestión de Tiempos y Vacaciones</div>
            </div>
          </div>

          {/* Imagen central */}
          <div className="flex-1 flex items-center justify-center py-8">
            <img
              src={sgtvImg}
              alt="SGTV"
              className="max-w-md w-full drop-shadow-2xl"
            />
          </div>

          {/* Texto inferior */}
          <div className="text-white/90 max-w-md">
            <h2 className="text-2xl font-bold mb-2 leading-tight">
              Bienvenido a tu plataforma de gestión
            </h2>
            <p className="text-sm text-red-100 leading-relaxed">
              Administra tus tiempos, solicita vacaciones y gestiona tus colaboradores
              desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          PANEL DERECHO - Formulario
          ============================================================ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Logo móvil */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-lg shadow-lg">
              SG
            </div>
            <div>
              <div className="font-black text-xl leading-none text-gray-800">SGTV</div>
              <div className="text-xs text-gray-500 mt-0.5">Gestión de Tiempos</div>
            </div>
          </div>

          {/* Tarjeta de login */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa tus credenciales para acceder
              </p>
              {/* Línea roja decorativa */}
              <div className="w-12 h-1 bg-red-600 mx-auto mt-4 rounded-full"></div>
            </div>

            <form onSubmit={logic.handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-sm">
                    <i className="fa-regular fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={logic.email}
                    onChange={(e) => logic.setEmail(e.target.value)}
                    onFocus={logic.clearError}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-sm">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type={logic.showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={logic.password}
                    onChange={(e) => logic.setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => logic.setShowPassword(!logic.showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-red-600 transition-colors text-sm"
                  >
                    <i className={`fa-solid ${logic.showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                  </button>
                </div>
              </div>

              {/* Error */}
              {logic.error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{logic.error}</span>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={logic.loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 transition-all transform active:scale-[0.98] disabled:opacity-70 text-sm"
              >
                {logic.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner animate-spin"></i> Cargando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                to="/forgot-password"
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} SGTV · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
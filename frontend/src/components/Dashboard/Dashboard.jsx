/**
 * ------------------------------------------------------------------------------------------------
 * @Name         Dashboard.jsx
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Dashboard Module
 * @Description  Componente principal del panel de control (Dashboard). Muestra la barra superior
 *               con el logo y cierre de sesión, el perfil del usuario con sus estadísticas rápidas
 *               (vacaciones disponibles, estado) y los accesos rápidos a los módulos disponibles
 *               (Reporte de Horas, Vacaciones, Certificado Laboral, Afiliaciones).
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  const puedeGestionarEmpleados = user?.idPerfil === 1 || user?.idPerfil === 2;

  // Definición de las tarjetas de módulos
  const modulos = [
    {
      to: '/reporte-horas',
      icon: 'fa-clock',
      title: 'Reporte de Horas',
      description: 'Registra tu jornada laboral diaria, horas extra y revisa tu historial.',
      color: 'from-blue-500 to-blue-600',
      visible: true
    },
    {
      to: '/vacaciones',
      icon: 'fa-umbrella-beach',
      title: 'Vacaciones',
      description: 'Consulta tus días disponibles, solicita periodos de descanso y haz seguimiento.',
      color: 'from-amber-500 to-amber-600',
      visible: true
    },
    {
      to: '/empleados',
      icon: 'fa-users-gear',
      title: 'Gestión de Empleados',
      description: 'Registra colaboradores, asigna roles y administra el personal.',
      color: 'from-emerald-500 to-emerald-600',
      visible: puedeGestionarEmpleados
    }
  ].filter(m => m.visible);

  return (
    <div className="min-h-screen bg-slate-50 font-poppins text-gray-800">

      {/* ============================================================
          TOPBAR
          ============================================================ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">

          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-600/20">
              SG
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight tracking-tight text-gray-800">SGTV</h1>
              <p className="text-xs text-gray-500">Gestión de Tiempos y Vacaciones</p>
            </div>
          </div>

          {/* Acciones de usuario */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.Nombre ? user.Nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-gray-700">{user?.Nombre} {user?.Apellido}</div>
                <div className="text-[10px] text-gray-400">{user?.nombre_perfil || 'Usuario'}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all border border-transparent hover:border-red-100"
            >
              <i className="fa-solid fa-power-off"></i>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          CONTENIDO PRINCIPAL
          ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* ==========================================================
              SIDEBAR - Perfil
              ========================================================== */}
          <aside className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">

            {/* Cabecera roja con avatar */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 text-center">
              <div className="bg-white/20 backdrop-blur-sm w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black border-4 border-white/30 mb-3">
                {user?.Nombre ? user.Nombre.trim().charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="font-bold text-white text-base leading-tight">
                {user?.Nombre} {user?.Apellido}
              </h2>
              <p className="text-xs text-red-100 mt-1">
                {user?.nombre_perfil || 'Sin cargo'}
              </p>
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-semibold px-3 py-1 rounded-full mt-3 backdrop-blur-sm">
                <i className="fa-solid fa-building text-[9px]"></i>
                {user?.nombre_depto || 'Sin sede'}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="p-5 space-y-3">
              <div className="bg-gradient-to-br from-red-50 to-white border border-red-100/50 p-4 rounded-2xl">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                  Vacaciones Disponibles
                </div>
                <div className="text-2xl font-black text-red-600">
                  {Math.floor(user?.vacaciones_disponibles || 0)}
                  <span className="text-sm font-medium text-gray-500 ml-1">días</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Estado</span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  user?.Estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user?.Estado || 'Activo'}
                </span>
              </div>
            </div>
          </aside>

          {/* ==========================================================
              MÓDULOS
              ========================================================== */}
          <section className="lg:col-span-3 space-y-6">
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Accesos Rápidos</h3>
              <p className="text-sm text-gray-500 mt-1">Selecciona el módulo al que deseas ingresar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {modulos.map((mod) => (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:border-red-100 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Ícono con gradiente */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} text-white flex items-center justify-center text-xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                      <i className={`fa-solid ${mod.icon}`}></i>
                    </div>

                    <h4 className="font-bold text-lg text-gray-800 group-hover:text-red-600 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center text-xs font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity gap-1.5">
                    Ingresar módulo <i className="fa-solid fa-arrow-right-long text-[10px]"></i>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
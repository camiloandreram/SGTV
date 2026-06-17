// src/components/Dashboard/Dashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext'; // Ajustamos la ruta para salir de la subcarpeta

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-50 font-poppins text-text-main">

      {/* Barra Superior (Topbar) */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">

          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-red-100">
              SG
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">SGTV</h1>
              <p className="text-xs text-text-muted">Gestión de Tiempos y Nómina</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary bg-gray-50 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
            >
              <i className="fa-solid fa-power-off"></i>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Sidebar de Perfil */}
          <aside className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">

              {/* Badge Inicial */}
              <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-red-700/10 mb-4">
                {user?.Nombre ? user.Nombre.trim().charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Información Personal */}
              <h2 className="font-bold text-lg text-text-main leading-snug">
                {user?.Nombre} {user?.Apellido}
              </h2>
              <p className="text-sm font-medium text-primary mt-1">
                {user?.nombre_perfil || 'Sin cargo'}
              </p>
              <p className="text-xs text-text-muted bg-gray-50 px-3 py-1 rounded-full mt-2 border border-gray-100">
                <i className="fa-solid fa-building mr-1.5"></i>
                {user?.nombre_depto || 'Sin sede'}
              </p>
            </div>

            <hr className="my-6 border-gray-100" />

            {/* Estadísticas Rápidas */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-50 to-white border border-red-100/50 p-4 rounded-2xl">
                <div className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Vacaciones Disponibles</div>
                <div className="text-xl font-extrabold text-primary">
                  {Math.floor(user?.vacaciones_disponibles || 0)} <span className="text-sm font-normal text-text-main">días</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Estado</span>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-800">
                  {user?.Estado || 'Activo'}
                </span>
              </div>
            </div>
          </aside>

          {/* Sección de Accesos Rápidos (Tiles) */}
          <section className="lg:col-span-3 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-text-main tracking-tight">Accesos Rápidos</h3>
              <p className="text-sm text-text-muted mt-0.5">Selecciona el módulo al que deseas ingresar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Tarjeta: Reporte de Horas */}
              <a href="/reporte-horas" className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="bg-gray-50 group-hover:bg-red-50 text-text-muted group-hover:text-primary w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors duration-300">
                    <i className="fa-regular fa-clock"></i>
                  </div>
                  <h4 className="font-bold text-base mt-4 text-text-main group-hover:text-primary transition-colors">
                    Reporte de Horas
                  </h4>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Registra tu jornada laboral diaria, horas extra y revisa tu historial de manera ágil.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1.5">
                  Ingresar módulo <i className="fa-solid fa-arrow-right-long text-[10px]"></i>
                </div>
              </a>

              {/* Tarjeta: Vacaciones */}
              <a href="/vacaciones" className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="bg-gray-50 group-hover:bg-red-50 text-text-muted group-hover:text-primary w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors duration-300">
                    <i className="fa-solid fa-umbrella-beach"></i>
                  </div>
                  <h4 className="font-bold text-base mt-4 text-text-main group-hover:text-primary transition-colors">
                    Vacaciones
                  </h4>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Consulta tus días disponibles, solicita tus periodos de descanso y haz seguimiento a las aprobaciones.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1.5">
                  Ingresar módulo <i className="fa-solid fa-arrow-right-long text-[10px]"></i>
                </div>
              </a>

              {/* Tarjeta: Certificado Laboral */}
              <a href="#" className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col justify-between opacity-80 hover:opacity-100">
                <div>
                  <div className="bg-gray-50 text-text-muted w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
                    <i className="fa-solid fa-file-contract"></i>
                  </div>
                  <h4 className="font-bold text-base mt-4 text-text-main">
                    Certificado Laboral
                  </h4>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Descarga de forma instantánea tu carta o certificación laboral vigente en formato PDF.
                  </p>
                </div>
                <div className="mt-6 text-xs font-medium text-text-muted italic">
                  Próximamente disponible
                </div>
              </a>

              {/* Tarjeta: Afiliaciones */}
              <a href="#" className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col justify-between opacity-80 hover:opacity-100">
                <div>
                  <div className="bg-gray-50 text-text-muted w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
                    <i className="fa-solid fa-handshake-angle"></i>
                  </div>
                  <h4 className="font-bold text-base mt-4 text-text-main">
                    Afiliaciones y Seguridad Social
                  </h4>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Consulta tu estado actual de afiliación al sistema general de salud (EPS), fondo de pensiones y ARL.
                  </p>
                </div>
                <div className="mt-6 text-xs font-medium text-text-muted italic">
                  Próximamente disponible
                </div>
              </a>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
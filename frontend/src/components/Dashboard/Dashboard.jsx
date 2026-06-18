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

// src/components/Dashboard/Dashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext'; // Ajustamos la ruta para salir de la subcarpeta

/**
 * description: Componente principal del panel de control (Dashboard).
 * author: Camilo Andres Ramirez Ospina | 2026-06-17
 * param: Ninguno (usa useContext para obtener user y logout)
 * return: JSX con la barra superior, el perfil del usuario y los accesos rápidos.
 */
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-50 font-poppins text-text-main">

      {/* ============================================================
          BARRA SUPERIOR (TOPBAR)
          ============================================================
          description: Barra superior fija que contiene el logo/branding de la aplicación
                       y el botón de cierre de sesión. Se mantiene visible al hacer scroll. */}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">

          {/* ==========================================================
              LOGO Y BRANDING
              ==========================================================
              description: Muestra el logo de la aplicación (SG) y el nombre
                           junto con la descripción "Gestión de Tiempos y Nómina". */}

          <div className="flex items-center gap-3">
            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-red-100">
              SG
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">SGTV</h1>
              <p className="text-xs text-text-muted">Gestión de Tiempos y Nómina</p>
            </div>
          </div>

          {/* ==========================================================
              ACCIONES DE USUARIO
              ==========================================================
              description: Botón para cerrar sesión. Al hacer clic, ejecuta la
                           función logout del contexto de autenticación. */}

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

      {/* ============================================================
          CONTENIDO PRINCIPAL
          ============================================================
          description: Contenedor principal del dashboard con grid de dos columnas
                       (sidebar de perfil + sección de accesos rápidos). */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* ==========================================================
              SIDEBAR DE PERFIL DE USUARIO
              ==========================================================
              description: Barra lateral que muestra la información del usuario
                           logueado: iniciales, nombre completo, cargo, departamento,
                           estadísticas de vacaciones disponibles y estado. */}

          <aside className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">

              {/* ======================================================
                  BADGE CON INICIALES DEL USUARIO
                  ======================================================
                  description: Círculo con las iniciales del usuario (primera letra
                               del nombre) como avatar visual. Si no hay nombre,
                               muestra 'U' por defecto. */}

              <div className="bg-primary text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-red-700/10 mb-4">
                {user?.Nombre ? user.Nombre.trim().charAt(0).toUpperCase() : 'U'}
              </div>

              {/* ======================================================
                  INFORMACIÓN PERSONAL DEL USUARIO
                  ======================================================
                  description: Muestra el nombre completo, el cargo (perfil) y
                               el departamento al que pertenece el usuario. */}

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

            {/* ======================================================
                ESTADÍSTICAS RÁPIDAS
                ======================================================
                description: Tarjetas con indicadores clave del usuario:
                             - Vacaciones disponibles (días)
                             - Estado actual (Activo, Inactivo, etc.) */}

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

          {/* ==========================================================
              SECCIÓN DE ACCESOS RÁPIDOS (TILES)
              ==========================================================
              description: Grid de tarjetas que muestran los módulos disponibles
                           para que el usuario navegue. Cada tarjeta tiene un icono,
                           título, descripción y enlace al módulo correspondiente.
                           Algunas tarjetas (Certificado Laboral, Afiliaciones)
                           están marcadas como "Próximamente disponible". */}

          <section className="lg:col-span-3 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-text-main tracking-tight">Accesos Rápidos</h3>
              <p className="text-sm text-text-muted mt-0.5">Selecciona el módulo al que deseas ingresar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ======================================================
                  TARJETA: REPORTE DE HORAS
                  ======================================================
                  description: Tarjeta que redirige al módulo de Reporte de Horas.
                               Muestra un icono de reloj, título y descripción del módulo.
                               Al hacer hover, se resalta el borde y aparece un texto
                               indicando "Ingresar módulo". */}

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

              {/* ======================================================
                  TARJETA: VACACIONES
                  ======================================================
                  description: Tarjeta que redirige al módulo de Vacaciones.
                               Muestra un icono de playa/paraguas, título y descripción.
                               Permite consultar días disponibles, solicitar periodos
                               de descanso y hacer seguimiento a aprobaciones. */}

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
               {/* ======================================================
                  TARJETA: Creacion de cliente
                  ======================================================
                  description: Tarjeta que redirige al módulo de Vacaciones.
                               Muestra un icono de playa/paraguas, título y descripción.
                               Permite consultar días disponibles, solicitar periodos
                               de descanso y hacer seguimiento a aprobaciones. */}
              <a href="/empleados" className="group bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="bg-gray-50 group-hover:bg-red-50 text-text-muted group-hover:text-primary w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors duration-300">
                    <i className="fa-solid fa-user-plus"></i>
                  </div>
                  <h4 className="font-bold text-base mt-4 text-text-main group-hover:text-primary transition-colors">
                    Gestión de Empleados
                  </h4>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Registra nuevos colaboradores en el sistema, asigna su rol de acceso y vincula su departamento correspondiente.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-1.5">
                  Ingresar módulo <i className="fa-solid fa-arrow-right-long text-[10px]"></i>
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
/**
 * ------------------------------------------------------------------------------------------------
 * @Name         Vacations.jsx
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Vacations Module
 * @Description  Componente visual principal del módulo de vacaciones. Muestra el formulario de solicitud,
 *               el resumen de días disponibles, el historial del usuario y el panel de aprobaciones
 *               para líderes de proyecto.
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

// src/components/Vacations/Vacations.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useVacationsLogic } from './useVacationsLogic'; // <-- Importamos su controlador JS

/**
 * description: Componente principal del módulo de vacaciones.
 * author: Camilo Andres Ramirez Ospina | 2026-06-17
 * param: Ninguno (usa useContext para obtener user y refreshUser)
 * return: JSX con la interfaz completa de gestión de vacaciones.
 */
const Vacations = () => {
  const { user, refreshUser } = useContext(AuthContext);

  const logic = useVacationsLogic(user, refreshUser);

  return (
    <div className="p-1.5 animate-fade-in text-text-main font-poppins">

      {/* ============================================================
          ENCABEZADO DEL MÓDULO
          ============================================================
          description: Encabezado principal que muestra el título y una breve descripción del módulo. */}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Módulo de Vacaciones</h1>
        <p className="text-sm text-text-muted">Gestiona tus solicitudes de descanso y aprobaciones de equipo.</p>
      </div>

      {/* ============================================================
          ALERTAS Y MENSAJES DE RETROALIMENTACIÓN
          ============================================================
          description: Muestra mensajes de éxito o error después de acciones (envío, aprobación, etc.). */}

      {logic.message.text && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${
          logic.message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {logic.message.type === 'success' ? <i className="fa-solid fa-circle-check mr-2"></i> : <i className="fa-solid fa-circle-exclamation mr-2"></i>}
          {logic.message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* ------------------------------------------------------------
            FORMULARIO DE SOLICITUD DE VACACIONES
            ------------------------------------------------------------
            description: Formulario para crear una nueva solicitud de vacaciones. Contiene campos
                         de fecha de inicio, fecha fin, comentarios y un botón de envío.
                         Se conecta con las funciones del hook useVacationsLogic. */}

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <i className="fa-solid fa-calendar-plus text-primary"></i> Nueva Solicitud
          </h2>
          <form onSubmit={logic.handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-2">Fecha de Inicio</label>
                <input
                  type="date"
                  value={logic.startDate}
                  onChange={(e) => logic.setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-2">Fecha de Fin</label>
                <input
                  type="date"
                  value={logic.endDate}
                  onChange={(e) => logic.setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-2">Comentarios / Justificación</label>
              <textarea
                rows="3"
                value={logic.comments}
                onChange={(e) => logic.setComments(e.target.value)}
                placeholder="Ej: Vacaciones reglamentarias correspondientes al periodo anterior..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              ></textarea>
            </div>

            {/* ----------------------------------------------------------
                RESULTADO DEL CÁLCULO DE DÍAS HÁBILES Y BOTÓN DE ENVÍO
                ----------------------------------------------------------
                description: Muestra el número de días hábiles estimados y el botón para enviar
                             la solicitud. El botón se deshabilita si no hay días hábiles o
                             si la carga está en curso. */}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-light p-4 rounded-xl border border-gray-100">
              <div className="text-sm">
                <span className="text-text-muted">Días hábiles estimados:</span>{' '}
                <strong className="text-primary text-base font-bold">{logic.calculatedDays} días</strong>
                <p className="text-xs text-text-muted mt-0.5">(Excluye fines de semana. Los festivos se validarán en el servidor).</p>
              </div>
              <button
                type="submit"
                disabled={logic.loading || logic.calculatedDays === 0}
                className="bg-primary text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-900/10"
              >
                {logic.loading ? <span className="flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin"></i> Enviando...</span> : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>

        {/* ------------------------------------------------------------
            RESUMEN DE SALDOS Y DATOS DEL USUARIO
            ------------------------------------------------------------
            description: Tarjeta que muestra los días de vacaciones disponibles, el proyecto activo
                         y el líder aprobador del usuario actual. */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-primary"></i> Estado de Días
            </h2>
            <div className="bg-bg-light rounded-xl p-5 text-center border border-gray-50 mb-4">
              <div className="text-4xl font-extrabold text-primary mb-1">
                {Math.floor(user?.vacaciones_disponibles || 0)}
              </div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Días Disponibles</div>
            </div>
            <div className="space-y-2 text-xs text-text-muted border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span>Proyecto Activo:</span>
                <span className="font-semibold text-text-main">{user?.nombre_proyecto || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Líder Aprobador:</span>
                <span className="font-semibold text-text-main">
                  {user?.idUsuario === user?.idResponsableP ? 'Tú eres el Líder' : 'Responsable del Proyecto'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 p-3.5 bg-red-50/50 rounded-xl border border-red-100 flex gap-3 items-start">
            <i className="fa-solid fa-circle-info text-primary mt-0.5"></i>
            <p className="text-xs text-red-900 leading-relaxed">
              <strong>Nota:</strong> Las solicitudes de vacaciones quedan sujetas a la aprobación de tu líder directo.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          TABLA DE HISTORIAL DE SOLICITUDES
          ============================================================
          description: Tabla que lista todas las solicitudes de vacaciones realizadas por el usuario
                       actual, mostrando ID, fechas, días hábiles, comentarios y estado. */}

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-history text-primary"></i> Mi Historial de Solicitudes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-text-muted uppercase bg-bg-light">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Fecha Inicio</th>
                <th className="py-3 px-4">Fecha Fin</th>
                <th className="py-3 px-4">Días Hábiles</th>
                <th className="py-3 px-4">Comentarios</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logic.misSolicitudes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-text-muted italic">
                    No has registrado solicitudes de vacaciones aún.
                  </td>
                </tr>
              ) : (
                /* --------------------------------------------
                   RENDERIZADO DE CADA SOLICITUD
                   --------------------------------------------
                   description: Mapeo de cada solicitud para renderizar una fila en la tabla.
                                Cada fila muestra los datos de la solicitud y el estado con colores. */
                logic.misSolicitudes.map((sol) => (
                  <tr key={sol.idSolicitud} className="hover:bg-bg-light/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-gray-500">#{sol.idSolicitud}</td>
                    <td className="py-3.5 px-4">{sol.Fecha_Inicio ? sol.Fecha_Inicio.split('T')[0] : 'N/A'}</td>
                    <td className="py-3.5 px-4">{sol.Fecha_Fin ? sol.Fecha_Fin.split('T')[0] : 'N/A'}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">{sol.cantidadDias}</td>
                    <td className="py-3.5 px-4 text-text-muted max-w-xs truncate">{sol.comentarios || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                        sol.Estado === 'Aprobado' ? 'bg-green-100 text-green-700' :
                        sol.Estado === 'Rechazado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sol.Estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================
          PANEL DE APROBACIONES PARA LÍDERES (Condicional)
          ============================================================
          description: Panel que solo se muestra si el usuario actual es líder de proyecto
                       (idUsuario === idResponsableP). Muestra las solicitudes pendientes de los
                       miembros del equipo con botones para aprobar o rechazar. */}

      {user?.idUsuario === user?.idResponsableP && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <i className="fa-solid fa-user-check text-green-600"></i> Panel de Aprobaciones (Líder de Proyecto)
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Solicitudes pendientes de los integrantes de tu proyecto asignado.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-text-muted uppercase bg-bg-light">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Fecha Inicio</th>
                  <th className="py-3 px-4">Fecha Fin</th>
                  <th className="py-3 px-4">Días Hábiles</th>
                  <th className="py-3 px-4">Comentarios</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logic.solicitudesPendientesLider.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-text-muted italic">
                      No hay solicitudes pendientes por aprobar en tu proyecto.
                    </td>
                  </tr>
                ) : (
                  /* --------------------------------------------
                     RENDERIZADO DE SOLICITUDES PENDIENTES
                     --------------------------------------------
                     description: Mapeo de cada solicitud pendiente con botones para aprobar o rechazar.
                                  Cada fila muestra el nombre del empleado, fechas, días y comentarios. */
                  logic.solicitudesPendientesLider.map((sol) => (
                    <tr key={sol.idSolicitud} className="hover:bg-bg-light/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium">{sol.NombreEmpleado} {sol.ApellidoEmpleado}</td>
                      <td className="py-3.5 px-4">{sol.Fecha_Inicio ? sol.Fecha_Inicio.split('T')[0] : 'N/A'}</td>
                      <td className="py-3.5 px-4">{sol.Fecha_Fin ? sol.Fecha_Fin.split('T')[0] : 'N/A'}</td>
                      <td className="py-3.5 px-4 font-bold text-primary">{sol.cantidadDias}</td>
                      <td className="py-3.5 px-4 italic text-text-muted max-w-xs truncate">{sol.comentarios || 'Sin comentarios'}</td>
                      <td className="py-3.5 px-4 text-center space-x-2">
                        <button
                          onClick={() => logic.handleProcesarSolicitud(sol.idSolicitud, 'Aprobar')}
                          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => logic.handleProcesarSolicitud(sol.idSolicitud, 'Rechazar')}
                          className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Vacations;
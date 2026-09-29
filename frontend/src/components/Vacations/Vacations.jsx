import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useVacationsLogic } from './useVacationsLogic';

const Vacations = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const logic = useVacationsLogic(user, refreshUser);

  const esLider = user?.idUsuario === user?.idResponsableP || user?.idPerfil === 2;

  return (
    <div className="min-h-screen bg-slate-50 font-poppins text-text-main">

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">

          {/* ============================================================
              CABECERA DEL MÓDULO
              ============================================================ */}
          <div className="mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              <i className="fa-solid fa-umbrella-beach"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800">Módulo de Vacaciones</h1>
              <p className="text-xs text-gray-500">
                Gestiona tus solicitudes de descanso y aprobaciones de equipo.
              </p>
            </div>
          </div>

          {/* ============================================================
              MENSAJES DE ESTADO
              ============================================================ */}
          {logic.message.text && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium border flex items-start gap-2 ${
              logic.message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <i className={`fa-solid mt-0.5 ${logic.message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              <span>{logic.message.text}</span>
            </div>
          )}

          {/* ============================================================
              GRID PRINCIPAL: FORMULARIO + TARJETA DE DÍAS
              ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* -------- Formulario Nueva Solicitud -------- */}
            <div className="lg:col-span-2 border border-gray-200 rounded-2xl p-6 bg-slate-50/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <i className="fa-solid fa-calendar-plus text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">Nueva Solicitud</h2>
                  <p className="text-xs text-gray-500">Selecciona el rango de fechas para tu descanso</p>
                </div>
              </div>

              <form onSubmit={logic.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={logic.startDate}
                      onChange={(e) => logic.setStartDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={logic.endDate}
                      onChange={(e) => logic.setEndDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Alerta de conflicto */}
                {logic.conflicto && (
                  <div className="p-4 rounded-xl text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 flex gap-3 items-start">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                    <div>
                      <strong>Conflicto de fechas:</strong> Ya tienes una solicitud
                      <span className="font-bold"> {logic.conflicto.Estado.toLowerCase()}</span> en el rango{' '}
                      <span className="font-mono">
                        {String(logic.conflicto.Fecha_Inicio).substring(0, 10)} → {String(logic.conflicto.Fecha_Fin).substring(0, 10)}
                      </span>.
                      <br />
                      Elige un rango diferente para continuar.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Comentarios / Justificación
                  </label>
                  <textarea
                    rows="3"
                    value={logic.comments}
                    onChange={(e) => logic.setComments(e.target.value)}
                    placeholder="Ej: Vacaciones reglamentarias correspondientes al periodo anterior..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                  ></textarea>
                </div>

                {/* Resumen + Botón */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-calculator text-amber-600"></i>
                      <span className="text-gray-500">Días hábiles estimados:</span>
                      <strong className="text-amber-700 text-lg font-black">{logic.calculatedDays}</strong>
                      <span className="text-gray-500 text-xs">días</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Excluye fines de semana y festivos colombianos. Se valida en el servidor.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={logic.loading || logic.calculatedDays === 0 || !!logic.conflicto}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    {logic.loading ? (
                      <><i className="fa-solid fa-spinner animate-spin"></i> Enviando...</>
                    ) : (
                      <><i className="fa-solid fa-paper-plane"></i> Enviar Solicitud</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* -------- Tarjeta de Estado de Días -------- */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-amber-50/60 to-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <i className="fa-solid fa-chart-pie text-amber-600"></i>
                  <h2 className="text-base font-bold text-gray-800">Estado de Días</h2>
                </div>

                {/* Días disponibles */}
                <div className="bg-white rounded-2xl p-5 text-center border border-amber-100 shadow-sm mb-4">
                  <div className="text-5xl font-black text-amber-600 leading-none mb-1">
                    {Math.floor(user?.vacaciones_disponibles || 0)}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Días Disponibles
                  </div>
                </div>

                {/* Detalle */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-white/70 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <i className="fa-solid fa-diagram-project text-[10px]"></i> Proyecto
                    </span>
                    <span className="font-bold text-gray-700 truncate max-w-[120px]">
                      {user?.nombre_proyecto || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white/70 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <i className="fa-solid fa-user-tie text-[10px]"></i> Aprobador
                    </span>
                    <span className="font-bold text-gray-700 text-[11px]">
                      {esLider ? 'Tú eres el Líder' : 'Responsable'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 bg-amber-100/60 rounded-xl border border-amber-200 flex gap-2 items-start">
                <i className="fa-solid fa-circle-info text-amber-700 mt-0.5 text-xs"></i>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Las solicitudes quedan sujetas a la aprobación de tu líder directo.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================
              HISTORIAL DE SOLICITUDES
              ============================================================ */}
          <section className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <i className="fa-solid fa-history text-sm"></i>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Mi Historial de Solicitudes</h2>
                <p className="text-[11px] text-gray-500">Todas tus solicitudes registradas</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Fecha Inicio</th>
                    <th className="py-3 px-5">Fecha Fin</th>
                    <th className="py-3 px-5 text-center">Días Hábiles</th>
                    <th className="py-3 px-5">Comentarios</th>
                    <th className="py-3 px-5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logic.misSolicitudes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400 text-sm">
                        <i className="fa-solid fa-inbox text-3xl block mb-2 text-gray-300"></i>
                        No has registrado solicitudes de vacaciones aún.
                      </td>
                    </tr>
                  ) : (
                    logic.misSolicitudes.map((sol) => (
                      <tr key={sol.idSolicitud} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-gray-500 text-xs">#{sol.idSolicitud}</td>
                        <td className="py-3.5 px-5 font-medium">
                          {sol.Fecha_Inicio ? String(sol.Fecha_Inicio).substring(0, 10) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-5 font-medium">
                          {sol.Fecha_Fin ? String(sol.Fecha_Fin).substring(0, 10) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
                            {sol.cantidadDias}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-gray-500 text-xs max-w-xs truncate">
                          {sol.comentarios || '—'}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                            sol.Estado === 'Aprobado' ? 'bg-green-100 text-green-700' :
                            sol.Estado === 'Rechazado' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            <i className={`fa-solid text-[8px] ${
                              sol.Estado === 'Aprobado' ? 'fa-circle-check' :
                              sol.Estado === 'Rechazado' ? 'fa-circle-xmark' :
                              'fa-clock'
                            }`}></i>
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
              PANEL DE APROBACIONES (LÍDER)
              ============================================================ */}
          {esLider && (
            <section className="border border-green-100 rounded-2xl overflow-hidden bg-green-50/20">
              <div className="bg-gradient-to-r from-green-50 to-white border-b border-green-100 px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-md shadow-green-500/20">
                  <i className="fa-solid fa-user-check text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">Panel de Aprobaciones</h2>
                  <p className="text-[11px] text-gray-500">
                    Solicitudes pendientes de los integrantes de tu proyecto
                  </p>
                </div>
                {logic.solicitudesPendientesLider.length > 0 && (
                  <span className="ml-auto bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {logic.solicitudesPendientesLider.length} pendiente(s)
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-5">Colaborador</th>
                      <th className="py-3 px-5">Fecha Inicio</th>
                      <th className="py-3 px-5">Fecha Fin</th>
                      <th className="py-3 px-5 text-center">Días</th>
                      <th className="py-3 px-5">Comentarios</th>
                      <th className="py-3 px-5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logic.solicitudesPendientesLider.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400 text-sm">
                          <i className="fa-solid fa-circle-check text-3xl block mb-2 text-gray-300"></i>
                          No hay solicitudes pendientes por aprobar.
                        </td>
                      </tr>
                    ) : (
                      logic.solicitudesPendientesLider.map((sol) => (
                        <tr key={sol.idSolicitud} className="hover:bg-green-50/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-xs font-bold">
                                {sol.NombreEmpleado?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800 text-sm">
                                  {sol.NombreEmpleado} {sol.ApellidoEmpleado}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-medium">
                            {sol.Fecha_Inicio ? String(sol.Fecha_Inicio).substring(0, 10) : 'N/A'}
                          </td>
                          <td className="py-3.5 px-5 font-medium">
                            {sol.Fecha_Fin ? String(sol.Fecha_Fin).substring(0, 10) : 'N/A'}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-black">
                              {sol.cantidadDias}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-gray-500 text-xs italic max-w-xs truncate">
                            {sol.comentarios || 'Sin comentarios'}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => logic.handleProcesarSolicitud(sol.idSolicitud, 'Aprobar')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors"
                              >
                                <i className="fa-solid fa-check"></i> Aprobar
                              </button>
                              <button
                                onClick={() => logic.handleProcesarSolicitud(sol.idSolicitud, 'Rechazar')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors"
                              >
                                <i className="fa-solid fa-xmark"></i> Rechazar
                              </button>
                            </div>
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
      </div>
    </div>
  );
};

export default Vacations;
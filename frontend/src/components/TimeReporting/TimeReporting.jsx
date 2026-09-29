/**
 * ------------------------------------------------------------------------------------------------
 * @Name         TimeReporting.jsx
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Time Reporting Module
 * @Description  Componente visual principal del módulo de reporte de tiempos. Muestra una matriz
 *               semanal de horas por proyecto, con navegación entre semanas, indicadores de festivos,
 *               progreso semanal y consolidado mensual. Bloquea los días que no pertenecen al mes
 *               de referencia del lunes visible.
 * @Changes      (most recent first)
 * 2026-09-28    Camilo Andres Ramirez Ospina    Bloqueo de días fuera del mes de referencia y
 *                                               badge del mes visible.
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { useTimeReportingLogic } from './useTimeReportingLogic';

/**
 * description: Componente principal del módulo de reporte de tiempos.
 * author: Camilo Andres Ramirez Ospina | 2026-06-17
 * param: Ninguno (usa useContext para obtener user)
 * return: JSX con la matriz de horas semanal, navegación y métricas.
 */
const TimeReporting = () => {
  const { user } = useContext(AuthContext);

  const {
    weekRangeText,
    mesReferenciaTexto,
    weekHeaders,
    diasMesActual,
    projects,
    message,
    metaHoras,
    totalMesTrabajado,
    minimoMesExigido,
    esMesFuturo,
    festivosSemana,
    handleNavigateWeek,
    handleHourChange,
    getProjectTotal,
    getDayTotal,
    getGrandTotal,
    handleSubmitReport
  } = useTimeReportingLogic(user);

  return (

    <div className="min-h-screen bg-slate-50 font-poppins text-text-main p-6">
      <div className="max-w-7xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">

        {/* ============================================================
            CABECERA PRINCIPAL
            ============================================================ */}

        {/* Cabecera */}
        <div className="mb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            {/* Ícono del módulo */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800">
                Registro de tiempos de {user?.Nombre} {user?.Apellido}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Grupo de personal: D - Empleados Hábiles</p>
            </div>
          </div>
          <Link to="/" className="text-xs bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600 px-3 py-1.5 rounded-lg transition-all">
            <i className="fa-solid fa-arrow-left mr-1"></i> Dashboard
          </Link>
        </div>

        {/* ============================================================
            CONTADORES SUPERIORES
            ============================================================ */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progreso de la Semana</span>
              <div className="text-xs font-bold text-gray-700 font-mono">
                {Number(getGrandTotal() || 0).toFixed(2)} / {Number(metaHoras || 0).toFixed(2)} h
              </div>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getGrandTotal() >= metaHoras ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min((getGrandTotal() / (metaHoras || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-4 bg-red-50/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">Consolidado Horas del Mes</span>
              <p className="text-2xl font-black text-slate-800 font-mono mt-1">
                {Number(totalMesTrabajado || 0).toFixed(2)} <span className="text-sm font-normal text-gray-400">/ {Number(minimoMesExigido || 0)} h min. requeridas</span>
              </p>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <i className="fa-solid fa-calendar-days text-xl"></i>
            </div>
          </div>
        </div>

        {/* ============================================================
            NAVEGADOR ENTRE SEMANAS + BADGE DEL MES
            ============================================================ */}

        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            {/* Botón semana anterior */}
            <button
              type="button"
              onClick={() => handleNavigateWeek('prev')}
              title="Semana anterior"
              aria-label="Semana anterior"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 transition-colors border border-gray-100 hover:border-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="px-4 text-sm font-bold tracking-wide text-gray-700 min-w-[200px] text-center font-mono">
              {weekRangeText}
            </div>

            {/* Botón semana siguiente */}
            <button
              type="button"
              onClick={() => handleNavigateWeek('next')}
              title="Semana siguiente"
              aria-label="Semana siguiente"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 transition-colors border border-gray-100 hover:border-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Mes: {mesReferenciaTexto}
          </span>
    </div>

        {/* ============================================================
            MENSAJE DE MES FUTURO
            ============================================================ */}

        {esMesFuturo && (
          <div className="p-4 rounded-xl text-sm mb-6 border font-medium bg-amber-50 text-amber-800 border-amber-200">
            <i className="mr-2 fa-solid fa-lock"></i>
            Esta semana pertenece a un mes futuro en el calendario. El registro de tiempos está deshabilitado.
          </div>
        )}

        {/* ============================================================
            MENSAJES DE RETROALIMENTACIÓN
            ============================================================ */}

        {message.text && (
          <div className={`p-4 rounded-xl text-sm mb-6 border font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <i className={`mr-2 fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {message.text}
          </div>
        )}

        {/* ============================================================
            TABLA MATRIZ DE HORAS
            ============================================================ */}

        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase">
                <th className="py-3 px-4 w-1/3">Asignación / Proyecto</th>
                {weekHeaders.map((head, idx) => {
                  const esFestivo = festivosSemana[idx];
                  const esOtroMes = !diasMesActual[idx];
                  return (
                    <th
                      key={idx}
                      className={`py-3 px-1 text-center text-[11px] w-[9%] transition-all ${
                        esFestivo
                          ? 'bg-emerald-50 text-emerald-800 border-x border-emerald-100/50'
                          : esOtroMes
                          ? 'bg-gray-100 text-gray-400 border-x border-gray-200'
                          : ''
                      }`}
                    >
                      <div className="font-bold">{head.label}</div>
                      <div className={`font-normal mt-0.5 ${
                        esFestivo
                          ? 'text-emerald-600 font-bold'
                          : esOtroMes
                          ? 'text-gray-500 font-bold'
                          : 'text-gray-400'
                      }`}>
                        {head.display.split(' ')[1]}
                        {esFestivo && ' • FESTIVO'}
                        {esOtroMes && !esFestivo && ' • OTRO MES'}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-4 text-center w-[10%] bg-slate-100/50">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner animate-spin mr-2"></i> Cargando cuadrícula de tiempos...
                  </td>
                </tr>
              ) : (
                projects.map((proj, pIdx) => (
                  <tr key={proj.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-800 uppercase text-xs font-mono tracking-wider">{proj.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{proj.description}</div>
                    </td>
                    {proj.hours.map((hourValue, dIdx) => {
                      const esFestivo = festivosSemana[dIdx];
                      const esOtroMes = !diasMesActual[dIdx];
                      const esFinDeSemana = dIdx === 5 || dIdx === 6;
                      const bloquearInput = esFestivo || esMesFuturo || esOtroMes;

                      return (
                        <td
                          key={dIdx}
                          className={`py-2 px-1 transition-all ${
                            esFestivo
                              ? 'bg-emerald-50/40 border-x border-emerald-100/20'
                              : esOtroMes
                              ? 'bg-gray-100/60 border-x border-gray-200/40'
                              : ''
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={hourValue === 0 ? '' : hourValue}
                            placeholder={
                              esOtroMes
                                ? '—'
                                : esFestivo
                                ? '🌴'
                                : esMesFuturo
                                ? '🚫'
                                : '0'
                            }
                            disabled={bloquearInput}
                            onChange={(e) => handleHourChange(pIdx, dIdx, e.target.value)}
                            className={`w-full text-center border rounded-lg p-1.5 text-xs font-semibold font-mono outline-none transition-all ${
                              esFestivo
                                ? 'bg-emerald-100/60 border-emerald-200 text-emerald-800 cursor-not-allowed shadow-none font-bold'
                                : esOtroMes
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : esMesFuturo
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                : esFinDeSemana
                                ? 'bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:bg-white'
                                : 'bg-gray-50 border-gray-200 focus:border-red-400 focus:bg-white'
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-center font-bold text-gray-700 bg-slate-50/40 font-mono">
                      {getProjectTotal(proj.hours)}h
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-xs border-t border-gray-100">
                <td className="py-3 px-4 text-gray-500">TOTAL DIARIO</td>
                {weekHeaders.map((_, dIdx) => (
                  <td
                    key={dIdx}
                    className={`py-3 px-1 text-center font-mono ${
                      festivosSemana[dIdx]
                        ? 'text-emerald-700 bg-emerald-50/40 font-bold'
                        : !diasMesActual[dIdx]
                        ? 'text-gray-400 bg-gray-100/60'
                        : 'text-gray-700'
                    }`}
                  >
                    {diasMesActual[dIdx] ? getDayTotal(dIdx) : '—'}
                  </td>
                ))}
                <td className="py-3 px-4 text-center text-red-600 bg-red-50 font-black font-mono text-sm">
                  {getGrandTotal()}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ============================================================
            LEYENDA
            ============================================================ */}

        <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200 inline-block"></span>
            Festivo (no editable)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block"></span>
            Otro mes (no editable)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 inline-block"></span>
            Fin de semana
          </span>
        </div>

        {/* ============================================================
            BOTÓN DE GUARDADO
            ============================================================ */}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmitReport}
            disabled={projects.length === 0 || esMesFuturo}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 flex items-center gap-2 shadow-md">
            <i className="fa-solid fa-floppy-disk"></i>
            Guardar Registro de Tiempos
          </button>
        </div>

      </div>
    </div>
  );
};

export default TimeReporting;
/**
 * ------------------------------------------------------------------------------------------------
 * @Name         TimeReporting.jsx
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Time Reporting Module
 * @Description  Componente visual principal del módulo de reporte de tiempos. Muestra una matriz
 *               semanal de horas por proyecto, con navegación entre semanas, indicadores de festivos,
 *               progreso semanal y consolidado mensual.
 * @Changes      (most recent first)
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
    weekHeaders,
    projects,
    message,
    metaHoras,
    totalMesTrabajado,
    minimoMesExigido,
    esMesFuturo,
    festivosSemana, // <-- Consumimos el arreglo de la lógica
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
            ============================================================
            description: Muestra el nombre del usuario, el grupo de personal y un enlace
                         para volver al dashboard. */}

        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Registro de tiempos de {user?.Nombre ? `${user.Nombre} ${user.Apellido}` : 'Camilo Ramirez'}
            </h1>
            <p className="text-xs text-gray-500">Grupo de personal: D - Empleados Hábiles</p>
          </div>
          <Link to="/" className="text-xs bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600 px-3 py-1.5 rounded-lg transition-all">
            <i className="fa-solid fa-arrow-left mr-1"></i> Dashboard
          </Link>
        </div>

        {/* ============================================================
            CONTADORES SUPERIORES
            ============================================================
            description: Muestra dos tarjetas: una con la barra de progreso de la semana
                         (comparando horas acumuladas vs meta) y otra con el consolidado
                         de horas del mes vs el mínimo requerido. */}

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
            NAVEGADOR ENTRE SEMANAS
            ============================================================
            description: Botones para navegar entre semanas (anterior/siguiente) con
                         visualización del rango de fechas en formato ISO. */}

        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            <button onClick={() => handleNavigateWeek('prev')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <div className="px-4 text-sm font-bold tracking-wide text-gray-700 min-w-[200px] text-center font-mono">
              {weekRangeText}
            </div>
            <button onClick={() => handleNavigateWeek('next')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>

        {/* ============================================================
            MENSAJE DE MES FUTURO
            ============================================================
            description: Alerta que se muestra cuando la semana seleccionada pertenece
                         a un mes futuro, indicando que el registro está deshabilitado. */}

        {esMesFuturo && (
          <div className="p-4 rounded-xl text-sm mb-6 border font-medium bg-amber-50 text-amber-800 border-amber-200">
            <i className="mr-2 fa-solid fa-lock"></i>
            Esta semana pertenece a un mes futuro en el calendario. El registro de tiempos está deshabilitado.
          </div>
        )}

        {/* ============================================================
            MENSAJES DE RETROALIMENTACIÓN
            ============================================================
            description: Muestra mensajes de éxito o error después de guardar el reporte. */}

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
            ============================================================
            description: Tabla principal que muestra la matriz de horas por proyecto y día.
                         - Encabezados: días de la semana con indicador de festivo.
                         - Filas: cada proyecto con sus horas diarias (inputs editables).
                         - Pie de tabla: totales diarios y gran total.
                         Los inputs se deshabilitan en festivos, fines de semana o mes futuro. */}

        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase">
                <th className="py-3 px-4 w-1/3">Asignación / Proyecto</th>
                {weekHeaders.map((head, idx) => {
                  const esFestivo = festivosSemana[idx]; // Mapeo desde el arreglo de estados del hook
                  return (
                    <th
                      key={idx}
                      className={`py-3 px-1 text-center text-[11px] w-[9%] transition-all ${
                        esFestivo ? 'bg-emerald-50 text-emerald-800 border-x border-emerald-100/50' : ''
                      }`}
                    >
                      <div className="font-bold">{head.label}</div>
                      <div className={`font-normal mt-0.5 ${esFestivo ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                        {head.display.split(' ')[1]} {esFestivo && '• FESTIVO'}
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
                /* ==========================================================
                   RENDERIZADO DE PROYECTOS Y HORAS
                   ==========================================================
                   description: Mapeo de cada proyecto para renderizar una fila con:
                                - Nombre y descripción del proyecto.
                                - Inputs de horas para cada día (deshabilitados según reglas).
                                - Total de horas del proyecto al final de la fila. */
                projects.map((proj, pIdx) => (
                  <tr key={proj.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-800 uppercase text-xs font-mono tracking-wider">{proj.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{proj.description}</div>
                    </td>
                    {proj.hours.map((hourValue, dIdx) => {
                      const esFestivo = festivosSemana[dIdx];
                      const esFinDeSemana = dIdx === 5 || dIdx === 6;
                      const bloquearInput = esFestivo || esMesFuturo;

                      return (
                        <td
                          key={dIdx}
                          className={`py-2 px-1 transition-all ${
                            esFestivo ? 'bg-emerald-50/40 border-x border-emerald-100/20' : ''
                          }`}
                        >
                          {/* ----------------------------------------------------
                              INPUT DE HORAS POR DÍA
                              ----------------------------------------------------
                              description: Input numérico para registrar las horas de un proyecto
                                           en un día específico. Se deshabilita si el día es festivo,
                                           fin de semana o si la semana pertenece a un mes futuro.
                                           El estilo cambia según el estado (festivo, futuro, normal). */}
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={hourValue === 0 ? '' : hourValue}
                            placeholder={esFestivo ? '🌴' : esMesFuturo ? '🚫' : '0'}
                            disabled={bloquearInput}
                            onChange={(e) => handleHourChange(pIdx, dIdx, e.target.value)}
                            className={`w-full text-center border rounded-lg p-1.5 text-xs font-semibold font-mono outline-none transition-all ${
                              esFestivo
                                ? 'bg-emerald-100/60 border-emerald-200 text-emerald-800 cursor-not-allowed shadow-none font-bold'
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
            {/* ============================================================
                PIE DE TABLA - TOTALES DIARIOS Y GRAN TOTAL
                ============================================================
                description: Muestra el total de horas por día (sumando todos los proyectos)
                             y el gran total de la semana. Los días festivos se resaltan. */}
            <tfoot>
              <tr className="bg-slate-50 font-bold text-xs border-t border-gray-100">
                <td className="py-3 px-4 text-gray-500">TOTAL DIARIO</td>
                {weekHeaders.map((_, dIdx) => (
                  <td
                    key={dIdx}
                    className={`py-3 px-1 text-center font-mono ${
                      festivosSemana[dIdx] ? 'text-emerald-700 bg-emerald-50/40 font-bold' : 'text-gray-700'
                    }`}
                  >
                    {getDayTotal(dIdx)}
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
            BOTÓN DE GUARDADO
            ============================================================
            description: Botón que envía el reporte de horas al servidor.
                         Se deshabilita si no hay proyectos cargados o si la semana es futura. */}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmitReport}
            disabled={projects.length === 0 || esMesFuturo}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 flex items-center gap-2 shadow-md">
            Guardar Registro de Tiempos
          </button>
        </div>

      </div>
    </div>
  );
};

export default TimeReporting;
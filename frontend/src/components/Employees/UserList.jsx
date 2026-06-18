import React from 'react';
import { Link } from 'react-router-dom';
import { useUserListLogic } from './UserListLogic';

/**
 * description: Vista de panel principal para la Gestión de Empleados en SGTV.
 * author:      Camilo Andres Ramirez Ospina | 2026-06-18
 */
const UserList = () => {
  const {
    usuarios,
    loading,
    message,
    handleInactivarRapido,
    handleEliminarFisicoRapido
  } = useUserListLogic();

  return (
    <div className="min-h-screen bg-slate-50 font-poppins p-6 text-text-main">
      <div className="max-w-6xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">

        {/* Barra superior de acciones */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-gray-50 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel de Gestión de Empleados</h1>
            <p className="text-xs text-gray-500">Visualiza, edita, inactiva o da de alta al personal de la organización</p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="text-xs bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600 px-4 py-2 rounded-xl transition-all flex items-center gap-1">
              <i className="fa-solid fa-arrow-left"></i> Dashboard
            </Link>
            <Link to="/empleados/nuevo" className="text-xs bg-red-600 hover:bg-red-700 font-semibold text-white px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5">
              <i className="fa-solid fa-user-plus"></i> Registrar Empleado
            </Link>
          </div>
        </div>

        {/* Mensajes de estado */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm mb-6 border font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Contenedor de la Tabla */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500 font-medium">
            <i className="fa-solid fa-spinner animate-spin mr-2 text-red-500 text-lg"></i> Cargando personal...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No se encontraron empleados registrados en el sistema actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">Organización</th>
                  <th className="p-4 text-center">Vacaciones Disp.</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                {usuarios.map((emp) => (
                  <tr key={emp.idUsuario} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nombre Completo */}
                    <td className="p-4">
                      <div className="font-bold text-gray-800 text-sm">{emp.Nombre} {emp.Apellido}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">ID: #00{emp.idUsuario}</div>
                    </td>

                    {/* Datos de Contacto */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5"><i className="fa-regular fa-envelope text-gray-400"></i> {emp.email}</div>
                      <div className="flex items-center gap-1.5 text-gray-400 mt-1"><i className="fa-solid fa-phone text-gray-400 text-[10px]"></i> {emp.telefono || 'Sin teléfono'}</div>
                    </td>

                    {/* Departamento / Perfil */}
                    <td className="p-4">
                      <div className="text-gray-800 font-semibold">{emp.NombreDepartamento || `Depto ID: ${emp.idDepartamento}`}</div>
                      <div className="text-[10px] bg-gray-100 text-gray-600 font-bold rounded-md px-1.5 py-0.5 inline-block mt-1 uppercase tracking-wide">
                        {emp.NombrePerfil || `Rol ID: ${emp.idPerfil}`}
                      </div>
                    </td>

                    {/* Vacaciones */}
                    <td className="p-4 text-center font-bold text-gray-800">
                      {parseFloat(emp.vacaciones_disponibles || 0).toFixed(1)} <span className="text-[10px] font-normal text-gray-400">días</span>
                    </td>

                    {/* Estado */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        emp.Estado === 'Activo' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {emp.Estado}
                      </span>
                    </td>

                    {/* Botones de acción dinámica */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* BOTÓN EDITAR */}
                        <Link
                          to={`/empleados/editar/${emp.idUsuario}`}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center text-xs shadow-sm"
                          title="Editar información"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </Link>

                        {/* BOTÓN INACTIVAR (Solo si está Activo) */}
                        {emp.Estado === 'Activo' ? (
                          <button
                            onClick={() => handleInactivarRapido(emp.idUsuario)}
                            className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors flex items-center justify-center text-xs shadow-sm"
                            title="Inactivar acceso"
                          >
                            <i className="fa-solid fa-user-slash"></i>
                          </button>
                        ) : (
                          /* BOTÓN BORRAR DEFINITIVO (Si ya está Inactivo) */
                          <button
                            onClick={() => handleEliminarFisicoRapido(emp.idUsuario)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center text-xs shadow-sm"
                            title="Eliminar registro físico"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserList;
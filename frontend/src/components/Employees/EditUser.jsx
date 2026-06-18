import React from 'react';
import { useEditUserLogic } from './EditUserLogic'; // Importamos la lógica separada

/**
 * description: Componente de Presentación (UI) para la edición de empleados en SGTV.
 * author:      Camilo Andres Ramirez Ospina | 2026-06-18
 */
const EditUser = () => {
  // Consumimos todo lo que calculó nuestro archivo de lógica
  const {
    formData,
    perfiles,
    departamentos,
    message,
    loading,
    handleInputChange,
    handleUpdate,
    handleInactivar
  } = useEditUserLogic();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Actualizar Datos de Empleado</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.Estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Estado: {formData.Estado}
        </span>
      </div>

      {message.text && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
            <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Contraseña (Opcional en edición) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (Dejar en blanco si no cambia)</label>
            <input type="password" name="contraseña" value={formData.contraseña} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>

          {/* Vacaciones Disponibles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vacaciones Disponibles (Días)</label>
            <input type="number" step="0.01" name="vacaciones_disponibles" value={formData.vacaciones_disponibles} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil / Rol *</label>
            <select name="idPerfil" value={formData.idPerfil} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccione un perfil</option>
              {perfiles.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nombre_perfil || p.Nombre}</option>)}
            </select>
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
            <select name="idDepartamento" value={formData.idDepartamento} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccione un departamento</option>
              {departamentos.map(d => <option key={d.idDepartamento} value={d.idDepartamento}>{d.nombre_departamento || d.Nombre}</option>)}
            </select>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Residencia</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap justify-between items-center pt-4 border-t gap-4">
          <div>
            {formData.Estado === 'Activo' && (
              <button type="button" onClick={handleInactivar} className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition-colors">
                Inactivar Colaborador
              </button>
            )}
          </div>

          <div className="flex gap-3📍">
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
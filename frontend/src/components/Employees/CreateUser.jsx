import React from 'react';
import { Link } from 'react-router-dom';
import { useCreateUserLogic } from './useCreateUserLogic';

const CreateUser = () => {
  const {
    formData,
    perfiles,
    departamentos,
    message,
    loading,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleSubmit
  } = useCreateUserLogic();

  return (
    <div className="min-h-screen bg-slate-50 font-poppins text-text-main p-6">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">

        <div className="mb-6 flex justify-between items-start border-b border-gray-50 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Registrar Nuevo Empleado</h1>
            <p className="text-xs text-gray-500">Añade colaboradores al ecosistema y define sus roles de acceso</p>
          </div>
          <Link to="/" className="text-xs bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600 px-3 py-1.5 rounded-lg transition-all">
            <i className="fa-solid fa-arrow-left mr-1"></i> Dashboard
          </Link>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm mb-6 border font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <i className={`mr-2 fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej. Juan Carlos"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Ej. Pérez Gómez"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono / Celular *</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ej. 3157654321"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Residencial *</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Ej. Calle 26 # 30-26, Bogotá"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="empleado@correo.com"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Contraseña *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmarContraseña"
                  value={formData.confirmarContraseña}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Perfil / Rol de Acceso *</label>
              <select
                name="idPerfil"
                value={formData.idPerfil}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              >
                <option value="">-- Seleccione un Rol --</option>
                {perfiles.map(perf => (
                  <option key={perf.idPerfil} value={perf.idPerfil}>{perf.Nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Departamento Organizacional *</label>
              <select
                name="idDepartamento"
                value={formData.idDepartamento}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              >
                <option value="">-- Seleccione Departamento --</option>
                {departamentos.map(dep => (
                  <option key={dep.idDepartamento} value={dep.idDepartamento}>{dep.Nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Nacimiento *</label>
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Ingreso *</label>
              <input
                type="date"
                name="fechaIngreso"
                value={formData.fechaIngreso}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium bg-gray-50 focus:border-red-400 focus:bg-white outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-user-check"></i>}
              Dar de Alta Empleado
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateUser;
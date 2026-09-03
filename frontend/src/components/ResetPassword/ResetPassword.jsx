// src/components/ResetPassword/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setMessage({ text: 'No se proporcionó un token de restablecimiento.', type: 'danger' });
    }
  }, [searchParams]);

const handleSubmit = async (e) => {
  e.preventDefault();

  // Limpiar espacios en blanco
  const pass1 = nuevaContraseña.trim();
  const pass2 = confirmarContraseña.trim();

  if (!pass1 || !pass2) {
    setMessage({ text: 'Por favor completa todos los campos.', type: 'danger' });
    return;
  }

  if (pass1 !== pass2) {
    setMessage({ text: 'Las contraseñas no coinciden.', type: 'danger' });
    return;
  }

  // Validar fortaleza de contraseña
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(pass1)) {
    setMessage({
      text: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).',
      type: 'danger'
    });
    return;
  }

  setLoading(true);
  setMessage({ text: '', type: '' });

  try {
    // Enviar las contraseñas limpias
    const response = await apiService.resetPassword(token, pass1, pass2);
    if (response.success) {
      setMessage({ text: response.message, type: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setMessage({ text: response.message || 'Error al restablecer la contraseña.', type: 'danger' });
    }
  } catch (error) {
    setMessage({ text: 'Error de conexión con el servidor.', type: 'danger' });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary-dark"></div>

        <div className="text-center mb-8 mt-2">
          <h1 className="text-xl font-bold text-text-main">Restablecer Contraseña</h1>
          <p className="text-xs text-text-muted mt-1.5">Ingresa tu nueva contraseña</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm mb-6 border font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <i className={`mr-2 fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted text-sm">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={nuevaContraseña}
                onChange={(e) => setNuevaContraseña(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-primary transition-colors text-sm"
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted text-sm">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:outline-none transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-primary transition-colors text-sm"
              >
                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-red-700/20 hover:shadow-red-700/30 transition-all duration-300 disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-spinner animate-spin"></i> Restableciendo...
              </span>
            ) : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-text-muted hover:text-primary transition-colors underline underline-offset-4">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
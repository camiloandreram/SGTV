// frontend/src/components/ForgotPassword/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que el email no esté vacío
    if (!email) {
      setMessage({ text: 'Por favor ingresa tu correo electrónico.', type: 'danger' });
      return;
    }

    // Validar formato de email (básico)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ text: 'Por favor ingresa un correo electrónico válido.', type: 'danger' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await apiService.forgotPassword(email);
      if (response.success) {
        setMessage({
          text: response.message || 'Se ha enviado un enlace a tu correo electrónico.',
          type: 'success'
        });
        setEmail(''); // Limpiar campo
      } else {
        setMessage({
          text: response.message || 'Error al procesar la solicitud.',
          type: 'danger'
        });
      }
    } catch (error) {
      console.error('Error en forgot password:', error);
      setMessage({
        text: 'Error de conexión con el servidor. Intenta nuevamente.',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 relative overflow-hidden">
        {/* Barra decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary-dark"></div>

        {/* Cabecera */}
        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-primary font-bold text-2xl mb-4 shadow-md shadow-red-200/30 border border-red-100">
            SG
          </div>
          <h1 className="text-xl font-bold text-text-main">Recuperar Contraseña</h1>
          <p className="text-xs text-text-muted mt-1.5">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {/* Mensajes de estado */}
        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm mb-6 border font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <i
              className={`mr-2 fa-solid ${
                message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'
              }`}
            ></i>
            {message.text}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted text-sm">
                <i className="fa-regular fa-envelope"></i>
              </span>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none transition-all duration-300"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-red-700/20 hover:shadow-red-700/30 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-spinner animate-spin"></i> Enviando...
              </span>
            ) : (
              'Enviar enlace de restablecimiento'
            )}
          </button>
        </form>

        {/* Enlace para volver al login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs text-text-muted hover:text-primary transition-colors underline underline-offset-4"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
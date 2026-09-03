/**
 * ------------------------------------------------------------------------------------------------
 * @Name         useLoginLogic
 * @Author       Camilo Andres Ramirez Ospina
 * @Date         2026-06-17
 * @Group        Authentication Module
 * @Description  Custom React hook que maneja la lógica de inicio de sesión: validación de credenciales,
 *               autenticación con el servidor y redirección después del login.
 * @Changes      (most recent first)
 * 2026-06-17    Camilo Andres Ramirez Ospina    Versión inicial
 * ------------------------------------------------------------------------------------------------
**/

import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';


export const useLoginLogic = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const clearError = () => setError('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiService.login(email, password);
      if (data.success) {
        login(data.user);
        navigate('/');
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, showPassword, setShowPassword, error, loading, clearError, handleSubmit };
};
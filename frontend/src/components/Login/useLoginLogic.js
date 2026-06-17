// useLoginLogic.js - El controlador de la lógica
import { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export const useLoginLogic = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {

      const data = await apiService.login(email, password);

      if (data.success) {
        login(data.user);
        window.location.href = '/';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Exponemos las variables y funciones exactamente como lo harías en un LWC .js
  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    loading,
    handleSubmit
  };
};
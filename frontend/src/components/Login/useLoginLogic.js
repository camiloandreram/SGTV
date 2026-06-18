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

// useLoginLogic.js - El controlador de la lógica
import { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

/**
 * Hook principal que encapsula toda la lógica de autenticación.
 * Recibe el contexto de autenticación y expone estado y manejadores.
 */
export const useLoginLogic = () => {

  /**
   * description: Correo electrónico del usuario ingresado en el formulario
   */
  const [email, setEmail] = useState('');

  /**
   * description: Contraseña del usuario ingresada en el formulario
   */
  const [password, setPassword] = useState('');

  /**
   * description: Controla si la contraseña se muestra en texto plano o como puntos
   */
  const [showPassword, setShowPassword] = useState(false);

  /**
   * description: Mensaje de error que se muestra cuando falla la autenticación
   */
  const [error, setError] = useState('');

  /**
   * description: Indicador de carga para deshabilitar el botón durante la petición
   */
  const [loading, setLoading] = useState(false);

  // Se obtiene la función login del contexto de autenticación
  const { login } = useContext(AuthContext);

  /**
   * description: Maneja el envío del formulario de inicio de sesión
   * author: Camilo Andres Ramirez Ospina | 2026-06-17
   * param: e - Evento del formulario
   * return: void
   */
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

  /**
   * description: Expone todas las variables y funciones para el componente que consuma este hook
   * author: Camilo Andres Ramirez Ospina | 2026-06-17
   * return: Objeto con el estado y los manejadores del login
   */
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
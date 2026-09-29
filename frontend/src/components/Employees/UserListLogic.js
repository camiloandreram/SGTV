import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

export const useUserListLogic = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await apiService.obtenerTodosLosUsuarios();
      if (response?.success) {
        setUsuarios(response.data);
      }
    } catch (err) {
      console.error("Error al cargar la lista de empleados", err);
      setMessage({ text: 'No se pudo conectar con el servidor para traer los empleados.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Ejecuta la inactivación (sin confirm — el modal se encarga)
  const handleInactivarRapido = async (idUsuario) => {
    try {
      const response = await apiService.inactivarUsuario(idUsuario);
      if (response.success) {
        setMessage({ text: 'Empleado inactivado con éxito.', type: 'success' });
        cargarUsuarios();
      } else {
        setMessage({ text: response.message, type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error al intentar cambiar el estado.', type: 'danger' });
    }
  };

  // Ejecuta la activación (sin confirm)
  const handleActivarRapido = async (idUsuario) => {
    try {
      const response = await apiService.activarUsuario(idUsuario);
      if (response.success) {
        setMessage({ text: 'Empleado reactivado con éxito.', type: 'success' });
        cargarUsuarios();
      } else {
        setMessage({ text: response.message, type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error al intentar activar al empleado.', type: 'danger' });
    }
  };

  // Ejecuta la eliminación (sin confirm)
  const handleEliminarFisicoRapido = async (idUsuario) => {
    try {
      const response = await apiService.eliminarUsuarioFisico(idUsuario);
      if (response.success) {
        setMessage({ text: 'Registro eliminado físicamente del sistema.', type: 'success' });
        cargarUsuarios();
      } else {
        setMessage({ text: response.message, type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error de integridad o comunicación al eliminar.', type: 'danger' });
    }
  };

  return {
    usuarios,
    loading,
    message,
    handleInactivarRapido,
    handleActivarRapido,
    handleEliminarFisicoRapido
  };
};
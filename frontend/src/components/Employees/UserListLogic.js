import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

/**
 * description: Custom Hook encargado de gestionar el estado y acciones del listado de empleados.
 * author:      Camilo Andres Ramirez Ospina | 2026-06-18
 */
export const useUserListLogic = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Función para obtener todos los empleados desde el servidor
  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      // Usamos el endpoint que ya tienes o que mapearemos en la API
      if (apiService.obtenerTodosLosUsuarios) {
        const response = await apiService.obtenerTodosLosUsuarios();
        if (response.success) {
          setUsuarios(response.data);
        }
      } else {
        // Fallback de desarrollo por si estás probando la interfaz
        setUsuarios([]);
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

  // Función para manejar la inactivación rápida desde la tabla
  const handleInactivarRapido = async (idUsuario) => {
    if (!window.confirm("¿Estás seguro de que deseas inactivar a este empleado?")) return;

    try {
      const response = await apiService.inactivarUsuario(idUsuario);
      if (response.success) {
        setMessage({ text: 'Empleado inactivado con éxito.', type: 'success' });
        cargarUsuarios(); // Recargamos la lista actualizada
      }
    } catch (err) {
      setMessage({ text: 'Error al intentar cambiar el estado.', type: 'danger' });
    }
  };

  // Función para el borrado definitivo físico
  const handleEliminarFisicoRapido = async (idUsuario) => {
    if (!window.confirm("⚠️ ¿AVISO CRÍTICO!\n¿Deseas eliminar permanentemente este registro de la base de datos? Esto no se puede deshacer y fallará si tiene histórico.")) return;

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
    handleEliminarFisicoRapido
  };
};
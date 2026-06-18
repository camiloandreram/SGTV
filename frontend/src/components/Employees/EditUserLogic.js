import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

/**
 * description: Custom Hook que extrae toda la lógica de negocio para la edición de usuarios.
 * author:      Camilo Andres Ramirez Ospina | 2026-06-18
 */
export const useEditUserLogic = () => {
  const { id } = useParams(); // Captura el idUsuario desde la URL de la ruta

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    contraseña: '', direccion: '', Estado: 'Activo',
    idPerfil: '', idDepartamento: '', vacaciones_disponibles: 15.00
  });

  const [perfiles, setPerfiles] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Carga los catálogos y la información actual del usuario al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Suponiendo que tienes estos métodos en tu api.js para llenar los selectores
        const resPerfiles = await apiService.obtenerPerfiles();
        const resDeptos = await apiService.obtenerDepartamentos();
        if (resPerfiles?.success) setPerfiles(resPerfiles.data);
        if (resDeptos?.success) setDepartamentos(resDeptos.data);

        // Traemos la info actual del usuario usando el id de la URL
        const resUser = await apiService.obtenerDatosUsuarioActualizados(id);
        if (resUser?.success && resUser.user) {
          const u = resUser.user;
          setFormData({
            nombre: u.Nombre || '',
            apellido: u.Apellido || '',
            telefono: u.telefono || '',
            email: u.email || '',
            contraseña: '', // Se deja vacía por seguridad, solo se cambia si el usuario escribe una nueva
            direccion: u.direccion || '',
            Estado: u.Estado || 'Activo',
            idPerfil: u.idPerfil || '',
            idDepartamento: u.idDepartamento || '',
            vacaciones_disponibles: u.vacaciones_disponibles || 0
          });
        }
      } catch (err) {
        setMessage({ text: 'Error al recuperar los datos del empleado.', type: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id]);

  // Manejador de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Función para procesar la actualización (Submit)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await apiService.actualizarUsuario(id, formData);
      if (response.success) {
        setMessage({ text: '¡Información actualizada con éxito!', type: 'success' });
      } else {
        setMessage({ text: response.message, type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error al intentar comunicar con el servidor.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la baja lógica (Inactivar)
  const handleInactivar = async () => {
    if (!window.confirm("¿Seguro que deseas inactivar a este empleado? Perderá el acceso inmediato al sistema.")) return;
    try {
      const response = await apiService.inactivarUsuario(id);
      if (response.success) {
        setMessage({ text: 'El empleado ha sido marcado como Inactivo.', type: 'success' });
        setFormData(prev => ({ ...prev, Estado: 'Inactivo' }));
      }
    } catch (err) {
      setMessage({ text: 'No se pudo desactivar el usuario.', type: 'danger' });
    }
  };

  // Exportamos todo lo que la interfaz de usuario va a necesitar consumir
  return { formData, perfiles, departamentos, message, loading, handleInputChange, handleUpdate, handleInactivar };
};
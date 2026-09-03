// frontend/src/components/Employees/EditUserLogic.js
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

export const useEditUserLogic = () => {
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    contraseña: '', confirmarContraseña: '', direccion: '', Estado: 'Activo',
    idPerfil: '', idDepartamento: '', vacaciones_disponibles: 15.00
  });

  const [perfiles, setPerfiles] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const resPerfiles = await apiService.obtenerPerfiles();
        const resDeptos = await apiService.obtenerDepartamentos();
        if (resPerfiles?.success) setPerfiles(resPerfiles.data);
        if (resDeptos?.success) setDepartamentos(resDeptos.data);

        const resUser = await apiService.obtenerUsuarioPorId(id);
        if (resUser?.success && resUser.user) {
          const u = resUser.user;
          setFormData({
            nombre: u.Nombre || '',
            apellido: u.Apellido || '',
            telefono: u.telefono || '',
            email: u.email || '',
            contraseña: '',
            confirmarContraseña: '',
            direccion: u.direccion || '',
            Estado: u.Estado || 'Activo',
            idPerfil: u.idPerfil || '',
            idDepartamento: u.idDepartamento || '',
            vacaciones_disponibles: u.vacaciones_disponibles || 0
          });
        } else {
          setMessage({ text: 'No se pudo obtener la información del empleado.', type: 'danger' });
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setMessage({ text: 'Error al recuperar los datos del empleado.', type: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Validar que todos los campos requeridos estén llenos
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.telefono || !formData.direccion || !formData.idPerfil || !formData.idDepartamento) {
      setMessage({ text: 'Todos los campos son obligatorios.', type: 'danger' });
      setLoading(false);
      return;
    }

    // Si se ingresó una nueva contraseña, validar
    if (formData.contraseña) {
      if (formData.contraseña !== formData.confirmarContraseña) {
        setMessage({ text: 'Las contraseñas no coinciden.', type: 'danger' });
        setLoading(false);
        return;
      }
      if (!validatePassword(formData.contraseña)) {
        setMessage({
          text: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).',
          type: 'danger'
        });
        setLoading(false);
        return;
      }
    }

    // Preparar datos para enviar
    const datosEnviar = { ...formData };
    delete datosEnviar.confirmarContraseña;
    // Si la contraseña está vacía, no la enviamos para que el backend no la modifique
    if (!datosEnviar.contraseña) {
      delete datosEnviar.contraseña;
    }

    try {
      const response = await apiService.actualizarUsuario(id, datosEnviar);
      if (response.success) {
        setMessage({ text: '¡Información actualizada con éxito!', type: 'success' });
        // Limpiar campos de contraseña por seguridad
        setFormData(prev => ({ ...prev, contraseña: '', confirmarContraseña: '' }));
      } else {
        setMessage({ text: response.message || 'Error al actualizar.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error al intentar comunicar con el servidor.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleInactivar = async () => {
    if (!window.confirm("¿Seguro que deseas inactivar a este empleado? Perderá el acceso inmediato al sistema.")) return;
    try {
      const response = await apiService.inactivarUsuario(id);
      if (response.success) {
        setMessage({ text: 'El empleado ha sido marcado como Inactivo.', type: 'success' });
        setFormData(prev => ({ ...prev, Estado: 'Inactivo' }));
      } else {
        setMessage({ text: response.message || 'Error al inactivar.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'No se pudo desactivar el usuario.', type: 'danger' });
    }
  };

  return {
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
    handleUpdate,
    handleInactivar
  };
};
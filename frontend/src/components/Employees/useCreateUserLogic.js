import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

export const useCreateUserLogic = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    contraseña: '',
    direccion: '',
    idPerfil: '',
    idDepartamento: ''
  });

  const [perfiles, setPerfiles] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        if (apiService.obtenerPerfiles && apiService.obtenerDepartamentos) {
          const resPerfiles = await apiService.obtenerPerfiles();
          const resDeptos = await apiService.obtenerDepartamentos();
          if (resPerfiles.success) setPerfiles(resPerfiles.data);
          if (resDeptos.success) setDepartamentos(resDeptos.data);
        }
      } catch (err) {
        console.error("Error al cargar catálogos del servidor", err);
      }
    };
    cargarCatalogos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.email || !formData.contraseña || !formData.idPerfil || !formData.idDepartamento) {
      setMessage({ text: 'Por favor, diligencia todos los campos obligatorios (*).', type: 'danger' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await apiService.guardarUsuario(formData);

      if (response && response.success) {
        setMessage({ text: '¡Excelente! El empleado fue registrado con éxito.', type: 'success' });
        setFormData({
          nombre: '', apellido: '', telefono: '',
          email: '', contraseña: '', direccion: '', idPerfil: '', idDepartamento: ''
        });
      } else {
        setMessage({ text: response.message || 'Error al procesar el guardado.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error de comunicación o red con el servidor central.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    perfiles,
    departamentos,
    message,
    loading,
    handleInputChange,
    handleSubmit
  };
};
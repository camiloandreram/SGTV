// frontend/src/components/Employees/useCreateUserLogic.js
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

export const useCreateUserLogic = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    contraseña: '',
    confirmarContraseña: '',
    direccion: '',
    idPerfil: '',
    idDepartamento: '',
    fechaNacimiento: '',
    fechaIngreso: ''
  });

  const [perfiles, setPerfiles] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const resPerfiles = await apiService.obtenerPerfiles();
        const resDeptos = await apiService.obtenerDepartamentos();
        if (resPerfiles.success) setPerfiles(resPerfiles.data);
        if (resDeptos.success) setDepartamentos(resDeptos.data);
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

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Función para validar formato de fecha YYYY-MM-DD
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios (incluyendo fechas)
    if (!formData.nombre || !formData.apellido || !formData.telefono || !formData.email ||
        !formData.contraseña || !formData.confirmarContraseña || !formData.direccion ||
        !formData.idPerfil || !formData.idDepartamento || !formData.fechaNacimiento || !formData.fechaIngreso) {
      setMessage({ text: 'Todos los campos son obligatorios.', type: 'danger' });
      return;
    }

    // Validar teléfono (solo números, máximo 10 dígitos)
    if (!/^\d{1,10}$/.test(formData.telefono)) {
      setMessage({ text: 'El teléfono debe contener solo números y tener máximo 10 dígitos.', type: 'danger' });
      return;
    }

    // Validar dirección (mínimo 5 caracteres)
    if (formData.direccion.trim().length < 5) {
      setMessage({ text: 'La dirección debe tener al menos 5 caracteres.', type: 'danger' });
      return;
    }

    // Validar fechas
    if (!isValidDate(formData.fechaNacimiento)) {
      setMessage({ text: 'La fecha de nacimiento no tiene un formato válido (YYYY-MM-DD).', type: 'danger' });
      return;
    }
    if (!isValidDate(formData.fechaIngreso)) {
      setMessage({ text: 'La fecha de ingreso no tiene un formato válido (YYYY-MM-DD).', type: 'danger' });
      return;
    }

    // Validar que la fecha de nacimiento no sea futura
    const hoy = new Date();
    const nacimiento = new Date(formData.fechaNacimiento);
    if (nacimiento > hoy) {
      setMessage({ text: 'La fecha de nacimiento no puede ser una fecha futura.', type: 'danger' });
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.contraseña !== formData.confirmarContraseña) {
      setMessage({ text: 'Las contraseñas no coinciden.', type: 'danger' });
      return;
    }

    // Validar fortaleza de la contraseña
    if (!validatePassword(formData.contraseña)) {
      setMessage({
        text: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).',
        type: 'danger'
      });
      return;
    }

    // Validar selectores
    const idPerfilNum = parseInt(formData.idPerfil, 10);
    const idDepartamentoNum = parseInt(formData.idDepartamento, 10);

    if (isNaN(idPerfilNum) || idPerfilNum <= 0) {
      setMessage({ text: 'Debes seleccionar un Perfil / Rol de Acceso válido.', type: 'danger' });
      return;
    }
    if (isNaN(idDepartamentoNum) || idDepartamentoNum <= 0) {
      setMessage({ text: 'Debes seleccionar un Departamento Organizacional válido.', type: 'danger' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const datosEnviar = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        email: formData.email,
        contraseña: formData.contraseña,
        direccion: formData.direccion,
        idPerfil: idPerfilNum,
        idDepartamento: idDepartamentoNum,
        fechaNacimiento: formData.fechaNacimiento,
        fechaIngreso: formData.fechaIngreso
      };

      const response = await apiService.guardarUsuario(datosEnviar);

      if (response && response.success) {
        setMessage({ text: '¡Excelente! El empleado fue registrado con éxito.', type: 'success' });
        // Limpiar todos los campos del formulario
        setFormData({
          nombre: '',
          apellido: '',
          telefono: '',
          email: '',
          contraseña: '',
          confirmarContraseña: '',
          direccion: '',
          idPerfil: '',
          idDepartamento: '',
          fechaNacimiento: '',
          fechaIngreso: ''
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
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleSubmit
  };
};
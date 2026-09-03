// routes/userRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  inactivarUsuario,
  deleteUsuario,
  getPerfiles,
  getDepartamentos
} = require('../controllers/userController');

const router = express.Router();

router.get('/perfiles', auth, getPerfiles);
router.get('/departamentos', auth, getDepartamentos);


// Obtener todos los usuarios
router.get('/', auth, getUsuarios);

// Obtener un usuario por ID
router.get('/:id', auth, getUsuarioById);

// Crear un nuevo usuario (con validaciones)
router.post(
  '/',
  auth,
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('contraseña').isLength({ min: 4 }).withMessage('La contraseña debe tener al menos 4 caracteres'),
    body('idPerfil').isInt().withMessage('Perfil inválido'),
    body('idDepartamento').isInt().withMessage('Departamento inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  createUsuario
);

// Actualizar un usuario existente
router.put(
  '/:id',
  auth,
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido').notEmpty().withMessage('El apellido es obligatorio'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('idPerfil').isInt().withMessage('Perfil inválido'),
    body('idDepartamento').isInt().withMessage('Departamento inválido')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  updateUsuario
);

// Inactivar usuario (baja lógica)
router.patch('/:id/inactivar', auth, inactivarUsuario);

// Eliminar físicamente un usuario
router.delete('/:id', auth, deleteUsuario);

module.exports = router;
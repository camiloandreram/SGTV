// routes/vacationRoutes.js
const express = require('express');
const {
  obtenerMisSolicitudes,
  obtenerPendientesLider,
  solicitarVacaciones,
  procesarSolicitud
} = require('../controllers/vacationController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/mis-solicitudes/:idUsuario', auth, obtenerMisSolicitudes);
router.get('/pendientes-lider', auth, obtenerPendientesLider);
router.post('/solicitar', auth, solicitarVacaciones);
router.post('/procesar', auth, procesarSolicitud);

module.exports = router;
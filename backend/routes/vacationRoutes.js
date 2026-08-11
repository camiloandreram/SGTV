// routes/vacationRoutes.js
const express = require('express');
const {
  misSolicitudes,
  pendientesLider,
  solicitar,
  procesar
} = require('../controllers/vacationController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/mis-solicitudes/:idUsuario', auth, misSolicitudes);
router.get('/pendientes-lider', auth, pendientesLider);
router.post('/solicitar', auth, solicitar);
router.post('/procesar', auth, procesar);

module.exports = router;
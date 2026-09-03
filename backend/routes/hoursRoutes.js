// routes/hoursRoutes.js
const express = require('express');
const { guardarReporteHoras, obtenerReporteHoras } = require('../controllers/hoursController');
const auth = require('../middleware/auth');
const router = express.Router();

// Ruta para guardar el reporte de horas
router.post('/reporte-horas/guardar', auth, guardarReporteHoras);

// Ruta para obtener el reporte de horas de una semana específica
router.get('/reporte-horas', auth, obtenerReporteHoras);

module.exports = router;
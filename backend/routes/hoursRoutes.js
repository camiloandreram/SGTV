// routes/hoursRoutes.js
const express = require('express');
const { guardarReporte, obtenerReporte } = require('../controllers/hoursController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/guardar', auth, guardarReporte);
router.get('/reporte-horas', auth, obtenerReporte);

module.exports = router;
// routes/authRoutes.js
const express = require('express');
const { login, forgotPassword, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);   // <-- Agregar esta línea
router.post('/reset-password', resetPassword);     // <-- Agregar esta línea

module.exports = router;
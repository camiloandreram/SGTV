// index.js
require('dotenv').config({ path: './process.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Solo para mantener la conexión activa

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vacationRoutes = require('./routes/vacationRoutes');
const hoursRoutes = require('./routes/hoursRoutes');

// Usar rutas
app.use('/api', authRoutes);              // /api/login (público)
app.use('/api/usuarios', userRoutes);     // /api/usuarios/...
app.use('/api/vacaciones', vacationRoutes);
app.use('/api', hoursRoutes);             // /api/reporte-horas y /api/guardar

// Ruta principal (frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor refactorizado corriendo en http://localhost:${PORT}`);
});
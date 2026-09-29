// index.js
require('dotenv').config({ path: './process.env' });
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// IMPORTAR RUTAS
// ============================================================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vacationRoutes = require('./routes/vacationRoutes');
const hoursRoutes = require('./routes/hoursRoutes');

// ============================================================
// USAR RUTAS
// ============================================================
app.use('/api', authRoutes);              // /api/login, /api/forgot-password, /api/reset-password
app.use('/api/usuarios', userRoutes);     // /api/usuarios/*
app.use('/api/vacaciones', vacationRoutes);
app.use('/api', hoursRoutes);             // /api/reporte-horas, /api/reporte-horas/guardar

// ============================================================
// RUTA RAÍZ INFORMATIVA (ya no sirve archivos estáticos)
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SGTV Backend API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/login',
        forgotPassword: 'POST /api/forgot-password',
        resetPassword: 'POST /api/reset-password'
      },
      usuarios: {
        listar: 'GET /api/usuarios',
        crear: 'POST /api/usuarios',
        actualizar: 'PUT /api/usuarios/:id',
        inactivar: 'PATCH /api/usuarios/:id/inactivar',
        activar: 'PATCH /api/usuarios/:id/activar',
        eliminar: 'DELETE /api/usuarios/:id',
        perfiles: 'GET /api/usuarios/perfiles',
        departamentos: 'GET /api/usuarios/departamentos'
      },
      vacaciones: {
        misSolicitudes: 'GET /api/vacaciones/mis-solicitudes/:idUsuario',
        pendientesLider: 'GET /api/vacaciones/pendientes-lider',
        solicitar: 'POST /api/vacaciones/solicitar',
        procesar: 'POST /api/vacaciones/procesar'
      },
      horas: {
        obtener: 'GET /api/reporte-horas',
        guardar: 'POST /api/reporte-horas/guardar'
      }
    }
  });
});

// ============================================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================================
// MANEJO GLOBAL DE ERRORES
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor SGTV corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
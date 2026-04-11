// =============================================
// ZINGO — Servidor Principal
// =============================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (PDFs subidos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/rutas', require('./src/routes/rutas.routes'));
app.use('/api/paradas', require('./src/routes/paradas.routes'));
app.use('/api/estimacion', require('./src/routes/estimacion.routes'));
app.use('/api/cercana', require('./src/routes/cercana.routes'));
app.use('/api/reportes', require('./src/routes/reportes.routes'));
app.use('/api/votos', require('./src/routes/votos.routes'));
app.use('/api/notificaciones', require('./src/routes/notificaciones.routes'));
app.use('/api/favoritos', require('./src/routes/favoritos.routes'));
app.use('/api/avisos', require('./src/routes/avisos.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));

// Ruta de salud
app.get('/api/salud', (req, res) => {
  res.json({ estado: 'activo', mensaje: 'API Zingo funcionando correctamente' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    exito: false,
    mensaje: err.message || 'Error interno del servidor'
  });
});

// Conexión a MongoDB y arranque del servidor
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Zingo corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app;

const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
  tablaAfectada: { type: String, required: true },
  registroId: { type: mongoose.Schema.Types.ObjectId, required: true },
  accion: { type: String, enum: ['INSERT', 'UPDATE', 'DELETE'], required: true },
  descripcion: { type: String, required: true },
  usuarioResponsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  datosAnteriores: { type: mongoose.Schema.Types.Mixed, default: null },
  datosNuevos: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Historial', historialSchema);

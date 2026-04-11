const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuarioDestinoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  rolDestino: { type: String, enum: ['super_admin', 'agencia', 'usuario'], default: null },
  tipo: { type: String, enum: [
    'ruta_creada', 'ruta_actualizada', 'ruta_eliminada',
    'reporte_nuevo', 'reporte_validado',
    'cuenta_nueva', 'cuenta_aprobada', 'cuenta_rechazada',
    'aviso_nuevo'
  ], required: true },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  entidadTipo: { type: String },
  entidadId: { type: mongoose.Schema.Types.ObjectId },
  leida: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notificacion', notificacionSchema);

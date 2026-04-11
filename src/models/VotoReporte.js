const mongoose = require('mongoose');

// =============================================
// MODELO: VotoReporte
// =============================================
const votoReporteSchema = new mongoose.Schema({
  reporteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reporte', required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  voto: { type: String, enum: ['favor', 'contra'], required: true }
}, { timestamps: true });

votoReporteSchema.index({ reporteId: 1, usuarioId: 1 }, { unique: true });

module.exports = mongoose.model('VotoReporte', votoReporteSchema);

const mongoose = require('mongoose');

const paradaSchema = new mongoose.Schema({
  rutaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', required: true },
  nombre: { type: String, required: true },
  orden: { type: Number, required: true },
  esTerminal: { type: Boolean, default: false },
  referencia: { type: String },
  ubicacion: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }
}, { timestamps: true });

paradaSchema.index({ ubicacion: '2dsphere' });

module.exports = mongoose.model('Parada', paradaSchema);

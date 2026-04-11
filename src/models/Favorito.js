const mongoose = require('mongoose');

const favoritoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  rutaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', required: true }
}, { timestamps: true });

favoritoSchema.index({ usuarioId: 1, rutaId: 1 }, { unique: true });

module.exports = mongoose.model('Favorito', favoritoSchema);

const mongoose = require('mongoose');

const avisoSchema = new mongoose.Schema({
  agenciaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  rutaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', default: null },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  tipo: { type: String, enum: ['suspension', 'desvio', 'retraso', 'informativo'], default: 'informativo' },
  activo: { type: Boolean, default: true },
  fechaExpiracion: { type: Date, default: null }
}, { timestamps: true });

// HOOK 7: Cuando se publica un aviso → notificar a usuarios
avisoSchema.post('save', async function (doc) {
  const Notificacion = mongoose.model('Notificacion');
  await Notificacion.create({
    rolDestino: 'usuario',
    tipo: 'aviso_nuevo',
    titulo: doc.titulo,
    mensaje: doc.mensaje,
    entidadTipo: 'aviso',
    entidadId: doc._id
  });
});

module.exports = mongoose.model('Aviso', avisoSchema);

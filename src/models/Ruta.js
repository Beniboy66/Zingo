// =============================================
// MODELO: Ruta
// =============================================
const mongoose = require('mongoose');

const rutaSchema = new mongoose.Schema({
  agenciaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  nombre: { type: String, required: true },
  descripcion: { type: String },
  tarifa: { type: Number, required: true, default: 12.00 },
  velocidadPromedioKmh: { type: Number, default: 20.0 },
  horarioInicio: { type: String, default: '06:00' },
  horarioFin: { type: String, default: '22:00' },
  frecuenciaMin: { type: Number, default: 15 },
  diasOperacion: { type: String, default: 'L-D' },
  estado: { type: String, enum: ['borrador', 'en_revision', 'publicada', 'despublicada'], default: 'borrador' },
  activa: { type: Boolean, default: true },
  consultas: { type: Number, default: 0 },
  trazo: {
    type: { type: String, enum: ['LineString'], default: 'LineString' },
    coordinates: { type: [[Number]] }
  },
  color: { type: String, default: '#007AFF' }
}, { timestamps: true });

rutaSchema.index({ trazo: '2dsphere' });

// HOOK 1: Cuando una agencia CREA una ruta nueva
rutaSchema.post('save', async function (doc) {
  const Notificacion = mongoose.model('Notificacion');
  const Historial = mongoose.model('Historial');

  // Solo en creación (verificar con wasNew guardado en pre-save)
  if (doc._wasNew) {
    await Notificacion.create({
      rolDestino: 'super_admin',
      tipo: 'ruta_creada',
      titulo: 'Nueva ruta registrada',
      mensaje: `La agencia ha registrado la ruta "${doc.nombre}". Requiere revisión y aprobación.`,
      entidadTipo: 'ruta',
      entidadId: doc._id
    });

    await Historial.create({
      tablaAfectada: 'rutas',
      registroId: doc._id,
      accion: 'INSERT',
      descripcion: `Se creó la ruta: ${doc.nombre}`,
      usuarioResponsable: doc.agenciaId,
      datosNuevos: { nombre: doc.nombre, tarifa: doc.tarifa, estado: doc.estado }
    });
  }
});

// Guardar flag de isNew antes de que save lo cambie
rutaSchema.pre('save', function () {
  this._wasNew = this.isNew;
});

// HOOK 2: Pre-update → guardar datos anteriores
rutaSchema.pre('findOneAndUpdate', async function () {
  this._previousDoc = await this.model.findOne(this.getQuery());
});

// HOOK 2: Post-update → notificar cambios relevantes
rutaSchema.post('findOneAndUpdate', async function (doc) {
  const prev = this._previousDoc;
  if (!prev || !doc) return;

  const Notificacion = mongoose.model('Notificacion');
  const Historial = mongoose.model('Historial');

  const cambioRelevante = prev.nombre !== doc.nombre || prev.tarifa !== doc.tarifa ||
    prev.horarioInicio !== doc.horarioInicio || prev.horarioFin !== doc.horarioFin ||
    prev.estado !== doc.estado || prev.frecuenciaMin !== doc.frecuenciaMin ||
    prev.diasOperacion !== doc.diasOperacion;

  if (cambioRelevante) {
    await Notificacion.create({
      rolDestino: 'super_admin',
      tipo: 'ruta_actualizada',
      titulo: 'Ruta actualizada',
      mensaje: `La ruta "${doc.nombre}" ha sido modificada. Verificar los cambios.`,
      entidadTipo: 'ruta',
      entidadId: doc._id
    });

    await Historial.create({
      tablaAfectada: 'rutas',
      registroId: doc._id,
      accion: 'UPDATE',
      descripcion: `Se actualizó la ruta: ${doc.nombre}`,
      usuarioResponsable: doc.agenciaId,
      datosAnteriores: { nombre: prev.nombre, tarifa: prev.tarifa, estado: prev.estado },
      datosNuevos: { nombre: doc.nombre, tarifa: doc.tarifa, estado: doc.estado }
    });
  }

  // Si la ruta cambia a estado "publicada", notificar a usuarios
  if (prev.estado !== 'publicada' && doc.estado === 'publicada') {
    await Notificacion.create({
      rolDestino: 'usuario',
      tipo: 'ruta_actualizada',
      titulo: 'Nueva ruta disponible',
      mensaje: `La ruta "${doc.nombre}" ya está disponible para consulta.`,
      entidadTipo: 'ruta',
      entidadId: doc._id
    });
  }
});

// HOOK 3: Pre-delete → notificar eliminación
rutaSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const Notificacion = mongoose.model('Notificacion');
    const Historial = mongoose.model('Historial');

    await Notificacion.create({
      rolDestino: 'super_admin',
      tipo: 'ruta_eliminada',
      titulo: 'Ruta eliminada',
      mensaje: `La ruta "${doc.nombre}" (ID: ${doc._id}) ha sido eliminada por la agencia.`,
      entidadTipo: 'ruta',
      entidadId: doc._id
    });

    await Historial.create({
      tablaAfectada: 'rutas',
      registroId: doc._id,
      accion: 'DELETE',
      descripcion: `Se eliminó la ruta: ${doc.nombre}`,
      usuarioResponsable: doc.agenciaId,
      datosAnteriores: { nombre: doc.nombre, tarifa: doc.tarifa, estado: doc.estado }
    });
  }
});

module.exports = mongoose.model('Ruta', rutaSchema);

const mongoose = require('mongoose');

const DURACION_REPORTE_MIN = 30; // minutos que dura un reporte activo

const reporteSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  rutaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ruta', required: true },
  tipo: { type: String, enum: ['mal_estado', 'ruta_no_respetada', 'acoso', 'inseguridad', 'tarifa_incorrecta', 'otro'], required: true },
  descripcion: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'validado', 'rechazado', 'resuelto'], default: 'pendiente' },
  votosFavor: { type: Number, default: 0 },
  votosContra: { type: Number, default: 0 },
  expiraEn: { type: Date, default: () => new Date(Date.now() + DURACION_REPORTE_MIN * 60 * 1000), index: { expires: 0 } }
}, { timestamps: true });

// HOOK 4: Cuando un usuario crea un reporte
reporteSchema.post('save', async function (doc) {
  if (!doc._wasNew) return;
  const Notificacion = mongoose.model('Notificacion');
  const Historial = mongoose.model('Historial');

  await Notificacion.create({
    rolDestino: 'super_admin',
    tipo: 'reporte_nuevo',
    titulo: 'Nuevo reporte de usuario',
    mensaje: `Se reportó un problema tipo "${doc.tipo}" en la ruta ID: ${doc.rutaId}. Pendiente de validación comunitaria.`,
    entidadTipo: 'reporte',
    entidadId: doc._id
  });

  await Notificacion.create({
    rolDestino: 'usuario',
    tipo: 'reporte_nuevo',
    titulo: 'Nuevo reporte en una ruta',
    mensaje: `Un usuario reportó: "${doc.tipo}". ¿Es verídico? Vota para validar.`,
    entidadTipo: 'reporte',
    entidadId: doc._id
  });

  await Historial.create({
    tablaAfectada: 'reportes',
    registroId: doc._id,
    accion: 'INSERT',
    descripcion: `Nuevo reporte tipo "${doc.tipo}" en ruta ID: ${doc.rutaId}`,
    usuarioResponsable: doc.usuarioId
  });
});

reporteSchema.pre('save', function () {
  this._wasNew = this.isNew;
});

// HOOK 5: Cuando un reporte se valida por el Super Admin
reporteSchema.pre('findOneAndUpdate', async function () {
  this._previousDoc = await this.model.findOne(this.getQuery());
});

reporteSchema.post('findOneAndUpdate', async function (doc) {
  const prev = this._previousDoc;
  if (!prev || !doc) return;

  if (prev.estado !== 'validado' && doc.estado === 'validado') {
    const Notificacion = mongoose.model('Notificacion');
    const Historial = mongoose.model('Historial');
    const Ruta = mongoose.model('Ruta');

    const ruta = await Ruta.findById(doc.rutaId);
    if (ruta) {
      await Notificacion.create({
        usuarioDestinoId: ruta.agenciaId,
        tipo: 'reporte_validado',
        titulo: 'Reporte validado en tu ruta',
        mensaje: `Se validó un reporte tipo "${doc.tipo}" en tu ruta "${ruta.nombre}". Descripción: ${doc.descripcion}`,
        entidadTipo: 'reporte',
        entidadId: doc._id
      });
    }

    await Historial.create({
      tablaAfectada: 'reportes',
      registroId: doc._id,
      accion: 'UPDATE',
      descripcion: `Reporte validado por Super Admin. Tipo: ${doc.tipo}`
    });
  }
});

module.exports = mongoose.model('Reporte', reporteSchema);

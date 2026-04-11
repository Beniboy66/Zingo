// =============================================
// MODELO: Usuario
// =============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  // Información de contacto (Paso 1 del registro)
  nombre: { type: String, required: true },
  telefono: { type: String, required: true },
  emailContacto: { type: String, required: true },
  tipoPersona: { type: String, enum: ['fisica', 'moral'], default: null },

  // Credenciales de acceso (Paso 3 del registro)
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  // Rol y estado
  rol: { type: String, enum: ['super_admin', 'agencia', 'usuario'], default: 'usuario' },
  estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado', 'suspendido'], default: 'aprobado' },
  motivoRechazo: { type: String, default: null },

  // Documentos PDF (Paso 2 del registro de agencia)
  documentos: {
    tituloConcesion: [{ type: String }],
    identificacion: { type: String },
    tarjetaCirculacion: { type: String },
    polizaSeguro: { type: String }
  },

  // Campos que llena el Super Admin al aprobar
  datosVerificados: {
    nombreConcesionario: { type: String },
    nombreEmpresa: { type: String },
    folioTituloConcesion: { type: String },
    rutaAutorizada: { type: String },
    notasAdmin: { type: String },
    aprobadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fechaAprobacion: { type: Date }
  }
}, { timestamps: true });

// Hash de contraseña antes de guardar
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (passwordIngresada) {
  return bcrypt.compare(passwordIngresada, this.password);
};

// HOOK 6: Cuando una nueva agencia se registra → notificar al Super Admin
usuarioSchema.post('save', async function (doc) {
  if (doc.rol === 'agencia' && doc.estado === 'pendiente') {
    const Notificacion = mongoose.model('Notificacion');
    const Historial = mongoose.model('Historial');

    await Notificacion.create({
      rolDestino: 'super_admin',
      tipo: 'cuenta_nueva',
      titulo: 'Nueva solicitud de agencia',
      mensaje: `"${doc.nombre}" solicita verificación. Revisar documentos PDF subidos.`,
      entidadTipo: 'usuario',
      entidadId: doc._id
    });

    await Historial.create({
      tablaAfectada: 'usuarios',
      registroId: doc._id,
      accion: 'INSERT',
      descripcion: `Nueva agencia solicitó cuenta: ${doc.nombre}`
    });
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);

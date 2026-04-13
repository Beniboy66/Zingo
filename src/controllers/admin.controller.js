const Usuario = require('../models/Usuario');
const Ruta = require('../models/Ruta');
const Parada = require('../models/Parada');
const Reporte = require('../models/Reporte');
const Notificacion = require('../models/Notificacion');
const Historial = require('../models/Historial');
const { enviarEmail, plantillaCuentaAprobada, plantillaCuentaRechazada } = require('../utils/email');

// GET /api/admin/solicitudes
exports.listarSolicitudes = async (req, res, next) => {
  try {
    const solicitudes = await Usuario.find({ rol: 'agencia', estado: 'pendiente' })
      .select('-password').sort({ createdAt: -1 });
    res.json({ exito: true, datos: solicitudes });
  } catch (error) { next(error); }
};

// GET /api/admin/solicitudes/:id
exports.detalleSolicitud = async (req, res, next) => {
  try {
    const solicitud = await Usuario.findById(req.params.id).select('-password');
    if (!solicitud) return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    res.json({ exito: true, datos: solicitud });
  } catch (error) { next(error); }
};

// PUT /api/admin/solicitudes/:id/aprobar
exports.aprobarSolicitud = async (req, res, next) => {
  try {
    const { nombreConcesionario, nombreEmpresa, folioTituloConcesion, rutaAutorizada, notasAdmin } = req.body;

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    if (usuario.estado !== 'pendiente') return res.status(400).json({ exito: false, mensaje: 'Esta solicitud ya fue procesada' });

    usuario.estado = 'aprobado';
    usuario.datosVerificados = {
      nombreConcesionario,
      nombreEmpresa: nombreEmpresa || null,
      folioTituloConcesion,
      rutaAutorizada,
      notasAdmin: notasAdmin || null,
      aprobadoPor: req.usuario._id,
      fechaAprobacion: new Date()
    };
    await usuario.save();

    await Notificacion.create({
      usuarioDestinoId: usuario._id,
      tipo: 'cuenta_aprobada',
      titulo: 'Cuenta aprobada',
      mensaje: 'Tu cuenta ha sido verificada y aprobada. Ya puedes iniciar sesion y registrar tus rutas.',
      entidadTipo: 'usuario',
      entidadId: usuario._id
    });

    // Enviar email de confirmacion
    enviarEmail(
      usuario.emailContacto || usuario.email,
      'Tu cuenta en Zingo ha sido aprobada',
      plantillaCuentaAprobada(usuario.nombre)
    );

    res.json({ exito: true, mensaje: 'Solicitud aprobada', datos: usuario });
  } catch (error) { next(error); }
};

// PUT /api/admin/solicitudes/:id/rechazar
exports.rechazarSolicitud = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ exito: false, mensaje: 'El motivo de rechazo es obligatorio' });

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    if (usuario.estado !== 'pendiente') return res.status(400).json({ exito: false, mensaje: 'Esta solicitud ya fue procesada' });

    usuario.estado = 'rechazado';
    usuario.motivoRechazo = motivo;
    await usuario.save();

    await Notificacion.create({
      usuarioDestinoId: usuario._id,
      tipo: 'cuenta_rechazada',
      titulo: 'Solicitud rechazada',
      mensaje: `Tu solicitud fue rechazada. Motivo: ${motivo}`,
      entidadTipo: 'usuario',
      entidadId: usuario._id
    });

    // Enviar email de rechazo
    enviarEmail(
      usuario.emailContacto || usuario.email,
      'Solicitud de cuenta en Zingo — Rechazada',
      plantillaCuentaRechazada(usuario.nombre, motivo)
    );

    res.json({ exito: true, mensaje: 'Solicitud rechazada' });
  } catch (error) { next(error); }
};

// GET /api/admin/rutas-pendientes
exports.rutasPendientes = async (req, res, next) => {
  try {
    const rutas = await Ruta.find({ estado: 'en_revision' })
      .populate('agenciaId', 'nombre').sort({ createdAt: -1 });
    res.json({ exito: true, datos: rutas });
  } catch (error) { next(error); }
};

// PUT /api/admin/rutas/:id/aprobar
exports.aprobarRuta = async (req, res, next) => {
  try {
    const ruta = await Ruta.findOneAndUpdate(
      { _id: req.params.id, estado: 'en_revision' },
      { estado: 'publicada' },
      { new: true }
    );
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada o no está en revisión' });
    res.json({ exito: true, mensaje: 'Ruta aprobada y publicada', datos: ruta });
  } catch (error) { next(error); }
};

// PUT /api/admin/rutas/:id/rechazar
exports.rechazarRuta = async (req, res, next) => {
  try {
    const ruta = await Ruta.findOneAndUpdate(
      { _id: req.params.id, estado: 'en_revision' },
      { estado: 'borrador' },
      { new: true }
    );
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada o no está en revisión' });
    res.json({ exito: true, mensaje: 'Ruta rechazada, regresada a borrador', datos: ruta });
  } catch (error) { next(error); }
};

// GET /api/admin/estadisticas
exports.estadisticas = async (req, res, next) => {
  try {
    const [totalAgencias, agenciasPendientes, rutasPublicadas, rutasPorRevisar, reportesPendientes, totalUsuarios, consultasTotales] = await Promise.all([
      Usuario.countDocuments({ rol: 'agencia', estado: 'aprobado' }),
      Usuario.countDocuments({ rol: 'agencia', estado: 'pendiente' }),
      Ruta.countDocuments({ estado: 'publicada' }),
      Ruta.countDocuments({ estado: 'en_revision' }),
      Reporte.countDocuments({ estado: 'pendiente' }),
      Usuario.countDocuments({ rol: 'usuario' }),
      Ruta.aggregate([{ $group: { _id: null, total: { $sum: '$consultas' } } }])
    ]);

    res.json({
      exito: true,
      datos: {
        totalAgencias, agenciasPendientes, rutasPublicadas, rutasPorRevisar,
        reportesPendientes, totalUsuarios,
        consultasTotales: consultasTotales[0]?.total || 0
      }
    });
  } catch (error) { next(error); }
};

// GET /api/admin/historial
exports.historial = async (req, res, next) => {
  try {
    const historial = await Historial.find()
      .populate('usuarioResponsable', 'nombre')
      .sort({ createdAt: -1 }).limit(100);
    res.json({ exito: true, datos: historial });
  } catch (error) { next(error); }
};

// =============================================
// GESTION DE USUARIOS
// =============================================

// GET /api/admin/usuarios
exports.listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find()
      .select('-password -documentos').sort({ createdAt: -1 });
    res.json({ exito: true, datos: usuarios });
  } catch (error) { next(error); }
};

// PUT /api/admin/usuarios/:id/suspender
exports.suspenderUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    if (usuario.rol === 'super_admin') return res.status(400).json({ exito: false, mensaje: 'No se puede suspender al super admin' });
    usuario.estado = 'suspendido';
    await usuario.save();
    res.json({ exito: true, mensaje: 'Usuario suspendido' });
  } catch (error) { next(error); }
};

// PUT /api/admin/usuarios/:id/reactivar
exports.reactivarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    usuario.estado = 'aprobado';
    await usuario.save();
    res.json({ exito: true, mensaje: 'Usuario reactivado' });
  } catch (error) { next(error); }
};

// DELETE /api/admin/usuarios/:id
exports.eliminarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    if (usuario.rol === 'super_admin') return res.status(400).json({ exito: false, mensaje: 'No se puede eliminar al super admin' });
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ exito: true, mensaje: 'Usuario eliminado' });
  } catch (error) { next(error); }
};

// =============================================
// GESTION DE CONCESIONARIOS
// =============================================

// GET /api/admin/concesionarios
exports.listarConcesionarios = async (req, res, next) => {
  try {
    const concesionarios = await Usuario.find({ rol: 'agencia' })
      .select('-password').sort({ createdAt: -1 });

    // Agregar rutas de cada concesionario
    const ids = concesionarios.map(c => c._id);
    const rutas = await Ruta.find({ agenciaId: { $in: ids } }).select('nombre estado agenciaId color');

    const datos = concesionarios.map(c => {
      const obj = c.toObject();
      obj.rutas = rutas.filter(r => r.agenciaId.toString() === c._id.toString());
      return obj;
    });

    res.json({ exito: true, datos });
  } catch (error) { next(error); }
};

// PUT /api/admin/concesionarios/:id/activar
exports.activarConcesionario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario || usuario.rol !== 'agencia') return res.status(404).json({ exito: false, mensaje: 'Concesionario no encontrado' });
    usuario.estado = 'aprobado';
    await usuario.save();
    res.json({ exito: true, mensaje: 'Concesionario activado' });
  } catch (error) { next(error); }
};

// PUT /api/admin/concesionarios/:id/desactivar
exports.desactivarConcesionario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario || usuario.rol !== 'agencia') return res.status(404).json({ exito: false, mensaje: 'Concesionario no encontrado' });
    usuario.estado = 'suspendido';
    await usuario.save();
    res.json({ exito: true, mensaje: 'Concesionario desactivado' });
  } catch (error) { next(error); }
};

// =============================================
// SUPERVISION DE RUTAS Y PARADAS
// =============================================

// GET /api/admin/rutas-todas
exports.listarTodasRutas = async (req, res, next) => {
  try {
    const rutas = await Ruta.find().populate('agenciaId', 'nombre').sort({ createdAt: -1 });
    res.json({ exito: true, datos: rutas });
  } catch (error) { next(error); }
};

// GET /api/admin/paradas-todas
exports.listarTodasParadas = async (req, res, next) => {
  try {
    const paradas = await Parada.find().populate('rutaId', 'nombre color').sort({ rutaId: 1, orden: 1 });
    res.json({ exito: true, datos: paradas });
  } catch (error) { next(error); }
};

// PUT /api/admin/rutas/:id/desactivar
exports.desactivarRuta = async (req, res, next) => {
  try {
    const ruta = await Ruta.findByIdAndUpdate(req.params.id, { estado: 'despublicada' }, { new: true });
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });
    res.json({ exito: true, mensaje: 'Ruta desactivada', datos: ruta });
  } catch (error) { next(error); }
};

// PUT /api/admin/rutas/:id/activar
exports.activarRuta = async (req, res, next) => {
  try {
    const ruta = await Ruta.findByIdAndUpdate(req.params.id, { estado: 'publicada' }, { new: true });
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });
    res.json({ exito: true, mensaje: 'Ruta activada', datos: ruta });
  } catch (error) { next(error); }
};

// DELETE /api/admin/paradas/:id
exports.eliminarParada = async (req, res, next) => {
  try {
    const parada = await Parada.findByIdAndDelete(req.params.id);
    if (!parada) return res.status(404).json({ exito: false, mensaje: 'Parada no encontrada' });
    res.json({ exito: true, mensaje: 'Parada eliminada' });
  } catch (error) { next(error); }
};

// =============================================
// MODERACION DE CONTENIDO
// =============================================

// GET /api/admin/reportes-todos
exports.listarTodosReportes = async (req, res, next) => {
  try {
    const reportes = await Reporte.find()
      .populate('usuarioId', 'nombre email')
      .populate('rutaId', 'nombre color')
      .sort({ createdAt: -1 });
    res.json({ exito: true, datos: reportes });
  } catch (error) { next(error); }
};

// PUT /api/admin/reportes/:id/resolver
exports.resolverReporte = async (req, res, next) => {
  try {
    const reporte = await Reporte.findByIdAndUpdate(req.params.id, { estado: 'resuelto' }, { new: true });
    if (!reporte) return res.status(404).json({ exito: false, mensaje: 'Reporte no encontrado' });
    res.json({ exito: true, mensaje: 'Reporte marcado como resuelto', datos: reporte });
  } catch (error) { next(error); }
};

// DELETE /api/admin/reportes/:id
exports.eliminarReporte = async (req, res, next) => {
  try {
    const reporte = await Reporte.findByIdAndDelete(req.params.id);
    if (!reporte) return res.status(404).json({ exito: false, mensaje: 'Reporte no encontrado' });
    res.json({ exito: true, mensaje: 'Reporte eliminado' });
  } catch (error) { next(error); }
};

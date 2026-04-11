const Usuario = require('../models/Usuario');
const Ruta = require('../models/Ruta');
const Reporte = require('../models/Reporte');
const Notificacion = require('../models/Notificacion');
const Historial = require('../models/Historial');

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
      mensaje: 'Tu cuenta ha sido verificada y aprobada. Ya puedes iniciar sesión y registrar tus rutas.',
      entidadTipo: 'usuario',
      entidadId: usuario._id
    });

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
    const [totalAgencias, agenciasPendientes, rutasPublicadas, reportesPendientes, consultasTotales] = await Promise.all([
      Usuario.countDocuments({ rol: 'agencia', estado: 'aprobado' }),
      Usuario.countDocuments({ rol: 'agencia', estado: 'pendiente' }),
      Ruta.countDocuments({ estado: 'publicada' }),
      Reporte.countDocuments({ estado: 'pendiente' }),
      Ruta.aggregate([{ $group: { _id: null, total: { $sum: '$consultas' } } }])
    ]);

    const totalUsuarios = await Usuario.countDocuments({ rol: 'usuario' });

    res.json({
      exito: true,
      datos: {
        totalAgencias, agenciasPendientes, rutasPublicadas,
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

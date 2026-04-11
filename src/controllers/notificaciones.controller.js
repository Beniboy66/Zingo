const Notificacion = require('../models/Notificacion');

// GET /api/notificaciones
exports.listar = async (req, res, next) => {
  try {
    const notificaciones = await Notificacion.find({
      $or: [
        { usuarioDestinoId: req.usuario._id },
        { rolDestino: req.usuario.rol }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    const noLeidas = await Notificacion.countDocuments({
      $or: [
        { usuarioDestinoId: req.usuario._id },
        { rolDestino: req.usuario.rol }
      ],
      leida: false
    });

    res.json({ exito: true, datos: { notificaciones, noLeidas } });
  } catch (error) { next(error); }
};

// PUT /api/notificaciones/:id
exports.marcarLeida = async (req, res, next) => {
  try {
    const notificacion = await Notificacion.findByIdAndUpdate(
      req.params.id, { leida: true }, { new: true }
    );
    if (!notificacion) return res.status(404).json({ exito: false, mensaje: 'Notificación no encontrada' });
    res.json({ exito: true, datos: notificacion });
  } catch (error) { next(error); }
};

// PUT /api/notificaciones/leer-todas
exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    await Notificacion.updateMany(
      { $or: [{ usuarioDestinoId: req.usuario._id }, { rolDestino: req.usuario.rol }], leida: false },
      { leida: true }
    );
    res.json({ exito: true, mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) { next(error); }
};

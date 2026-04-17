const Reporte = require('../models/Reporte');

// GET /api/reportes/ruta/:rutaId
exports.listarPorRuta = async (req, res, next) => {
  try {
    const reportes = await Reporte.find({ rutaId: req.params.rutaId, expiraEn: { $gt: new Date() } })
      .populate('usuarioId', 'nombre')
      .sort({ createdAt: -1 });
    res.json({ exito: true, datos: reportes });
  } catch (error) { next(error); }
};

// POST /api/reportes
exports.crear = async (req, res, next) => {
  try {
    const reporte = await Reporte.create({
      ...req.body,
      usuarioId: req.usuario._id
    });
    res.status(201).json({ exito: true, mensaje: 'Reporte enviado', datos: reporte });
  } catch (error) { next(error); }
};

// PUT /api/reportes/:id — Validar/rechazar (solo admin)
exports.actualizar = async (req, res, next) => {
  try {
    const reporte = await Reporte.findOneAndUpdate(
      { _id: req.params.id },
      { estado: req.body.estado },
      { new: true, runValidators: true }
    );
    if (!reporte) return res.status(404).json({ exito: false, mensaje: 'Reporte no encontrado' });
    res.json({ exito: true, mensaje: `Reporte marcado como ${reporte.estado}`, datos: reporte });
  } catch (error) { next(error); }
};

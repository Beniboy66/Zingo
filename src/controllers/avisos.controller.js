const Aviso = require('../models/Aviso');

exports.listarPorRuta = async (req, res, next) => {
  try {
    const avisos = await Aviso.find({
      rutaId: req.params.rutaId,
      activo: true,
      $or: [{ fechaExpiracion: null }, { fechaExpiracion: { $gte: new Date() } }]
    }).sort({ createdAt: -1 });
    res.json({ exito: true, datos: avisos });
  } catch (error) { next(error); }
};

exports.crear = async (req, res, next) => {
  try {
    const aviso = await Aviso.create({ ...req.body, agenciaId: req.usuario._id });
    res.status(201).json({ exito: true, mensaje: 'Aviso publicado', datos: aviso });
  } catch (error) { next(error); }
};

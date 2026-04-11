const Parada = require('../models/Parada');

exports.listarPorRuta = async (req, res, next) => {
  try {
    const paradas = await Parada.find({ rutaId: req.params.rutaId }).sort({ orden: 1 });
    res.json({ exito: true, datos: paradas });
  } catch (error) { next(error); }
};

exports.crear = async (req, res, next) => {
  try {
    const parada = await Parada.create(req.body);
    res.status(201).json({ exito: true, mensaje: 'Parada creada', datos: parada });
  } catch (error) { next(error); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const parada = await Parada.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!parada) return res.status(404).json({ exito: false, mensaje: 'Parada no encontrada' });
    res.json({ exito: true, mensaje: 'Parada actualizada', datos: parada });
  } catch (error) { next(error); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const parada = await Parada.findByIdAndDelete(req.params.id);
    if (!parada) return res.status(404).json({ exito: false, mensaje: 'Parada no encontrada' });
    res.json({ exito: true, mensaje: 'Parada eliminada' });
  } catch (error) { next(error); }
};

const Favorito = require('../models/Favorito');

exports.listar = async (req, res, next) => {
  try {
    const favoritos = await Favorito.find({ usuarioId: req.usuario._id })
      .populate({ path: 'rutaId', select: 'nombre color tarifa estado descripcion' });
    res.json({ exito: true, datos: favoritos });
  } catch (error) { next(error); }
};

exports.agregar = async (req, res, next) => {
  try {
    const favorito = await Favorito.create({ usuarioId: req.usuario._id, rutaId: req.body.rutaId });
    res.status(201).json({ exito: true, mensaje: 'Ruta agregada a favoritos', datos: favorito });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ exito: false, mensaje: 'Esta ruta ya está en tus favoritos' });
    next(error);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const favorito = await Favorito.findOneAndDelete({ usuarioId: req.usuario._id, rutaId: req.params.rutaId });
    if (!favorito) return res.status(404).json({ exito: false, mensaje: 'Favorito no encontrado' });
    res.json({ exito: true, mensaje: 'Ruta eliminada de favoritos' });
  } catch (error) { next(error); }
};

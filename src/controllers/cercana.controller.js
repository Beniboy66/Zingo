const Parada = require('../models/Parada');

// GET /api/cercana?lat=20.0840&lng=-98.3600&limite=5
exports.buscarCercanas = async (req, res, next) => {
  try {
    const { lat, lng, limite = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ exito: false, mensaje: 'Se requieren lat y lng' });
    }

    const paradas = await Parada.find({
      ubicacion: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 2000 // 2km máximo
        }
      }
    }).limit(parseInt(limite)).populate({
      path: 'rutaId',
      select: 'nombre color tarifa estado',
      match: { estado: 'publicada' }
    });

    // Filtrar paradas cuya ruta no esté publicada
    const resultado = paradas.filter(p => p.rutaId !== null);

    res.json({ exito: true, datos: resultado });
  } catch (error) { next(error); }
};

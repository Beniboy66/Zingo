const Parada = require('../models/Parada');
const Ruta = require('../models/Ruta');
const { calcularHaversine } = require('../utils/haversine');

// GET /api/estimacion?rutaId=X&origenId=Y&destinoId=Z
exports.estimar = async (req, res, next) => {
  try {
    const { rutaId, origenId, destinoId } = req.query;

    if (!rutaId || !origenId || !destinoId) {
      return res.status(400).json({ exito: false, mensaje: 'Se requieren rutaId, origenId y destinoId' });
    }

    const ruta = await Ruta.findById(rutaId);
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });

    const paradas = await Parada.find({ rutaId }).sort({ orden: 1 });

    const origen = paradas.find(p => p._id.toString() === origenId);
    const destino = paradas.find(p => p._id.toString() === destinoId);

    if (!origen || !destino) {
      return res.status(404).json({ exito: false, mensaje: 'Parada de origen o destino no encontrada' });
    }

    // Calcular recorrido entre origen y destino
    const ordenInicio = Math.min(origen.orden, destino.orden);
    const ordenFin = Math.max(origen.orden, destino.orden);
    const paradasEnRecorrido = paradas.filter(p => p.orden >= ordenInicio && p.orden <= ordenFin);

    // Calcular distancia total sumando tramos
    let distanciaTotal = 0;
    for (let i = 0; i < paradasEnRecorrido.length - 1; i++) {
      const [lng1, lat1] = paradasEnRecorrido[i].ubicacion.coordinates;
      const [lng2, lat2] = paradasEnRecorrido[i + 1].ubicacion.coordinates;
      distanciaTotal += calcularHaversine(lat1, lng1, lat2, lng2);
    }

    // Estimar tiempo con velocidad promedio de la ruta
    const tiempoEstimadoMin = Math.round((distanciaTotal / ruta.velocidadPromedioKmh) * 60);

    res.json({
      exito: true,
      datos: {
        distancia_km: Math.round(distanciaTotal * 100) / 100,
        tiempo_estimado_min: tiempoEstimadoMin,
        tarifa: ruta.tarifa,
        paradas_en_recorrido: paradasEnRecorrido.length,
        recorrido: paradasEnRecorrido.map(p => ({
          id: p._id, nombre: p.nombre, orden: p.orden, referencia: p.referencia
        }))
      }
    });
  } catch (error) { next(error); }
};

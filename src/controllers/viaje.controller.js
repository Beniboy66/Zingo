const Ruta = require('../models/Ruta');
const Parada = require('../models/Parada');
const { calcularHaversine } = require('../utils/haversine');

// Distancia en metros entre dos puntos [lng, lat]
function distanciaM(coord1, coord2) {
  return calcularHaversine(coord1[1], coord1[0], coord2[1], coord2[0]) * 1000;
}

// Encontrar la parada mas cercana a un punto entre todas las rutas
async function paradaCercana(lng, lat, maxDistancia = 2000) {
  const paradas = await Parada.find({
    ubicacion: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: maxDistancia
      }
    }
  }).limit(20).lean();
  return paradas;
}

// Encontrar paradas cercanas agrupadas por ruta
async function paradasCercanasPorRuta(lng, lat, maxDist = 2000) {
  const paradas = await paradaCercana(lng, lat, maxDist);
  const porRuta = {};
  for (const p of paradas) {
    const rid = p.rutaId.toString();
    if (!porRuta[rid] || distanciaM(p.ubicacion.coordinates, [lng, lat]) < distanciaM(porRuta[rid].ubicacion.coordinates, [lng, lat])) {
      porRuta[rid] = p;
    }
  }
  return porRuta;
}

// Verificar si una ruta conecta origen con destino (la parada de destino debe estar despues de la de origen)
function rutaConecta(paradaOrigen, paradaDestino) {
  return paradaOrigen.rutaId.toString() === paradaDestino.rutaId.toString() &&
         paradaOrigen.orden < paradaDestino.orden;
}

// GET /api/viaje/planificar?origenLat=&origenLng=&destinoLat=&destinoLng=
exports.planificar = async (req, res, next) => {
  try {
    const { origenLat, origenLng, destinoLat, destinoLng } = req.query;

    if (!origenLat || !origenLng || !destinoLat || !destinoLng) {
      return res.status(400).json({ exito: false, mensaje: 'Se requieren origenLat, origenLng, destinoLat, destinoLng' });
    }

    const oLat = parseFloat(origenLat);
    const oLng = parseFloat(origenLng);
    const dLat = parseFloat(destinoLat);
    const dLng = parseFloat(destinoLng);

    // 1. Buscar paradas cercanas al origen y destino
    const paradasOrigen = await paradasCercanasPorRuta(oLng, oLat, 2000);
    const paradasDestino = await paradasCercanasPorRuta(dLng, dLat, 2000);

    if (Object.keys(paradasOrigen).length === 0) {
      return res.json({ exito: true, datos: null, mensaje: 'No hay paradas cercanas a tu ubicación' });
    }
    if (Object.keys(paradasDestino).length === 0) {
      return res.json({ exito: true, datos: null, mensaje: 'No hay paradas cercanas al destino' });
    }

    // Cargar info de rutas
    const rutaIds = [...new Set([...Object.keys(paradasOrigen), ...Object.keys(paradasDestino)])];
    const rutas = await Ruta.find({ _id: { $in: rutaIds }, estado: 'publicada', activa: true }).lean();
    const rutasMap = {};
    for (const r of rutas) rutasMap[r._id.toString()] = r;

    // 2. Intento 1: Viaje directo (una sola ruta)
    let mejorDirecto = null;

    for (const rutaId of Object.keys(paradasOrigen)) {
      if (paradasDestino[rutaId] && rutasMap[rutaId]) {
        const pOrig = paradasOrigen[rutaId];
        const pDest = paradasDestino[rutaId];
        if (pOrig.orden < pDest.orden) {
          const distCaminataOrigen = distanciaM(pOrig.ubicacion.coordinates, [oLng, oLat]);
          const distCaminataDestino = distanciaM(pDest.ubicacion.coordinates, [dLng, dLat]);
          const score = distCaminataOrigen + distCaminataDestino;

          if (!mejorDirecto || score < mejorDirecto.score) {
            // Obtener paradas intermedias
            const paradasRuta = await Parada.find({
              rutaId: rutaId,
              orden: { $gte: pOrig.orden, $lte: pDest.orden }
            }).sort({ orden: 1 }).lean();

            mejorDirecto = {
              score,
              tipo: 'directo',
              caminataOrigenM: Math.round(distCaminataOrigen),
              caminataDestinoM: Math.round(distCaminataDestino),
              segmentos: [{
                ruta: rutasMap[rutaId],
                paradaSubida: pOrig,
                paradaBajada: pDest,
                paradasIntermedias: paradasRuta,
                numParadas: pDest.orden - pOrig.orden
              }]
            };
          }
        }
      }
    }

    if (mejorDirecto) {
      // Extraer trazo parcial de la ruta (solo el segmento usado)
      mejorDirecto.segmentos[0].trazoParcial = extraerTrazoParcial(
        mejorDirecto.segmentos[0].ruta.trazo.coordinates,
        mejorDirecto.segmentos[0].paradaSubida.ubicacion.coordinates,
        mejorDirecto.segmentos[0].paradaBajada.ubicacion.coordinates
      );
      return res.json({ exito: true, datos: formatearViaje(mejorDirecto, oLat, oLng, dLat, dLng) });
    }

    // 3. Intento 2: Viaje con un transbordo (dos rutas)
    let mejorTransbordo = null;

    for (const rutaOrigenId of Object.keys(paradasOrigen)) {
      if (!rutasMap[rutaOrigenId]) continue;

      // Buscar todas las paradas de esta ruta despues de la parada de origen
      const paradasRutaOrigen = await Parada.find({
        rutaId: rutaOrigenId,
        orden: { $gte: paradasOrigen[rutaOrigenId].orden }
      }).sort({ orden: 1 }).lean();

      for (const paradaTransbordo of paradasRutaOrigen) {
        // Buscar paradas de otras rutas cercanas a este punto de transbordo
        const cercanas = await paradaCercana(
          paradaTransbordo.ubicacion.coordinates[0],
          paradaTransbordo.ubicacion.coordinates[1],
          400 // max 400m caminando entre transbordos
        );

        for (const paradaConexion of cercanas) {
          const rutaDestinoId = paradaConexion.rutaId.toString();
          if (rutaDestinoId === rutaOrigenId) continue;
          if (!paradasDestino[rutaDestinoId]) continue;
          if (!rutasMap[rutaDestinoId]) continue;

          const pDest = paradasDestino[rutaDestinoId];
          if (paradaConexion.orden >= pDest.orden) continue;

          const distCaminataOrigen = distanciaM(paradasOrigen[rutaOrigenId].ubicacion.coordinates, [oLng, oLat]);
          const distTransbordo = distanciaM(paradaTransbordo.ubicacion.coordinates, paradaConexion.ubicacion.coordinates);
          const distCaminataDestino = distanciaM(pDest.ubicacion.coordinates, [dLng, dLat]);
          const score = distCaminataOrigen + distTransbordo * 2 + distCaminataDestino; // penalizar transbordo

          if (!mejorTransbordo || score < mejorTransbordo.score) {
            const paradasSeg1 = await Parada.find({
              rutaId: rutaOrigenId,
              orden: { $gte: paradasOrigen[rutaOrigenId].orden, $lte: paradaTransbordo.orden }
            }).sort({ orden: 1 }).lean();

            const paradasSeg2 = await Parada.find({
              rutaId: rutaDestinoId,
              orden: { $gte: paradaConexion.orden, $lte: pDest.orden }
            }).sort({ orden: 1 }).lean();

            mejorTransbordo = {
              score,
              tipo: 'transbordo',
              caminataOrigenM: Math.round(distCaminataOrigen),
              caminataDestinoM: Math.round(distCaminataDestino),
              caminataTransbordoM: Math.round(distTransbordo),
              segmentos: [
                {
                  ruta: rutasMap[rutaOrigenId],
                  paradaSubida: paradasOrigen[rutaOrigenId],
                  paradaBajada: paradaTransbordo,
                  paradasIntermedias: paradasSeg1,
                  numParadas: paradaTransbordo.orden - paradasOrigen[rutaOrigenId].orden
                },
                {
                  ruta: rutasMap[rutaDestinoId],
                  paradaSubida: paradaConexion,
                  paradaBajada: pDest,
                  paradasIntermedias: paradasSeg2,
                  numParadas: pDest.orden - paradaConexion.orden
                }
              ]
            };
          }
        }
      }
    }

    if (mejorTransbordo) {
      mejorTransbordo.segmentos[0].trazoParcial = extraerTrazoParcial(
        mejorTransbordo.segmentos[0].ruta.trazo.coordinates,
        mejorTransbordo.segmentos[0].paradaSubida.ubicacion.coordinates,
        mejorTransbordo.segmentos[0].paradaBajada.ubicacion.coordinates
      );
      mejorTransbordo.segmentos[1].trazoParcial = extraerTrazoParcial(
        mejorTransbordo.segmentos[1].ruta.trazo.coordinates,
        mejorTransbordo.segmentos[1].paradaSubida.ubicacion.coordinates,
        mejorTransbordo.segmentos[1].paradaBajada.ubicacion.coordinates
      );
      return res.json({ exito: true, datos: formatearViaje(mejorTransbordo, oLat, oLng, dLat, dLng) });
    }

    // No se encontro ruta
    return res.json({
      exito: true,
      datos: null,
      mensaje: 'No se encontró una combinación de rutas para llegar a ese destino'
    });

  } catch (error) {
    next(error);
  }
};

// Extraer la porcion del trazo entre dos puntos
function extraerTrazoParcial(coordenadas, coordInicio, coordFin) {
  let iInicio = 0, iFin = coordenadas.length - 1;
  let minDistInicio = Infinity, minDistFin = Infinity;

  for (let i = 0; i < coordenadas.length; i++) {
    const d1 = distanciaM(coordenadas[i], coordInicio);
    const d2 = distanciaM(coordenadas[i], coordFin);
    if (d1 < minDistInicio) { minDistInicio = d1; iInicio = i; }
    if (d2 < minDistFin) { minDistFin = d2; iFin = i; }
  }

  if (iInicio > iFin) [iInicio, iFin] = [iFin, iInicio];
  return coordenadas.slice(iInicio, iFin + 1);
}

// Formatear respuesta del viaje
function formatearViaje(viaje, oLat, oLng, dLat, dLng) {
  const tiempoEstimado = viaje.segmentos.reduce((total, seg) => {
    const distKm = seg.trazoParcial ? calcularDistanciaTrazo(seg.trazoParcial) : 0;
    return total + (distKm / (seg.ruta.velocidadPromedioKmh || 20)) * 60;
  }, 0);

  const caminataTotal = viaje.caminataOrigenM + viaje.caminataDestinoM + (viaje.caminataTransbordoM || 0);
  const tiempoCaminata = (caminataTotal / 80); // ~80m/min caminando

  const tarifaTotal = viaje.segmentos.reduce((t, s) => t + (s.ruta.tarifa || 0), 0);

  return {
    tipo: viaje.tipo,
    origen: { lat: oLat, lng: oLng },
    destino: { lat: dLat, lng: dLng },
    resumen: {
      tiempoTotalMin: Math.round(tiempoEstimado + tiempoCaminata),
      tiempoTransporteMin: Math.round(tiempoEstimado),
      tiempoCaminataMin: Math.round(tiempoCaminata),
      distanciaCaminataM: caminataTotal,
      tarifaTotal,
      numTransbordos: viaje.segmentos.length - 1
    },
    pasos: construirPasos(viaje, oLat, oLng, dLat, dLng),
    segmentos: viaje.segmentos.map(seg => ({
      ruta: {
        _id: seg.ruta._id,
        nombre: seg.ruta.nombre,
        color: seg.ruta.color,
        tarifa: seg.ruta.tarifa,
        frecuenciaMin: seg.ruta.frecuenciaMin
      },
      paradaSubida: {
        _id: seg.paradaSubida._id,
        nombre: seg.paradaSubida.nombre,
        ubicacion: seg.paradaSubida.ubicacion,
        orden: seg.paradaSubida.orden
      },
      paradaBajada: {
        _id: seg.paradaBajada._id,
        nombre: seg.paradaBajada.nombre,
        ubicacion: seg.paradaBajada.ubicacion,
        orden: seg.paradaBajada.orden
      },
      numParadas: seg.numParadas,
      trazoParcial: seg.trazoParcial
    }))
  };
}

// Construir pasos legibles para el usuario
function construirPasos(viaje, oLat, oLng, dLat, dLng) {
  const pasos = [];

  // Paso 1: Caminar al origen
  pasos.push({
    tipo: 'caminar',
    instruccion: `Camina ${viaje.caminataOrigenM}m hasta la parada "${viaje.segmentos[0].paradaSubida.nombre}"`,
    distanciaM: viaje.caminataOrigenM,
    destino: viaje.segmentos[0].paradaSubida.ubicacion.coordinates
  });

  for (let i = 0; i < viaje.segmentos.length; i++) {
    const seg = viaje.segmentos[i];

    // Paso: Tomar ruta
    pasos.push({
      tipo: 'transporte',
      instruccion: `Toma "${seg.ruta.nombre}" (${seg.numParadas} paradas)`,
      ruta: seg.ruta.nombre,
      color: seg.ruta.color,
      paradaSubida: seg.paradaSubida.nombre,
      paradaBajada: seg.paradaBajada.nombre,
      numParadas: seg.numParadas,
      frecuenciaMin: seg.ruta.frecuenciaMin,
      tarifa: seg.ruta.tarifa
    });

    // Si hay transbordo
    if (i < viaje.segmentos.length - 1) {
      pasos.push({
        tipo: 'transbordo',
        instruccion: `Camina ${viaje.caminataTransbordoM}m hasta la parada "${viaje.segmentos[i + 1].paradaSubida.nombre}"`,
        distanciaM: viaje.caminataTransbordoM,
        destino: viaje.segmentos[i + 1].paradaSubida.ubicacion.coordinates
      });
    }
  }

  // Paso final: Caminar al destino
  const ultimoSeg = viaje.segmentos[viaje.segmentos.length - 1];
  pasos.push({
    tipo: 'caminar',
    instruccion: `Camina ${viaje.caminataDestinoM}m hasta tu destino`,
    distanciaM: viaje.caminataDestinoM,
    destino: [dLng, dLat]
  });

  return pasos;
}

function calcularDistanciaTrazo(coords) {
  let d = 0;
  for (let i = 1; i < coords.length; i++) {
    d += distanciaM(coords[i - 1], coords[i]);
  }
  return d / 1000; // km
}

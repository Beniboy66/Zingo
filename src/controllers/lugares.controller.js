const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// GET /api/lugares/buscar?texto=&lat=&lng=
exports.buscar = async (req, res, next) => {
  try {
    const { texto, lat, lng } = req.query;
    if (!texto) return res.json({ exito: true, datos: [] });

    const location = lat && lng ? `&location=${lat},${lng}&radius=15000` : '';
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(texto)}${location}&language=es&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.json({ exito: true, datos: [] });
    }

    const lugares = (data.predictions || []).map(p => ({
      id: p.place_id,
      nombre: p.structured_formatting?.main_text || p.description,
      descripcion: p.structured_formatting?.secondary_text || '',
      placeId: p.place_id,
    }));

    res.json({ exito: true, datos: lugares });
  } catch (error) { next(error); }
};

// GET /api/lugares/detalle?placeId=
exports.detalle = async (req, res, next) => {
  try {
    const { placeId } = req.query;
    if (!placeId) return res.status(400).json({ exito: false, mensaje: 'Se requiere placeId' });

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&language=es&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      return res.json({ exito: false, mensaje: 'Lugar no encontrado' });
    }

    res.json({
      exito: true,
      datos: {
        nombre: data.result.name,
        direccion: data.result.formatted_address,
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
      }
    });
  } catch (error) { next(error); }
};

// GET /api/lugares/caminata?origenLat=&origenLng=&destinoLat=&destinoLng=
exports.caminata = async (req, res, next) => {
  try {
    const { origenLat, origenLng, destinoLat, destinoLng } = req.query;
    if (!origenLat || !origenLng || !destinoLat || !destinoLng) {
      return res.status(400).json({ exito: false, mensaje: 'Se requieren coordenadas de origen y destino' });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origenLat},${origenLng}&destination=${destinoLat},${destinoLng}&mode=walking&language=es&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes[0]) {
      return res.json({ exito: true, datos: null });
    }

    // Decodificar polyline
    const puntos = [];
    for (const leg of data.routes[0].legs) {
      for (const step of leg.steps) {
        puntos.push(...decodificarPolyline(step.polyline.points));
      }
    }

    const distancia = data.routes[0].legs.reduce((t, l) => t + l.distance.value, 0);
    const duracion = data.routes[0].legs.reduce((t, l) => t + l.duration.value, 0);

    res.json({
      exito: true,
      datos: {
        puntos, // [[lat, lng], ...]
        distanciaM: distancia,
        duracionSeg: duracion,
      }
    });
  } catch (error) { next(error); }
};

function decodificarPolyline(encoded) {
  const puntos = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    puntos.push([lat / 1e5, lng / 1e5]);
  }
  return puntos;
}

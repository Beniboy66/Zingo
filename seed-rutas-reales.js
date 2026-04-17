// =============================================
// SEED: Generar rutas reales usando Google Directions API
// Crea rutas que siguen calles reales en Tulancingo
// con paradas cada ~100 metros
// =============================================
require('dotenv').config();
const mongoose = require('mongoose');
const Ruta = require('./src/models/Ruta');
const Parada = require('./src/models/Parada');

// Pre-cargar modelos necesarios para los hooks
require('./src/models/Notificacion');
require('./src/models/Historial');
require('./src/models/Usuario');

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Definicion de rutas con waypoints reales de Tulancingo
const DEFINICIONES_RUTAS = [
  {
    nombre: 'Ruta 1 - Centro a Santiago Tulantepec',
    descripcion: 'Desde el centro de Tulancingo hacia Santiago Tulantepec por Blvd. Emilio Chuayffet',
    color: '#007AFF',
    tarifa: 12,
    frecuenciaMin: 10,
    origin: '20.0840,-98.3620', // Centro Tulancingo
    destination: '20.1040,-98.3190', // Santiago Tulantepec
    waypoints: ['20.0890,-98.3480', '20.0960,-98.3330']
  },
  {
    nombre: 'Ruta 2 - Centro a Cuautepec',
    descripcion: 'Terminal Centro hacia Cuautepec de Hinojosa por carretera',
    color: '#34C759',
    tarifa: 15,
    frecuenciaMin: 15,
    diasOperacion: 'L-S',
    origin: '20.0840,-98.3620',
    destination: '20.0555,-98.3290',
    waypoints: ['20.0750,-98.3510']
  },
  {
    nombre: 'Ruta 3 - Centro a La Esperanza',
    descripcion: 'Recorrido por colonias del norte hacia La Esperanza',
    color: '#FF9500',
    tarifa: 10,
    frecuenciaMin: 8,
    origin: '20.0840,-98.3620',
    destination: '20.0970,-98.3700',
    waypoints: ['20.0880,-98.3650']
  },
  {
    nombre: 'Ruta 4 - Centro a Acatlán',
    descripcion: 'Hacia Acatlán por la salida sur',
    color: '#AF52DE',
    tarifa: 14,
    frecuenciaMin: 20,
    origin: '20.0840,-98.3620',
    destination: '20.0620,-98.3800',
    waypoints: ['20.0760,-98.3700']
  },
  {
    nombre: 'Ruta 5 - Centro a Jaltepec',
    descripcion: 'De centro a Jaltepec por Av. Juárez',
    color: '#FF2D55',
    tarifa: 12,
    frecuenciaMin: 12,
    origin: '20.0840,-98.3620',
    destination: '20.0680,-98.3450',
    waypoints: ['20.0770,-98.3540']
  },
  {
    nombre: 'Ruta 6 - Centro a Ventoquipa',
    descripcion: 'Recorrido hacia el oriente por Ventoquipa',
    color: '#5856D6',
    tarifa: 12,
    frecuenciaMin: 15,
    origin: '20.0840,-98.3620',
    destination: '20.0830,-98.3350',
    waypoints: ['20.0850,-98.3480']
  },
  {
    nombre: 'Ruta 7 - Circuito Norte',
    descripcion: 'Circuito por las colonias del norte de Tulancingo',
    color: '#00C7BE',
    tarifa: 10,
    frecuenciaMin: 10,
    origin: '20.0840,-98.3620',
    destination: '20.0920,-98.3550',
    waypoints: ['20.0900,-98.3620', '20.0930,-98.3580']
  },
  {
    nombre: 'Ruta 8 - Centro a Los Mangos',
    descripcion: 'Hacia la zona sur-poniente por Los Mangos',
    color: '#FF6B35',
    tarifa: 10,
    frecuenciaMin: 12,
    origin: '20.0840,-98.3620',
    destination: '20.0720,-98.3720',
    waypoints: ['20.0790,-98.3660']
  },
  {
    nombre: 'Ruta 9 - Centro a Santa Ana Hueytlalpan',
    descripcion: 'Hacia Santa Ana por la carretera',
    color: '#30B0C7',
    tarifa: 14,
    frecuenciaMin: 18,
    origin: '20.0840,-98.3620',
    destination: '20.1000,-98.3480',
    waypoints: ['20.0900,-98.3550']
  },
  {
    nombre: 'Ruta 10 - Circuito Sur',
    descripcion: 'Circuito por las colonias del sur y poniente',
    color: '#8E8E93',
    tarifa: 10,
    frecuenciaMin: 10,
    origin: '20.0840,-98.3620',
    destination: '20.0750,-98.3620',
    waypoints: ['20.0780,-98.3700', '20.0720,-98.3650']
  },
  {
    nombre: 'Ruta 11 - Centro a El Paraíso',
    descripcion: 'Desde el centro hasta la colonia El Paraíso',
    color: '#E91E63',
    tarifa: 10,
    frecuenciaMin: 12,
    origin: '20.0840,-98.3620',
    destination: '20.0950,-98.3420',
    waypoints: ['20.0880,-98.3520']
  },
  {
    nombre: 'Ruta 12 - Centro a San Nicolás',
    descripcion: 'Recorrido hacia San Nicolás El Grande',
    color: '#4CAF50',
    tarifa: 13,
    frecuenciaMin: 15,
    origin: '20.0840,-98.3620',
    destination: '20.0700,-98.3500',
    waypoints: ['20.0780,-98.3560']
  }
];

// Obtener ruta desde Google Directions API
async function obtenerRutaGoogle(origin, destination, waypoints) {
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&language=es&key=${GOOGLE_API_KEY}`;
  if (waypoints && waypoints.length > 0) {
    url += `&waypoints=${waypoints.join('|')}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.routes || !data.routes[0]) {
    throw new Error(`Directions API error: ${data.status} - ${data.error_message || 'Sin detalles'}`);
  }

  // Decodificar el polyline de cada leg
  const coordenadas = [];
  for (const leg of data.routes[0].legs) {
    for (const step of leg.steps) {
      const puntos = decodificarPolyline(step.polyline.points);
      coordenadas.push(...puntos);
    }
  }

  // Eliminar duplicados consecutivos
  const unicas = [coordenadas[0]];
  for (let i = 1; i < coordenadas.length; i++) {
    const prev = unicas[unicas.length - 1];
    if (prev[0] !== coordenadas[i][0] || prev[1] !== coordenadas[i][1]) {
      unicas.push(coordenadas[i]);
    }
  }

  return unicas; // [[lng, lat], [lng, lat], ...]
}

// Decodificar encoded polyline de Google
function decodificarPolyline(encoded) {
  const puntos = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    puntos.push([lng / 1e5, lat / 1e5]); // [lng, lat] para GeoJSON
  }

  return puntos;
}

// Calcular distancia entre dos puntos en metros
function distanciaMetros(coord1, coord2) {
  const R = 6371000;
  const lat1 = coord1[1] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
  const dLng = (coord2[0] - coord1[0]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generar paradas cada ~100 metros a lo largo del trazo
function generarParadas(coordenadas, nombreRuta) {
  const paradas = [];
  let distanciaAcumulada = 0;
  let ultimaParada = 0;
  const INTERVALO = 100; // metros

  // Primera parada (terminal de inicio)
  paradas.push({
    coordenadas: coordenadas[0],
    orden: 1,
    esTerminal: true,
    nombre: `${nombreRuta} - Terminal Inicio`
  });

  for (let i = 1; i < coordenadas.length; i++) {
    distanciaAcumulada += distanciaMetros(coordenadas[i - 1], coordenadas[i]);

    if (distanciaAcumulada - ultimaParada >= INTERVALO) {
      paradas.push({
        coordenadas: coordenadas[i],
        orden: paradas.length + 1,
        esTerminal: false,
        nombre: `Parada ${paradas.length + 1}`
      });
      ultimaParada = distanciaAcumulada;
    }
  }

  // Ultima parada (terminal final)
  const ultimoCoord = coordenadas[coordenadas.length - 1];
  const yaExiste = paradas[paradas.length - 1].coordenadas[0] === ultimoCoord[0] &&
                   paradas[paradas.length - 1].coordenadas[1] === ultimoCoord[1];
  if (!yaExiste) {
    paradas.push({
      coordenadas: ultimoCoord,
      orden: paradas.length + 1,
      esTerminal: true,
      nombre: `${nombreRuta} - Terminal Final`
    });
  } else {
    paradas[paradas.length - 1].esTerminal = true;
    paradas[paradas.length - 1].nombre = `${nombreRuta} - Terminal Final`;
  }

  return paradas;
}

async function ejecutarSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener una agencia existente para asignar las rutas
    const Usuario = require('./src/models/Usuario');
    let agencia = await Usuario.findOne({ rol: 'agencia', estado: 'aprobado' });
    if (!agencia) {
      console.log('No se encontro agencia aprobada. Ejecuta primero seed.js');
      process.exit(1);
    }

    // Limpiar rutas y paradas existentes
    await Parada.deleteMany({});
    await Ruta.deleteMany({});
    console.log('Rutas y paradas anteriores eliminadas');

    let totalParadas = 0;

    for (const def of DEFINICIONES_RUTAS) {
      try {
        console.log(`\nProcesando: ${def.nombre}`);

        // Obtener trazo real de Google Directions
        const coordenadas = await obtenerRutaGoogle(def.origin, def.destination, def.waypoints);
        console.log(`  Trazo: ${coordenadas.length} puntos`);

        // Calcular distancia total
        let distTotal = 0;
        for (let i = 1; i < coordenadas.length; i++) {
          distTotal += distanciaMetros(coordenadas[i - 1], coordenadas[i]);
        }
        console.log(`  Distancia: ${(distTotal / 1000).toFixed(2)} km`);

        // Crear la ruta
        const ruta = await Ruta.create({
          agenciaId: agencia._id,
          nombre: def.nombre,
          descripcion: def.descripcion,
          tarifa: def.tarifa,
          velocidadPromedioKmh: def.velocidadPromedioKmh || 20,
          horarioInicio: def.horarioInicio || '06:00',
          horarioFin: def.horarioFin || '22:00',
          frecuenciaMin: def.frecuenciaMin,
          diasOperacion: def.diasOperacion || 'L-D',
          estado: 'publicada',
          activa: true,
          color: def.color,
          trazo: {
            type: 'LineString',
            coordinates: coordenadas
          }
        });

        // Generar paradas cada 100m
        const paradasDef = generarParadas(coordenadas, def.nombre.split(' - ')[0]);
        console.log(`  Paradas: ${paradasDef.length}`);

        // Insertar paradas
        await Parada.insertMany(paradasDef.map(p => ({
          rutaId: ruta._id,
          nombre: p.nombre,
          orden: p.orden,
          esTerminal: p.esTerminal,
          referencia: p.esTerminal ? 'Terminal' : `Parada sobre la ruta`,
          ubicacion: {
            type: 'Point',
            coordinates: p.coordenadas
          }
        })));

        totalParadas += paradasDef.length;
        console.log(`  OK - Ruta creada con ${paradasDef.length} paradas`);

        // Esperar un poco para no exceder rate limits de Google
        await new Promise(r => setTimeout(r, 300));

      } catch (err) {
        console.error(`  ERROR en ${def.nombre}: ${err.message}`);
      }
    }

    console.log(`\n========================================`);
    console.log(`Seed completado: ${DEFINICIONES_RUTAS.length} rutas, ${totalParadas} paradas totales`);
    console.log(`========================================`);

  } catch (error) {
    console.error('Error en seed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

ejecutarSeed();

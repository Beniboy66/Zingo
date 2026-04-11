require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Usuario = require('./src/models/Usuario');
const Ruta = require('./src/models/Ruta');
const Parada = require('./src/models/Parada');
const Reporte = require('./src/models/Reporte');
const Aviso = require('./src/models/Aviso');
const Favorito = require('./src/models/Favorito');
const Notificacion = require('./src/models/Notificacion');
const Historial = require('./src/models/Historial');
const VotoReporte = require('./src/models/VotoReporte');

async function ejecutarSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    await Promise.all([
      Usuario.deleteMany({}),
      Ruta.deleteMany({}),
      Parada.deleteMany({}),
      Reporte.deleteMany({}),
      Aviso.deleteMany({}),
      Favorito.deleteMany({}),
      Notificacion.deleteMany({}),
      Historial.deleteMany({}),
      VotoReporte.deleteMany({})
    ]);

    const admin = await Usuario.create({
      nombre: 'Administrador Zingo',
      telefono: '7751234567',
      emailContacto: 'admin@zingo.mx',
      email: 'admin@zingo.mx',
      password: 'admin123',
      rol: 'super_admin',
      estado: 'aprobado'
    });

    const agencia1 = await Usuario.create({
      nombre: 'Juan Pérez López',
      telefono: '7759876543',
      emailContacto: 'juanperez@gmail.com',
      tipoPersona: 'fisica',
      email: 'ruta12@transportes.mx',
      password: 'agencia123',
      rol: 'agencia',
      estado: 'aprobado',
      documentos: {
        tituloConcesion: ['uploads/documentos/titulo_concesion_juan.pdf'],
        identificacion: 'uploads/documentos/ine_juan.pdf',
        tarjetaCirculacion: 'uploads/documentos/tarjeta_juan.pdf'
      },
      datosVerificados: {
        nombreConcesionario: 'Juan Pérez López',
        folioTituloConcesion: 'STCH/TC/2022/04521',
        rutaAutorizada: 'Ruta 1 - Centro a Santiago Tulantepec',
        aprobadoPor: admin._id,
        fechaAprobacion: new Date()
      }
    });

    const agencia2 = await Usuario.create({
      nombre: 'Transportes Tulancingo Sur S.A. de C.V.',
      telefono: '7755551234',
      emailContacto: 'contacto@ttulsur.mx',
      tipoPersona: 'moral',
      email: 'contacto@ttulsur.mx',
      password: 'agencia456',
      rol: 'agencia',
      estado: 'aprobado',
      documentos: {
        tituloConcesion: [
          'uploads/documentos/titulo_1_ttulsur.pdf',
          'uploads/documentos/titulo_2_ttulsur.pdf',
          'uploads/documentos/titulo_3_ttulsur.pdf'
        ],
        identificacion: 'uploads/documentos/acta_constitutiva_ttulsur.pdf',
        tarjetaCirculacion: 'uploads/documentos/tarjeta_ttulsur.pdf'
      },
      datosVerificados: {
        nombreConcesionario: 'Transportes Tulancingo Sur S.A. de C.V.',
        nombreEmpresa: 'Transportes Tulancingo Sur S.A. de C.V.',
        folioTituloConcesion: 'STCH/TC/2022/03100, STCH/TC/2022/03101, STCH/TC/2022/03102',
        rutaAutorizada: 'Ruta 2 - Centro a Cuautepec / Ruta 4 - Centro a Acatlán',
        aprobadoPor: admin._id,
        fechaAprobacion: new Date()
      }
    });

    const agencia3 = await Usuario.create({
      nombre: 'Línea Cuautepec Express S.C.',
      telefono: '7755559876',
      emailContacto: 'cuautepec.express@gmail.com',
      tipoPersona: 'moral',
      email: 'cuautepec.express@gmail.com',
      password: 'pendiente789',
      rol: 'agencia',
      estado: 'pendiente',
      documentos: {
        tituloConcesion: ['uploads/documentos/titulo_cuautepec.pdf'],
        identificacion: 'uploads/documentos/acta_cuautepec.pdf',
        tarjetaCirculacion: 'uploads/documentos/tarjeta_cuautepec.pdf'
      }
    });

    const usuario1 = await Usuario.create({
      nombre: 'María García',
      telefono: '7751111111',
      emailContacto: 'maria.garcia@gmail.com',
      email: 'maria.garcia@gmail.com',
      password: 'user123',
      rol: 'usuario',
      estado: 'aprobado'
    });

    const usuario2 = await Usuario.create({
      nombre: 'Carlos Rodríguez',
      telefono: '7752222222',
      emailContacto: 'carlos.rdz@hotmail.com',
      email: 'carlos.rdz@hotmail.com',
      password: 'user456',
      rol: 'usuario',
      estado: 'aprobado'
    });

    const usuario3 = await Usuario.create({
      nombre: 'Ana Martínez',
      telefono: '7753333333',
      emailContacto: 'ana.mtz@gmail.com',
      email: 'ana.mtz@gmail.com',
      password: 'user789',
      rol: 'usuario',
      estado: 'aprobado'
    });

    const ruta1 = await Ruta.create({
      agenciaId: agencia1._id,
      nombre: 'Ruta 1 - Centro a Santiago Tulantepec',
      descripcion: 'Terminal Centro hacia Santiago Tulantepec por Blvd. Emilio Chuayffet',
      tarifa: 12.00,
      velocidadPromedioKmh: 18.0,
      horarioInicio: '06:00',
      horarioFin: '22:00',
      frecuenciaMin: 10,
      diasOperacion: 'L-D',
      estado: 'publicada',
      color: '#007AFF',
      trazo: {
        type: 'LineString',
        coordinates: [
          [-98.3625, 20.0833], [-98.3580, 20.0845], [-98.3530, 20.0870],
          [-98.3470, 20.0890], [-98.3400, 20.0920], [-98.3330, 20.0955],
          [-98.3260, 20.0990], [-98.3190, 20.1030]
        ]
      }
    });

    const ruta2 = await Ruta.create({
      agenciaId: agencia2._id,
      nombre: 'Ruta 2 - Centro a Cuautepec',
      descripcion: 'Terminal Centro hacia Cuautepec de Hinojosa',
      tarifa: 15.00,
      velocidadPromedioKmh: 22.0,
      horarioInicio: '06:00',
      horarioFin: '21:00',
      frecuenciaMin: 15,
      diasOperacion: 'L-S',
      estado: 'publicada',
      color: '#34C759',
      trazo: {
        type: 'LineString',
        coordinates: [
          [-98.3625, 20.0833], [-98.3580, 20.0810], [-98.3510, 20.0780],
          [-98.3420, 20.0720], [-98.3300, 20.0650]
        ]
      }
    });

    const ruta3 = await Ruta.create({
      agenciaId: agencia1._id,
      nombre: 'Ruta 3 - Circuito Centro',
      descripcion: 'Ruta circular por el centro de Tulancingo',
      tarifa: 10.00,
      velocidadPromedioKmh: 15.0,
      horarioInicio: '06:30',
      horarioFin: '21:30',
      frecuenciaMin: 8,
      diasOperacion: 'L-D',
      estado: 'publicada',
      color: '#FF9500',
      trazo: {
        type: 'LineString',
        coordinates: [
          [-98.3625, 20.0833], [-98.3600, 20.0850], [-98.3570, 20.0840],
          [-98.3590, 20.0820], [-98.3625, 20.0833]
        ]
      }
    });

    const ruta4 = await Ruta.create({
      agenciaId: agencia2._id,
      nombre: 'Ruta 4 - Centro a Acatlán',
      descripcion: 'Terminal Centro hacia Acatlán por la carretera federal',
      tarifa: 14.00,
      velocidadPromedioKmh: 25.0,
      horarioInicio: '05:30',
      horarioFin: '21:00',
      frecuenciaMin: 20,
      diasOperacion: 'L-D',
      estado: 'en_revision',
      color: '#AF52DE',
      trazo: {
        type: 'LineString',
        coordinates: [
          [-98.3625, 20.0833], [-98.3650, 20.0800], [-98.3700, 20.0750],
          [-98.3780, 20.0700], [-98.3850, 20.0650]
        ]
      }
    });

    const paradasRuta1 = [
      { nombre: 'Terminal Centro', coordinates: [-98.3625, 20.0833], orden: 1, esTerminal: true, referencia: 'Junto al mercado municipal' },
      { nombre: 'Catedral de Tulancingo', coordinates: [-98.3580, 20.0845], orden: 2, esTerminal: false, referencia: 'Frente a la Catedral' },
      { nombre: 'Hospital General', coordinates: [-98.3530, 20.0870], orden: 3, esTerminal: false, referencia: 'Entrada principal del hospital' },
      { nombre: 'Plaza Tulancingo', coordinates: [-98.3470, 20.0890], orden: 4, esTerminal: false, referencia: 'Frente a Plaza Tulancingo' },
      { nombre: 'Blvd. Chuayffet / Pemex', coordinates: [-98.3400, 20.0920], orden: 5, esTerminal: false, referencia: 'Gasolinera sobre el boulevard' },
      { nombre: 'Col. La Esperanza', coordinates: [-98.3330, 20.0955], orden: 6, esTerminal: false, referencia: 'Entrada de la colonia' },
      { nombre: 'Crucero Santiago', coordinates: [-98.3260, 20.0990], orden: 7, esTerminal: false, referencia: 'Cruce hacia Santiago' },
      { nombre: 'Santiago Tulantepec Centro', coordinates: [-98.3190, 20.1030], orden: 8, esTerminal: true, referencia: 'Plaza principal de Santiago' }
    ];

    const paradasRuta2 = [
      { nombre: 'Terminal Centro', coordinates: [-98.3625, 20.0833], orden: 1, esTerminal: true, referencia: 'Junto al mercado municipal' },
      { nombre: 'Av. 21 de Marzo', coordinates: [-98.3580, 20.0810], orden: 2, esTerminal: false, referencia: 'Esquina con calle Guerrero' },
      { nombre: 'Salida a Cuautepec', coordinates: [-98.3510, 20.0780], orden: 3, esTerminal: false, referencia: 'Caseta de cobro' },
      { nombre: 'San Lorenzo', coordinates: [-98.3420, 20.0720], orden: 4, esTerminal: false, referencia: 'Entrada a San Lorenzo' },
      { nombre: 'Cuautepec Centro', coordinates: [-98.3300, 20.0650], orden: 5, esTerminal: true, referencia: 'Plaza de Cuautepec' }
    ];

    const paradasRuta3 = [
      { nombre: 'Mercado Municipal', coordinates: [-98.3625, 20.0833], orden: 1, esTerminal: true, referencia: 'Punto de partida' },
      { nombre: 'Parque La Floresta', coordinates: [-98.3600, 20.0850], orden: 2, esTerminal: false, referencia: 'Entrada al parque' },
      { nombre: 'Presidencia Municipal', coordinates: [-98.3570, 20.0840], orden: 3, esTerminal: false, referencia: 'Frente al palacio' },
      { nombre: 'Calle Juárez / Escuela', coordinates: [-98.3590, 20.0820], orden: 4, esTerminal: false, referencia: 'Primaria Benito Juárez' },
      { nombre: 'Mercado Municipal', coordinates: [-98.3625, 20.0833], orden: 5, esTerminal: true, referencia: 'Regreso al punto de partida' }
    ];

    await Promise.all(paradasRuta1.map(p => Parada.create({ rutaId: ruta1._id, nombre: p.nombre, orden: p.orden, esTerminal: p.esTerminal, referencia: p.referencia, ubicacion: { type: 'Point', coordinates: p.coordinates } })));
    await Promise.all(paradasRuta2.map(p => Parada.create({ rutaId: ruta2._id, nombre: p.nombre, orden: p.orden, esTerminal: p.esTerminal, referencia: p.referencia, ubicacion: { type: 'Point', coordinates: p.coordinates } })));
    await Promise.all(paradasRuta3.map(p => Parada.create({ rutaId: ruta3._id, nombre: p.nombre, orden: p.orden, esTerminal: p.esTerminal, referencia: p.referencia, ubicacion: { type: 'Point', coordinates: p.coordinates } })));

    await Reporte.create({
      usuarioId: usuario1._id,
      rutaId: ruta1._id,
      tipo: 'mal_estado',
      descripcion: 'La unidad de placas HGO-TP-4521 tiene el parabrisas estrellado y las puertas no cierran bien',
      estado: 'pendiente',
      votosFavor: 3,
      votosContra: 1
    });

    await Reporte.create({
      usuarioId: usuario2._id,
      rutaId: ruta2._id,
      tipo: 'ruta_no_respetada',
      descripcion: 'La combi no pasa por la parada de San Lorenzo, se desvía directo a Cuautepec',
      estado: 'validado',
      votosFavor: 8,
      votosContra: 2
    });

    await Reporte.create({
      usuarioId: usuario3._id,
      rutaId: ruta1._id,
      tipo: 'tarifa_incorrecta',
      descripcion: 'Están cobrando $15 en vez de los $12 autorizados',
      estado: 'pendiente',
      votosFavor: 5,
      votosContra: 3
    });

    await Aviso.create({
      agenciaId: agencia1._id,
      rutaId: ruta1._id,
      titulo: 'Servicio reducido',
      mensaje: 'Por mantenimiento de unidades, la Ruta 1 operará con menor frecuencia hoy',
      tipo: 'informativo'
    });

    await Aviso.create({
      agenciaId: agencia2._id,
      rutaId: ruta2._id,
      titulo: 'Desvío temporal',
      mensaje: 'Por obras en Av. 21 de Marzo, la Ruta 2 tomará calle Guerrero como alternativa',
      tipo: 'desvio'
    });

    await Favorito.create({ usuarioId: usuario1._id, rutaId: ruta1._id });
    await Favorito.create({ usuarioId: usuario1._id, rutaId: ruta3._id });
    await Favorito.create({ usuarioId: usuario2._id, rutaId: ruta2._id });
    await Favorito.create({ usuarioId: usuario3._id, rutaId: ruta1._id });

    console.log('✅ Seed completado con datos de Tulancingo');
  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

ejecutarSeed();

const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Usuario = require('../models/Usuario');

// Generar JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// POST /api/auth/solicitud — Solicitud de cuenta de agencia (multipart)
exports.solicitudAgencia = async (req, res, next) => {
  try {
    const { nombre, telefono, emailContacto, tipoPersona, email, password } = req.body;

    // Validación con Zod
    const schema = z.object({
      nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
      telefono: z.string().min(10, 'Teléfono inválido'),
      emailContacto: z.string().email('Email de contacto inválido'),
      tipoPersona: z.enum(['fisica', 'moral']),
      email: z.string().email('Email de login inválido'),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
    });

    schema.parse({ nombre, telefono, emailContacto, tipoPersona, email, password });

    // Verificar que el email no esté registrado
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ exito: false, mensaje: 'El correo ya está registrado' });
    }

    // Procesar archivos subidos (guardar ruta relativa para servir via /uploads)
    const archivos = req.files || {};
    const rutaRelativa = (f) => `uploads/documentos/${f.filename}`;
    const documentos = {
      tituloConcesion: archivos.tituloConcesion ? archivos.tituloConcesion.map(rutaRelativa) : [],
      identificacion: archivos.identificacion ? rutaRelativa(archivos.identificacion[0]) : null,
      tarjetaCirculacion: archivos.tarjetaCirculacion ? rutaRelativa(archivos.tarjetaCirculacion[0]) : null,
      polizaSeguro: archivos.polizaSeguro ? rutaRelativa(archivos.polizaSeguro[0]) : null
    };

    // Validar documentos obligatorios
    if (documentos.tituloConcesion.length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'El título de concesión es obligatorio' });
    }
    if (!documentos.identificacion) {
      return res.status(400).json({ exito: false, mensaje: 'La identificación (INE o acta constitutiva) es obligatoria' });
    }
    if (!documentos.tarjetaCirculacion) {
      return res.status(400).json({ exito: false, mensaje: 'La tarjeta de circulación es obligatoria' });
    }

    const usuario = await Usuario.create({
      nombre, telefono, emailContacto, tipoPersona,
      email, password,
      rol: 'agencia',
      estado: 'pendiente',
      documentos
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Solicitud enviada correctamente. Será revisada por el equipo de Zingo.',
      datos: { id: usuario._id, nombre: usuario.nombre, estado: usuario.estado }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ exito: false, mensaje: error.errors[0].message });
    }
    next(error);
  }
};

// POST /api/auth/registro — Registro de usuario final (pasajero)
exports.registro = async (req, res, next) => {
  try {
    const schema = z.object({
      nombre: z.string().min(3),
      telefono: z.string().min(10),
      emailContacto: z.string().email(),
      email: z.string().email(),
      password: z.string().min(6)
    });

    schema.parse(req.body);

    const existe = await Usuario.findOne({ email: req.body.email });
    if (existe) {
      return res.status(400).json({ exito: false, mensaje: 'El correo ya está registrado' });
    }

    const usuario = await Usuario.create({
      ...req.body,
      rol: 'usuario',
      estado: 'aprobado'
    });

    const token = generarToken(usuario._id);

    res.status(201).json({
      exito: true,
      mensaje: 'Registro exitoso',
      datos: {
        token,
        usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ exito: false, mensaje: error.errors[0].message });
    }
    next(error);
  }
};

// POST /api/auth/login — Iniciar sesión
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ exito: false, mensaje: 'Email y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
    }

    // Verificar estado de la cuenta
    if (usuario.estado === 'pendiente') {
      return res.status(403).json({ exito: false, mensaje: 'Tu solicitud está en revisión. Recibirás un correo cuando sea aprobada.' });
    }
    if (usuario.estado === 'rechazado') {
      return res.status(403).json({ exito: false, mensaje: `Tu solicitud fue rechazada. Motivo: ${usuario.motivoRechazo || 'No especificado'}` });
    }
    if (usuario.estado === 'suspendido') {
      return res.status(403).json({ exito: false, mensaje: 'Tu cuenta ha sido suspendida' });
    }

    const token = generarToken(usuario._id);

    res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: {
        token,
        usuario: {
          _id: usuario._id, nombre: usuario.nombre, email: usuario.email,
          rol: usuario.rol, estado: usuario.estado,
          telefono: usuario.telefono, emailContacto: usuario.emailContacto,
          tipoPersona: usuario.tipoPersona,
          documentos: usuario.documentos,
          datosVerificados: usuario.datosVerificados
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

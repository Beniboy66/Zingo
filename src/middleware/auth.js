const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Verificar token JWT
const autenticar = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ exito: false, mensaje: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario) {
      return res.status(401).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    if (usuario.estado !== 'aprobado') {
      return res.status(403).json({ exito: false, mensaje: 'Cuenta no aprobada o suspendida' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ exito: false, mensaje: 'Token inválido o expirado' });
  }
};

// Verificar rol
const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para esta acción' });
    }
    next();
  };
};

module.exports = { autenticar, autorizar };

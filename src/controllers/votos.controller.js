const VotoReporte = require('../models/VotoReporte');
const Reporte = require('../models/Reporte');

// POST /api/votos
exports.votar = async (req, res, next) => {
  try {
    const { reporteId, voto } = req.body;

    if (!reporteId || !['favor', 'contra'].includes(voto)) {
      return res.status(400).json({ exito: false, mensaje: 'Se requiere reporteId y voto (favor/contra)' });
    }

    // Verificar voto duplicado
    const votoExistente = await VotoReporte.findOne({ reporteId, usuarioId: req.usuario._id });
    if (votoExistente) {
      return res.status(400).json({ exito: false, mensaje: 'Ya votaste en este reporte' });
    }

    await VotoReporte.create({ reporteId, usuarioId: req.usuario._id, voto });

    // Actualizar conteo en el reporte
    const campo = voto === 'favor' ? 'votosFavor' : 'votosContra';
    await Reporte.findByIdAndUpdate(reporteId, { $inc: { [campo]: 1 } });

    res.status(201).json({ exito: true, mensaje: 'Voto registrado' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ exito: false, mensaje: 'Ya votaste en este reporte' });
    }
    next(error);
  }
};

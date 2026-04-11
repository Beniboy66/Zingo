const Ruta = require('../models/Ruta');
const Parada = require('../models/Parada');

// GET /api/rutas — Listar rutas publicadas (app móvil)
exports.listar = async (req, res, next) => {
  try {
    const rutas = await Ruta.find({ estado: 'publicada', activa: true })
      .populate('agenciaId', 'nombre')
      .sort({ createdAt: -1 });
    res.json({ exito: true, datos: rutas });
  } catch (error) { next(error); }
};

// GET /api/rutas/:id — Ver ruta con paradas
exports.obtener = async (req, res, next) => {
  try {
    const ruta = await Ruta.findById(req.params.id).populate('agenciaId', 'nombre');
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });

    // Incrementar consultas
    ruta.consultas += 1;
    await ruta.save();

    const paradas = await Parada.find({ rutaId: ruta._id }).sort({ orden: 1 });

    res.json({ exito: true, datos: { ruta, paradas } });
  } catch (error) { next(error); }
};

// GET /api/rutas/agencia/:agenciaId — Rutas de una agencia (panel web)
exports.listarPorAgencia = async (req, res, next) => {
  try {
    const rutas = await Ruta.find({ agenciaId: req.params.agenciaId }).sort({ createdAt: -1 });
    res.json({ exito: true, datos: rutas });
  } catch (error) { next(error); }
};

// POST /api/rutas — Crear ruta (solo agencia)
exports.crear = async (req, res, next) => {
  try {
    const ruta = await Ruta.create({
      ...req.body,
      agenciaId: req.usuario._id,
      estado: 'borrador'
    });
    res.status(201).json({ exito: true, mensaje: 'Ruta creada como borrador', datos: ruta });
  } catch (error) { next(error); }
};

// PUT /api/rutas/:id — Actualizar ruta
exports.actualizar = async (req, res, next) => {
  try {
    const ruta = await Ruta.findById(req.params.id);
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });

    // Solo el dueño o admin puede editar
    if (ruta.agenciaId.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'super_admin') {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para editar esta ruta' });
    }

    const rutaActualizada = await Ruta.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ exito: true, mensaje: 'Ruta actualizada', datos: rutaActualizada });
  } catch (error) { next(error); }
};

// DELETE /api/rutas/:id — Eliminar ruta
exports.eliminar = async (req, res, next) => {
  try {
    const ruta = await Ruta.findById(req.params.id);
    if (!ruta) return res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });

    if (ruta.agenciaId.toString() !== req.usuario._id.toString() && req.usuario.rol !== 'super_admin') {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para eliminar esta ruta' });
    }

    // Eliminar paradas asociadas
    await Parada.deleteMany({ rutaId: ruta._id });
    await Ruta.findOneAndDelete({ _id: ruta._id });

    res.json({ exito: true, mensaje: 'Ruta y paradas eliminadas' });
  } catch (error) { next(error); }
};

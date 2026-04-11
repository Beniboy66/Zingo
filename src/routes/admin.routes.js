const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Todas las rutas de admin requieren autenticación + rol super_admin
router.use(autenticar, autorizar('super_admin'));

router.get('/solicitudes', ctrl.listarSolicitudes);
router.get('/solicitudes/:id', ctrl.detalleSolicitud);
router.put('/solicitudes/:id/aprobar', ctrl.aprobarSolicitud);
router.put('/solicitudes/:id/rechazar', ctrl.rechazarSolicitud);
router.get('/rutas-pendientes', ctrl.rutasPendientes);
router.put('/rutas/:id/aprobar', ctrl.aprobarRuta);
router.put('/rutas/:id/rechazar', ctrl.rechazarRuta);
router.get('/estadisticas', ctrl.estadisticas);
router.get('/historial', ctrl.historial);

module.exports = router;

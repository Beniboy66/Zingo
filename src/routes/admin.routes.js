const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { autenticar, autorizar } = require('../middleware/auth');

// Todas las rutas de admin requieren autenticación + rol super_admin
router.use(autenticar, autorizar('super_admin'));

// Solicitudes
router.get('/solicitudes', ctrl.listarSolicitudes);
router.get('/solicitudes/:id', ctrl.detalleSolicitud);
router.put('/solicitudes/:id/aprobar', ctrl.aprobarSolicitud);
router.put('/solicitudes/:id/rechazar', ctrl.rechazarSolicitud);

// Rutas pendientes
router.get('/rutas-pendientes', ctrl.rutasPendientes);
router.put('/rutas/:id/aprobar', ctrl.aprobarRuta);
router.put('/rutas/:id/rechazar', ctrl.rechazarRuta);

// Estadisticas e historial
router.get('/estadisticas', ctrl.estadisticas);
router.get('/historial', ctrl.historial);

// Gestion de usuarios
router.get('/usuarios', ctrl.listarUsuarios);
router.put('/usuarios/:id/suspender', ctrl.suspenderUsuario);
router.put('/usuarios/:id/reactivar', ctrl.reactivarUsuario);
router.delete('/usuarios/:id', ctrl.eliminarUsuario);

// Gestion de concesionarios
router.get('/concesionarios', ctrl.listarConcesionarios);
router.put('/concesionarios/:id/activar', ctrl.activarConcesionario);
router.put('/concesionarios/:id/desactivar', ctrl.desactivarConcesionario);

// Supervision de rutas y paradas
router.get('/rutas-todas', ctrl.listarTodasRutas);
router.get('/paradas-todas', ctrl.listarTodasParadas);
router.put('/rutas/:id/desactivar', ctrl.desactivarRuta);
router.put('/rutas/:id/activar', ctrl.activarRuta);
router.delete('/paradas/:id', ctrl.eliminarParada);

// Moderacion de contenido
router.get('/reportes-todos', ctrl.listarTodosReportes);
router.put('/reportes/:id/resolver', ctrl.resolverReporte);
router.delete('/reportes/:id', ctrl.eliminarReporte);

module.exports = router;

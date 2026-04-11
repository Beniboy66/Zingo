const router = require('express').Router();
const ctrl = require('../controllers/rutas.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/', ctrl.listar);
router.get('/agencia/:agenciaId', autenticar, ctrl.listarPorAgencia);
router.get('/:id', ctrl.obtener);
router.post('/', autenticar, autorizar('agencia'), ctrl.crear);
router.put('/:id', autenticar, autorizar('agencia', 'super_admin'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('agencia', 'super_admin'), ctrl.eliminar);

module.exports = router;

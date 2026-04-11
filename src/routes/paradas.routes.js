const router = require('express').Router();
const ctrl = require('../controllers/paradas.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/ruta/:rutaId', ctrl.listarPorRuta);
router.post('/', autenticar, autorizar('agencia', 'super_admin'), ctrl.crear);
router.put('/:id', autenticar, autorizar('agencia', 'super_admin'), ctrl.actualizar);
router.delete('/:id', autenticar, autorizar('agencia', 'super_admin'), ctrl.eliminar);

module.exports = router;

const router = require('express').Router();
const ctrl = require('../controllers/reportes.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/ruta/:rutaId', ctrl.listarPorRuta);
router.post('/', autenticar, autorizar('usuario'), ctrl.crear);
router.put('/:id', autenticar, autorizar('super_admin'), ctrl.actualizar);

module.exports = router;

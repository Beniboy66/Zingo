const router = require('express').Router();
const ctrl = require('../controllers/favoritos.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/', autenticar, autorizar('usuario'), ctrl.listar);
router.post('/', autenticar, autorizar('usuario'), ctrl.agregar);
router.delete('/:rutaId', autenticar, autorizar('usuario'), ctrl.eliminar);

module.exports = router;

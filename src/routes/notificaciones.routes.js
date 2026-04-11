const router = require('express').Router();
const ctrl = require('../controllers/notificaciones.controller');
const { autenticar } = require('../middleware/auth');

router.get('/', autenticar, ctrl.listar);
router.put('/leer-todas', autenticar, ctrl.marcarTodasLeidas);
router.put('/:id', autenticar, ctrl.marcarLeida);

module.exports = router;

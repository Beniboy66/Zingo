const router = require('express').Router();
const ctrl = require('../controllers/avisos.controller');
const { autenticar, autorizar } = require('../middleware/auth');

router.get('/ruta/:rutaId', ctrl.listarPorRuta);
router.post('/', autenticar, autorizar('agencia'), ctrl.crear);

module.exports = router;

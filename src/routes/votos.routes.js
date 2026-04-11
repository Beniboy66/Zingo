const router = require('express').Router();
const ctrl = require('../controllers/votos.controller');
const { autenticar, autorizar } = require('../middleware/auth');
router.post('/', autenticar, autorizar('usuario'), ctrl.votar);
module.exports = router;

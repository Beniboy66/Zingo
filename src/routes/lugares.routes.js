const router = require('express').Router();
const lugares = require('../controllers/lugares.controller');

router.get('/buscar', lugares.buscar);
router.get('/detalle', lugares.detalle);
router.get('/caminata', lugares.caminata);

module.exports = router;

const router = require('express').Router();
const viaje = require('../controllers/viaje.controller');

// GET /api/viaje/planificar?origenLat=&origenLng=&destinoLat=&destinoLng=
router.get('/planificar', viaje.planificar);

module.exports = router;

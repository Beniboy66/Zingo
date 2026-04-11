const router = require('express').Router();
const ctrl = require('../controllers/cercana.controller');
router.get('/', ctrl.buscarCercanas);
module.exports = router;

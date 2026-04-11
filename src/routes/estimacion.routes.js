const router = require('express').Router();
const ctrl = require('../controllers/estimacion.controller');
router.get('/', ctrl.estimar);
module.exports = router;

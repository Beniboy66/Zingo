const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const upload = require('../utils/upload');

// Solicitud de cuenta de agencia (multipart con PDFs)
router.post('/solicitud', upload.fields([
  { name: 'tituloConcesion', maxCount: 10 },
  { name: 'identificacion', maxCount: 1 },
  { name: 'tarjetaCirculacion', maxCount: 1 },
  { name: 'polizaSeguro', maxCount: 1 }
]), ctrl.solicitudAgencia);

router.post('/registro', ctrl.registro);
router.post('/login', ctrl.login);

module.exports = router;

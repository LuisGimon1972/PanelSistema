const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller.cjs');

router.post('/registrar', controller.registrar);
router.post('/login', controller.login);
router.get('/usuarios', controller.listarUsuarios);

module.exports = router;

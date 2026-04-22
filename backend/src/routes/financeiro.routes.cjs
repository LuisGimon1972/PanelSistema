const express = require('express');
const router = express.Router();
const controller = require('../controllers/financeiro.controller.cjs');

router.get('/entradas', controller.listarEntradas);
router.get('/resumo', controller.resumoEntradas);
router.get('/hoje', controller.resumoHoje);

module.exports = router;

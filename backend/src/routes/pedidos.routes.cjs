const express = require('express');
const router = express.Router();
const controller = require('../controllers/pedidos.controller.cjs');

router.get('/', controller.listarPedidos);
router.get('/:id', controller.buscarPedido);
router.post('/', controller.criarPedido);
router.put('/:id', controller.atualizarPedido);
router.put('/:id/status', controller.atualizarStatusPedido);
router.put('/:id/cancelar', controller.cancelarPedido);

module.exports = router;

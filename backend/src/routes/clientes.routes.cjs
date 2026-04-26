const express = require('express');
const router = express.Router();
const controller = require('../controllers/clientes.controller.cjs');

router.get('/', controller.listarClientes);
router.get('/:id', controller.buscarCliente);
router.post('/', controller.criarCliente);
router.put('/:id', controller.atualizarCliente);
router.delete('/:id', controller.excluirCliente);
router.patch('/:id/status', controller.atualizarStatusCliente);

module.exports = router;

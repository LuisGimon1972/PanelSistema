const express = require('express');
const router = express.Router();
const controller = require('../controllers/produtos.controller.cjs');

const multer = require('multer');
const path = require('path');

/* 🔥 CONFIG MULTER */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
    cb(null, nome);
  },
});

const upload = multer({ storage });

/* 🖼️ ROTA DE UPLOAD */
router.post('/upload', upload.single('foto'), (req, res) => {
  const url = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ url });
});

/* 📦 ROTAS PRODUTOS */
router.get('/', controller.listarProdutos);
router.get('/:id', controller.buscarProduto);
router.post('/', controller.criarProduto);
router.put('/:id', controller.atualizarProduto);
router.delete('/:id', controller.excluirProduto);
router.get('/codigo/:codigo', controller.buscarPorCodigoBarras);

module.exports = router;

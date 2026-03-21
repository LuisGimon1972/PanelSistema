const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller.cjs');

router.get('/', controller.getDashboard);

module.exports = router;

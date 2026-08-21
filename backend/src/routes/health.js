// Health route
const express = require('express');
const { health } = require('../controllers/healthController');

const router = express.Router();

// GET /api/health
router.get('/', health);

module.exports = router;

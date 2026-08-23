// Health & Deployment routes
const express = require('express');
const { health, deploymentHealth } = require('../controllers/healthController');

const router = express.Router();

// GET /api/health
router.get('/', health);

// GET /api/health/deployment
router.get('/deployment', deploymentHealth);

module.exports = router;

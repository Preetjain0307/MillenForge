/**
 * NeuraMindss — AI Product Intelligence Routes
 */

const express = require('express');
const router = express.Router();
const {
  analyze,
  recommendArchitecture,
  recommendPattern,
  scoreQuality,
  validateDesign,
  getFullIntelligence,
} = require('../controllers/intelligenceController');

router.post('/analyze-requirements', analyze);
router.post('/architecture-recommendation', recommendArchitecture);
router.post('/pattern-recommendation', recommendPattern);
router.post('/quality-score', scoreQuality);
router.post('/design-validation', validateDesign);
router.post('/product-intelligence', getFullIntelligence);

module.exports = router;

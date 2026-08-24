/**
 * NeuraMindss — AI Review & Self-Improvement Routes
 */

const express = require('express');
const router = express.Router();
const {
  reviewUI,
  healUI,
  refactorUI,
  recommendFeatures,
  autoImproveUI,
} = require('../controllers/reviewController');

router.post('/', reviewUI);
router.post('/heal', healUI);
router.post('/refactor', refactorUI);
router.post('/recommend-features', recommendFeatures);
router.post('/auto-improve', autoImproveUI);

module.exports = router;

const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');

// Theme generation
router.post('/theme', platformController.generateTheme);

// Documentation generation
router.post('/docs', platformController.generateDocs);

// Code impact analysis
router.post('/impact', platformController.analyzeImpact);

// UI Version History
router.post('/pages/:pageId/versions', platformController.createVersion);
router.get('/pages/:pageId/versions', platformController.listVersions);
router.post('/pages/:pageId/versions/:version/restore', platformController.restoreVersion);

module.exports = router;

// Upload route
const express = require('express');
const upload = require('../middleware/upload');
const { uploadWireframe } = require('../controllers/uploadController');

const router = express.Router();

// POST /api/upload
// field name: "wireframe"
router.post('/', upload.single('wireframe'), uploadWireframe);

module.exports = router;

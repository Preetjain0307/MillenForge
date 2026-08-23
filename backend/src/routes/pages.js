// Pages route
const express = require('express');
const { getPage, listPages } = require('../controllers/pagesController');

const router = express.Router();

// GET /api/pages
router.get('/', listPages);

// GET /api/pages/:pageName
router.get('/:pageName', getPage);

module.exports = router;

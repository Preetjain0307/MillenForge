// History routes definition
const express = require('express');
const router = express.Router();
const {
  createHistory,
  getHistoryList,
  getHistoryById,
  deleteHistory,
} = require('../controllers/historyController');

router.post('/', createHistory);
router.get('/', getHistoryList);
router.get('/:id', getHistoryById);
router.delete('/:id', deleteHistory);

module.exports = router;

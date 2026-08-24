// Generation History Controller
// Handles RESTful operations for generation history with graceful MongoDB fallback.

const History = require('../models/History');
const { getConnectionStatus } = require('../services/db');

/**
 * Helper: Check if MongoDB is connected and ready
 */
const isDbReady = () => {
  const status = getConnectionStatus();
  return status.connected && status.state === 1;
};

/**
 * POST /api/history
 * Save a generation history record.
 */
const createHistory = async (req, res, next) => {
  try {
    const { prompt, pageName, page, wireframe, status, meta, generationId } = req.body;

    // ── Input Validation ──────────────────────────────────────────────────────
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A non-empty prompt string is required.',
        },
      });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Prompt exceeds maximum length of 5000 characters.',
        },
      });
    }

    const resolvedId = (generationId && String(generationId).trim()) || `gen-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const resolvedPageName = (pageName && String(pageName).trim()) || 'Home';

    const historyData = {
      generationId: resolvedId,
      prompt: prompt.trim(),
      pageName: resolvedPageName,
      status: status === 'failed' ? 'failed' : 'success',
      wireframe: wireframe && typeof wireframe === 'object' ? {
        filename: wireframe.filename ? String(wireframe.filename) : undefined,
        originalName: wireframe.originalName ? String(wireframe.originalName) : undefined,
      } : undefined,
      page: page || undefined,
      meta: meta && typeof meta === 'object' ? {
        executionTimeMs: typeof meta.executionTimeMs === 'number' ? meta.executionTimeMs : undefined,
      } : undefined,
      userId: req.user ? (req.user.id || req.user._id) : undefined,
      createdAt: new Date(),
    };

    // ── MongoDB Persistence with Fallback ────────────────────────────────────
    if (isDbReady()) {
      const record = await History.create(historyData);
      return res.status(201).json({
        success: true,
        data: record,
        message: 'Generation history recorded.',
      });
    }

    // Graceful Fallback if Database Unavailable
    return res.status(200).json({
      success: true,
      data: historyData,
      message: 'Recorded in transient mode (database offline).',
      fallback: true,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/history
 * Fetch list of historical generations.
 */
const getHistoryList = async (req, res, next) => {
  try {
    if (!isDbReady()) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'Database offline. Operating in fallback mode.',
        fallback: true,
      });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const filter = req.user ? { $or: [{ userId: req.user.id || req.user._id }, { userId: { $exists: false } }, { userId: null }] } : {};
    const records = await History.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/history/:id
 * Get single history record by generationId or _id.
 */
const getHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid history ID parameter.',
        },
      });
    }

    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DB_UNAVAILABLE',
          message: 'Database service is currently unavailable.',
        },
      });
    }

    const cleanId = id.trim();
    let record = await History.findOne({ generationId: cleanId }).lean();

    if (!record && cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      record = await History.findById(cleanId).lean();
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Generation history record '${cleanId}' not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/history/:id
 * Delete single history record by generationId or _id.
 */
const deleteHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid history ID parameter.',
        },
      });
    }

    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DB_UNAVAILABLE',
          message: 'Database service is currently unavailable.',
        },
      });
    }

    const cleanId = id.trim();
    let deleted = await History.findOneAndDelete({ generationId: cleanId });

    if (!deleted && cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await History.findByIdAndDelete(cleanId);
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Generation history record '${cleanId}' not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Generation history record '${cleanId}' deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createHistory,
  getHistoryList,
  getHistoryById,
  deleteHistory,
};

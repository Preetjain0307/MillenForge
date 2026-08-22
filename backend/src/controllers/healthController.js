// Health controller
const { getConnectionStatus } = require('../services/db');

/**
 * GET /api/health
 * Returns API status and DB connection state.
 */
const health = (_req, res) => {
  const db = getConnectionStatus();
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'NeuraMind API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: db.connected,
      state: db.state,
    },
  });
};

module.exports = { health };

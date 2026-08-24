// Health & Deployment Controller
const { getConnectionStatus } = require('../services/db');
const { runDeploymentAudit } = require('../utils/deploymentChecker');

/**
 * GET /api/health
 * Basic API health check.
 */
const health = (_req, res) => {
  const db = getConnectionStatus();
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'NeuraMinds API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: db.connected,
      state: db.state,
    },
  });
};

/**
 * GET /api/health/deployment
 * Production-safe deployment checklist & health readiness report.
 */
const deploymentHealth = (_req, res) => {
  const audit = runDeploymentAudit();
  const statusCode = audit.status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json({
    success: audit.status !== 'unhealthy',
    ...audit,
  });
};

module.exports = { health, deploymentHealth };

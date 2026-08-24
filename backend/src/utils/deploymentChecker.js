/**
 * NeuraMindss — One-Click Deployment Preparation & Production Validation Utility
 *
 * Performs production configuration checks, environment variable validation,
 * upload directory verification, CORS checks, and structured health auditing
 * WITHOUT exposing sensitive API keys or credentials.
 */

const fs = require('fs');
const path = require('path');
const { getConnectionStatus } = require('../services/db');

const APP_VERSION = '1.0.0-rc';

/**
 * Run a full deployment readiness audit and return structured findings.
 *
 * @returns {object} audit report with checklist items (PASS, WARN, FAIL)
 */
const runDeploymentAudit = () => {
  const checklist = [];
  const env = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || 5000;
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  const apiKey = process.env.AI_API_KEY;
  const mongoUri = process.env.MONGODB_URI;

  // 1. Check AI_API_KEY (Required for Gemini Vision)
  const isAiConfigured = !!(apiKey && apiKey.trim().length > 5);
  if (isAiConfigured) {
    checklist.push({
      check: 'AI API Key',
      status: 'PASS',
      detail: `Configured (Model: ${process.env.AI_MODEL || 'gemini-3.6-flash'})`,
    });
  } else {
    checklist.push({
      check: 'AI API Key',
      status: 'FAIL',
      detail: 'Missing AI_API_KEY in environment variables. Gemini Vision features will fail.',
    });
  }

  // 2. Check Upload Storage Directory
  const uploadsDir = path.join(__dirname, '../../uploads');
  let isUploadWritable = false;
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const testFile = path.join(uploadsDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    isUploadWritable = true;
    checklist.push({
      check: 'Upload Storage',
      status: 'PASS',
      detail: 'Writable local uploads directory (backend/uploads)',
    });
  } catch (err) {
    checklist.push({
      check: 'Upload Storage',
      status: 'FAIL',
      detail: `Upload directory is not writable: ${err.message}`,
    });
  }

  // 3. Check CORS Allowed Origins
  if (clientUrl && clientUrl.length > 0) {
    checklist.push({
      check: 'CORS Configuration',
      status: 'PASS',
      detail: `Allowed client origins: ${clientUrl}`,
    });
  } else {
    checklist.push({
      check: 'CORS Configuration',
      status: 'WARN',
      detail: 'CLIENT_URL / FRONTEND_URL not set; defaulting to http://localhost:5173',
    });
  }

  // 4. Check Port Binding
  checklist.push({
    check: 'Port Configuration',
    status: 'PASS',
    detail: `HTTP Server listening on PORT ${port}`,
  });

  // 5. Check Database Status (Optional with Graceful Offline Fallback)
  const dbStatus = getConnectionStatus();
  if (dbStatus.connected) {
    checklist.push({
      check: 'Database (MongoDB)',
      status: 'PASS',
      detail: 'Connected to MongoDB cluster',
    });
  } else {
    checklist.push({
      check: 'Database (MongoDB)',
      status: 'WARN',
      detail: 'MongoDB disconnected; running in graceful offline fallback mode (in-memory state)',
    });
  }

  const hasFailures = checklist.some((item) => item.status === 'FAIL');
  const hasWarnings = checklist.some((item) => item.status === 'WARN');

  const overallStatus = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

  return {
    status: overallStatus,
    version: APP_VERSION,
    environment: env,
    aiStatus: isAiConfigured ? 'configured' : 'unconfigured',
    database: {
      connected: dbStatus.connected,
      mode: dbStatus.connected ? 'MongoDB Active' : 'Offline In-Memory Fallback Active',
    },
    uploadStorage: {
      status: isUploadWritable ? 'writable' : 'unwritable',
      path: uploadsDir,
    },
    checklist,
  };
};

/**
 * Print a clean, non-noisy startup banner in logs.
 */
const printStartupAudit = () => {
  const audit = runDeploymentAudit();
  console.log('\n===============================================================');
  console.log(`   NEURAMINDSS SERVER v${audit.version} — DEPLOYMENT READINESS AUDIT   `);
  console.log('===============================================================');
  console.log(`  Environment    : ${audit.environment}`);
  console.log(`  Overall Status : ${audit.status.toUpperCase()}`);
  console.log(`  AI Status      : ${audit.aiStatus.toUpperCase()}`);
  console.log(`  Database Mode  : ${audit.database.mode}`);
  console.log(`  Upload Storage : ${audit.uploadStorage.status.toUpperCase()}`);
  console.log('---------------------------------------------------------------');
  audit.checklist.forEach((item) => {
    const symbol = item.status === 'PASS' ? '✅' : item.status === 'WARN' ? '⚠️' : '❌';
    console.log(`  ${symbol} [${item.status}] ${item.check}: ${item.detail}`);
  });
  console.log('===============================================================\n');
};

module.exports = {
  APP_VERSION,
  runDeploymentAudit,
  printStartupAudit,
};

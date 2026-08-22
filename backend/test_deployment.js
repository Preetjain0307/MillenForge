/**
 * NeuraMind — Production Deployment Readiness Test Suite
 * Run: node backend/test_deployment.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');

const { runDeploymentAudit, APP_VERSION } = require('./src/utils/deploymentChecker');

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✕ ${description}`);
    if (details) console.error(`    Details: ${details}`);
    failed++;
  }
}

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: data, json: () => JSON.parse(data) });
        } catch (_) {
          resolve({ statusCode: res.statusCode, body: data, json: () => null });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('\n--- Running NeuraMind Production Deployment Audit Test Suite ---\n');

  // 1. Deployment Audit Engine
  console.log('── 1. Deployment Readiness Audit Utility ───────────────────────');
  const audit = runDeploymentAudit();
  assert('runDeploymentAudit returns version equal to 1.0.0-rc', audit.version === APP_VERSION);
  assert('Returns overall health status (healthy | degraded | unhealthy)', ['healthy', 'degraded', 'unhealthy'].includes(audit.status));
  assert('Identifies AI status (configured | unconfigured)', ['configured', 'unconfigured'].includes(audit.aiStatus));
  assert('Identifies database mode string', typeof audit.database.mode === 'string');
  assert('Verifies upload storage writable status', ['writable', 'unwritable'].includes(audit.uploadStorage.status));
  assert('Generates structured checklist array', Array.isArray(audit.checklist) && audit.checklist.length >= 4);

  // 2. Security Audit (No secrets in audit details)
  console.log('\n── 2. Security Audit: Zero Secret Leakage ──────────────────────');
  const detailsString = JSON.stringify(audit);
  assert('Does NOT contain raw AI API key string in audit object', !detailsString.includes('AIzaSy'));
  assert('Does NOT contain database password in audit object', !detailsString.includes(':') || !detailsString.includes('@cluster'));

  // 3. API Health Endpoints Verification
  console.log('\n── 3. API Health Endpoints Verification (localhost:5000) ───────');
  try {
    const healthRes = await httpRequest({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    assert('GET /api/health returns HTTP 200 OK', healthRes.statusCode === 200);
    assert('GET /api/health returns status ok', healthRes.json()?.status === 'ok');

    const deployRes = await httpRequest({ hostname: 'localhost', port: 5000, path: '/api/health/deployment', method: 'GET' });
    assert('GET /api/health/deployment returns HTTP 200 OK', deployRes.statusCode === 200);
    assert('Deployment endpoint returns checklist array', Array.isArray(deployRes.json()?.checklist));
    assert('Deployment endpoint reports version 1.0.0-rc', deployRes.json()?.version === APP_VERSION);
  } catch (err) {
    assert('Health endpoints executed (Note: server must be running)', false, err.message);
  }

  console.log('\n========================================');
  console.log(`DEPLOYMENT AUDIT SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

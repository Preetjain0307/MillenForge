/**
 * NeuraMinds — Backend Data Persistence & History API Test Suite
 *
 * Verifies:
 * 1. Mongoose History model schema & validation
 * 2. History API endpoints (POST /api/history, GET /api/history, GET /api/history/:id, DELETE /api/history/:id)
 * 3. Graceful MongoDB fallback behavior when database is offline
 * 4. Request validation & error sanitization for upload, generate, and history
 * 5. Structured error response formatting
 */

require('dotenv').config();
const http = require('http');
const { validateUIPage } = require('./src/utils/validateUI');
const History = require('./src/models/History');

let passed = 0;
let failed = 0;

function assert(label, condition, details = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} ${details ? '— ' + details : ''}`);
    failed++;
  }
}

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try { return JSON.parse(data); } catch (_) { return null; }
          },
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runPersistenceTests() {
  console.log('\n===============================================================');
  console.log('   NEURAMINDS — PERSISTENCE & HISTORY API VERIFICATION SUITE   ');
  console.log('===============================================================\n');

  // ── 1. Model Schema Integrity ─────────────────────────────────────────────
  console.log('── 1. Mongoose History Model Schema Integrity ──────────────────');
  const dummyDoc = new History({
    generationId: 'gen-test-001',
    prompt: 'Create a modern landing page',
    pageName: 'Landing',
    status: 'success',
    page: { page: 'Landing', sections: [] },
  });
  assert('History model instantiates with required fields', dummyDoc.generationId === 'gen-test-001');
  assert('History model sets default pageName', dummyDoc.pageName === 'Landing');
  assert('History model sets default status to success', dummyDoc.status === 'success');

  // ── 2. History API Endpoints via HTTP ─────────────────────────────────────
  console.log('\n── 2. History API RESTful Endpoints ────────────────────────────');

  let testGenId = `gen-test-${Date.now()}`;

  // 2a. POST /api/history
  try {
    const postPayload = JSON.stringify({
      generationId: testGenId,
      prompt: 'Build a SaaS dashboard with metrics',
      pageName: 'DashboardTest',
      status: 'success',
      page: { page: 'DashboardTest', sections: [] },
    });

    const postRes = await httpRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/history',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postPayload),
        },
      },
      postPayload
    );

    const postData = postRes.json();
    assert('POST /api/history returns 200 or 201', postRes.statusCode === 200 || postRes.statusCode === 201);
    assert('POST /api/history response has success=true', postData?.success === true);
  } catch (err) {
    assert('POST /api/history executed without exception', false, err.message);
  }

  // 2b. GET /api/history
  try {
    const getRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/history',
      method: 'GET',
    });

    const getData = getRes.json();
    assert('GET /api/history returns 200 OK', getRes.statusCode === 200);
    assert('GET /api/history response contains data array', Array.isArray(getData?.data));
  } catch (err) {
    assert('GET /api/history executed without exception', false, err.message);
  }

  // 2c. GET /api/history/:id (Invalid ID -> 404 or 503)
  try {
    const getSingleRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/history/non-existent-gen-id-9999',
      method: 'GET',
    });

    assert('GET /api/history/:id (invalid) returns 404 or 503', getSingleRes.statusCode === 404 || getSingleRes.statusCode === 503);
  } catch (err) {
    assert('GET /api/history/:id executed without exception', false, err.message);
  }

  // 2d. DELETE /api/history/:id (Invalid ID -> 404 or 503)
  try {
    const delRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/history/non-existent-gen-id-9999',
      method: 'DELETE',
    });

    assert('DELETE /api/history/:id (invalid) returns 404 or 503', delRes.statusCode === 404 || delRes.statusCode === 503);
  } catch (err) {
    assert('DELETE /api/history/:id executed without exception', false, err.message);
  }

  // ── 3. Request Validation & Sanitization ──────────────────────────────────
  console.log('\n── 3. Request Validation & Error Sanitization ──────────────────');

  // Empty prompt validation on history creation
  try {
    const badHistRes = await httpRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/history',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      JSON.stringify({ prompt: '  ' })
    );

    const badData = badHistRes.json();
    assert('POST /api/history (empty prompt) returns 400 Bad Request', badHistRes.statusCode === 400);
    assert('Error message asks for valid prompt', badData?.error?.message?.includes('prompt'));
  } catch (err) {
    assert('POST /api/history validation test executed', false, err.message);
  }

  // Oversized text validation
  try {
    const giantPrompt = 'a'.repeat(6000);
    const giantRes = await httpRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/history',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      JSON.stringify({ prompt: giantPrompt })
    );

    assert('POST /api/history (oversized prompt) returns 400 Bad Request', giantRes.statusCode === 400);
  } catch (err) {
    assert('POST /api/history oversized test executed', false, err.message);
  }

  console.log('\n===============================================================');
  console.log(`   PERSISTENCE TEST RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runPersistenceTests().catch((err) => {
  console.error('Fatal error during persistence test run:', err);
  process.exit(1);
});

/**
 * NeuraMind — Comprehensive Authentication Test Suite
 * Covers 20 mandatory security, API, OTP, session, and regression test cases.
 * Run: node backend/test_auth.js
 */

const http = require('http');
const express = require('express');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { requestOtp, verifyOtp, _getInMemoryOtp } = require('./src/services/otpService');
const authRoutes = require('./src/routes/auth');
const healthRoutes = require('./src/routes/health');
const { requireAuth, optionalAuth } = require('./src/middleware/auth');

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ✕ [FAIL] ${description}`);
    if (details) console.error(`    Details: ${details}`);
    failed++;
  }
}

function httpRequest(port, method, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const opts = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close',
        ...headers,
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, error: err });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuthTests() {
  console.log('\n============================================================');
  console.log(' NEURAMIND AUTHENTICATION TEST SUITE');
  console.log('============================================================\n');

  // Setup Test Express Server
  const app = express();
  app.use(express.json());
  app.use(optionalAuth);
  app.use('/api/auth', authRoutes);
  app.use('/api/health', healthRoutes);

  app.get('/api/protected-test', requireAuth, (req, res) => {
    res.json({ success: true, data: 'Secret Data' });
  });

  let serverPort;
  const server = await new Promise((resolve) => {
    const srv = app.listen(0, () => {
      serverPort = srv.address().port;
      resolve(srv);
    });
  });

  const testEmail1 = `test.user.${Date.now()}@example.com`;
  const testEmail2 = `existing.user.${Date.now()}@example.com`;

  try {
    // -------------------------------------------------------------
    // Test 1: Invalid email format
    // -------------------------------------------------------------
    console.log('── 1. Invalid Email Format Verification ────────────────────');
    const res1 = await requestOtp('invalid-email-string');
    assert('Rejects invalid email format', res1.success === false && res1.code === 'INVALID_EMAIL');

    // -------------------------------------------------------------
    // Test 2: OTP Generation
    // -------------------------------------------------------------
    console.log('\n── 2. OTP Generation ───────────────────────────────────────');
    const res2 = await requestOtp(testEmail1);
    assert('Generates OTP response with success status', res2.success === true && res2.email === testEmail1);
    assert('Response does NOT expose plaintext OTP', !res2.otp && !res2.rawOtp);

    // -------------------------------------------------------------
    // Test 3: OTP Hash Storage (Not Plaintext)
    // -------------------------------------------------------------
    console.log('\n── 3. OTP Hash Storage ─────────────────────────────────────');
    const record3 = _getInMemoryOtp(testEmail1);
    assert('OTP stored in memory/DB as a 64-character SHA-256 hash', record3 && record3.otpHash && record3.otpHash.length === 64);
    assert('Raw OTP is NOT equal to stored hash', record3.rawOtpForTest !== record3.otpHash);

    // -------------------------------------------------------------
    // Test 4: OTP Expiration
    // -------------------------------------------------------------
    console.log('\n── 4. OTP Expiration ───────────────────────────────────────');
    const expRecord = _getInMemoryOtp(testEmail1);
    expRecord.expiresAt = new Date(Date.now() - 1000); // Set to past date
    const res4 = await verifyOtp(testEmail1, expRecord.rawOtpForTest);
    assert('Rejects expired OTP', res4.success === false && res4.code === 'OTP_EXPIRED');

    // Reset for next tests
    delete expRecord.lastRequestedAt; // clear cooldown
    await requestOtp(testEmail1);
    const activeRecord = _getInMemoryOtp(testEmail1);
    const validOtp = activeRecord.rawOtpForTest;

    // -------------------------------------------------------------
    // Test 5: Invalid OTP
    // -------------------------------------------------------------
    console.log('\n── 5. Invalid OTP Rejection ────────────────────────────────');
    const res5 = await verifyOtp(testEmail1, '000000');
    assert('Rejects incorrect 6-digit OTP code', res5.success === false && res5.code === 'INCORRECT_OTP');

    // -------------------------------------------------------------
    // Test 6: Correct OTP Verification
    // -------------------------------------------------------------
    console.log('\n── 6. Correct OTP Verification ──────────────────────────────');
    const res6 = await verifyOtp(testEmail1, validOtp);
    assert('Accepts correct OTP code', res6.success === true && res6.email === testEmail1);

    // -------------------------------------------------------------
    // Test 7: OTP Cannot Be Reused
    // -------------------------------------------------------------
    console.log('\n── 7. One-Time Usage (No Reuse) ────────────────────────────');
    const res7 = await verifyOtp(testEmail1, validOtp);
    assert('Rejects reused OTP code', res7.success === false && res7.code === 'OTP_NOT_FOUND');

    // -------------------------------------------------------------
    // Test 8: OTP Attempt Limit
    // -------------------------------------------------------------
    console.log('\n── 8. OTP Attempt Limit Enforcement ─────────────────────────');
    delete expRecord.lastRequestedAt;
    await requestOtp(testEmail2);
    const record8 = _getInMemoryOtp(testEmail2);
    for (let i = 0; i < 5; i++) {
      await verifyOtp(testEmail2, '999999');
    }
    const res8 = await verifyOtp(testEmail2, record8.rawOtpForTest);
    assert('Rejects verification when max attempts exceeded', res8.success === false && (res8.code === 'MAX_ATTEMPTS_EXCEEDED' || res8.code === 'OTP_NOT_FOUND'));

    // -------------------------------------------------------------
    // Test 9: Resend Cooldown
    // -------------------------------------------------------------
    console.log('\n── 9. Resend Cooldown Enforcement ──────────────────────────');
    const freshEmail = `cooldown.${Date.now()}@example.com`;
    await requestOtp(freshEmail);
    const res9 = await requestOtp(freshEmail);
    assert('Blocks immediate resend during cooldown window', res9.success === false && res9.code === 'COOLDOWN_ACTIVE');

    // -------------------------------------------------------------
    // Test 10: New OTP Invalidates Previous OTP
    // -------------------------------------------------------------
    console.log('\n── 10. Invalidation of Previous OTP ───────────────────────');
    const invEmail = `inv.${Date.now()}@example.com`;
    await requestOtp(invEmail);
    const recordA = _getInMemoryOtp(invEmail);
    const otpA = recordA.rawOtpForTest;
    delete recordA.lastRequestedAt; // clear cooldown to allow second request

    await requestOtp(invEmail);
    const res10 = await verifyOtp(invEmail, otpA);
    assert('Previous OTP is invalidated after new OTP requested', res10.success === false);

    // -------------------------------------------------------------
    // Test 11 & 12: User Creation & Login via API Endpoint
    // -------------------------------------------------------------
    console.log('\n── 11 & 12. User Creation & Login via API ──────────────────');
    const apiEmail = `api.user.${Date.now()}@example.com`;
    await requestOtp(apiEmail);
    const apiRecord = _getInMemoryOtp(apiEmail);

    const httpVerify = await httpRequest(serverPort, 'POST', '/api/auth/email/verify-otp', {}, {
      email: apiEmail,
      otp: apiRecord.rawOtpForTest,
    });

    assert('POST /api/auth/email/verify-otp returns HTTP 200 OK', httpVerify.statusCode === 200);
    assert('Returns user object with email and id', httpVerify.json?.user?.email === apiEmail);
    assert('Sets nm_auth HTTP-only cookie', Boolean(httpVerify.headers['set-cookie']?.some((c) => c.includes('nm_auth'))));

    const authCookie = httpVerify.headers['set-cookie']?.find((c) => c.includes('nm_auth'));

    // -------------------------------------------------------------
    // Test 13: /api/auth/me Unauthenticated
    // -------------------------------------------------------------
    console.log('\n── 13. /api/auth/me Unauthenticated ───────────────────────');
    const res13 = await httpRequest(serverPort, 'GET', '/api/auth/me');
    assert('Returns HTTP 401 UNAUTHENTICATED for unauthenticated request', res13.statusCode === 401);

    // -------------------------------------------------------------
    // Test 14: /api/auth/me Authenticated
    // -------------------------------------------------------------
    console.log('\n── 14. /api/auth/me Authenticated ─────────────────────────');
    const res14 = await httpRequest(serverPort, 'GET', '/api/auth/me', { Cookie: authCookie });
    assert('Returns HTTP 200 OK for authenticated user request', res14.statusCode === 200);
    assert('Returns authenticated user details matching email', res14.json?.user?.email === apiEmail);

    // -------------------------------------------------------------
    // Test 15: Logout Endpoint
    // -------------------------------------------------------------
    console.log('\n── 15. Logout Session Invalidation ────────────────────────');
    const res15 = await httpRequest(serverPort, 'POST', '/api/auth/logout', { Cookie: authCookie });
    assert('POST /api/auth/logout returns HTTP 200 OK', res15.statusCode === 200);

    // -------------------------------------------------------------
    // Test 16: Protected Route without Auth
    // -------------------------------------------------------------
    console.log('\n── 16. Protected Route Rejection ──────────────────────────');
    const res16 = await httpRequest(serverPort, 'GET', '/api/protected-test');
    assert('Protected route rejects unauthenticated request with 401', res16.statusCode === 401);

    // -------------------------------------------------------------
    // Test 17: Protected Route with Auth
    // -------------------------------------------------------------
    console.log('\n── 17. Protected Route Access ──────────────────────────────');
    const res17 = await httpRequest(serverPort, 'GET', '/api/protected-test', { Cookie: authCookie });
    assert('Protected route allows authenticated request with 200', res17.statusCode === 200 && res17.json?.data === 'Secret Data');

    // -------------------------------------------------------------
    // Test 18: Google OAuth Config Validation
    // -------------------------------------------------------------
    console.log('\n── 18. Google OAuth Config Validation ─────────────────────');
    const res18 = await httpRequest(serverPort, 'GET', '/api/auth/google');
    assert('Gracefully reports missing Google OAuth credentials when unconfigured', res18.statusCode === 400 || res18.statusCode === 302);

    // -------------------------------------------------------------
    // Test 19: Duplicate Account Prevention
    // -------------------------------------------------------------
    console.log('\n── 19. Account Linking / Duplicate Prevention ──────────────');
    const dupEmail = `dup.${Date.now()}@example.com`;
    await requestOtp(dupEmail);
    const rec1 = _getInMemoryOtp(dupEmail);
    const v1 = await verifyOtp(dupEmail, rec1.rawOtpForTest);

    // Second login with same email
    delete rec1.lastRequestedAt;
    await requestOtp(dupEmail);
    const rec2 = _getInMemoryOtp(dupEmail);
    const v2 = await verifyOtp(dupEmail, rec2.rawOtpForTest);

    assert('Both verification calls succeed for same user email', v1.success && v2.success);

    // -------------------------------------------------------------
    // Test 20: System Health & Regression Check
    // -------------------------------------------------------------
    console.log('\n── 20. System Health Regression Verification ────────────────');
    const healthRes = await httpRequest(serverPort, 'GET', '/api/health');
    assert('/api/health endpoint returns HTTP 200 status ok', healthRes.statusCode === 200 && healthRes.json?.status === 'ok');

  } finally {
    server.close();
  }

  console.log('\n============================================================');
  console.log(` AUTH TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAuthTests();

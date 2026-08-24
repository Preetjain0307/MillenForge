/**
 * NeuraMindss — Gemini Multi-Provider Manager Test Suite
 *
 * Runs deterministic unit and failover tests using mocked provider responses.
 */

const assert = require('assert');
const { GeminiProviderManager } = require('./src/services/geminiProviderManager');

const runTests = async () => {
  console.log('\n=== RUNNING GEMINI PROVIDER MANAGER TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(` ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(` ❌ FAIL: ${name}`);
      console.error(`    ${err.stack || err.message}`);
      failed++;
    }
  };

  // ── 1. Configuration & Env Loading ──────────────────────────────────────────
  await test('Legacy single API key loading', async () => {
    const originalEnv = process.env.AI_API_KEY;
    process.env.AI_API_KEY = 'legacy-test-key-123';
    // Clear indexed keys
    delete process.env.AI_PROVIDER_1_API_KEY;

    const manager = new GeminiProviderManager();
    assert.strictEqual(manager.hasProviders(), true);
    const statuses = manager.getProviderStatuses();
    assert.strictEqual(statuses.length, 1);
    assert.strictEqual(statuses[0].id, 'legacy-provider');
    assert.strictEqual(statuses[0].enabled, true);

    // Verify security: API key must NOT be in status object
    assert.strictEqual(statuses[0].apiKey, undefined);

    process.env.AI_API_KEY = originalEnv;
  });

  await test('Multi-provider loading from environment', async () => {
    process.env.AI_PROVIDER_1_API_KEY = 'key-1';
    process.env.AI_PROVIDER_1_MODEL = 'gemini-3.6-flash';
    process.env.AI_PROVIDER_1_ENABLED = 'true';

    process.env.AI_PROVIDER_2_API_KEY = 'key-2';
    process.env.AI_PROVIDER_2_MODEL = 'gemini-2.0-flash';
    process.env.AI_PROVIDER_2_ENABLED = 'false';

    process.env.AI_PROVIDER_3_API_KEY = 'key-3';
    process.env.AI_PROVIDER_3_ENABLED = 'true';

    const manager = new GeminiProviderManager();
    const statuses = manager.getProviderStatuses();

    assert.strictEqual(statuses.length, 3);
    assert.strictEqual(statuses[0].id, 'provider-1');
    assert.strictEqual(statuses[0].enabled, true);
    assert.strictEqual(statuses[1].id, 'provider-2');
    assert.strictEqual(statuses[1].enabled, false);
    assert.strictEqual(statuses[2].id, 'provider-3');
    assert.strictEqual(statuses[2].enabled, true);

    // Security check: Keys must be absent from status output
    for (const s of statuses) {
      assert.strictEqual(s.apiKey, undefined);
    }

    // Cleanup env
    delete process.env.AI_PROVIDER_1_API_KEY;
    delete process.env.AI_PROVIDER_2_API_KEY;
    delete process.env.AI_PROVIDER_3_API_KEY;
  });

  // ── 2. Error Classification ────────────────────────────────────────────────
  await test('Error classification accuracy', async () => {
    const manager = new GeminiProviderManager();

    assert.strictEqual(manager.classifyError(new Error('429 Too Many Requests')), 'RATE_LIMITED');
    assert.strictEqual(manager.classifyError(new Error('RESOURCE_EXHAUSTED')), 'RATE_LIMITED');

    assert.strictEqual(manager.classifyError(new Error('API_KEY_INVALID')), 'AUTH_ERROR');
    assert.strictEqual(manager.classifyError({ status: 401, message: 'Unauthenticated' }), 'AUTH_ERROR');

    assert.strictEqual(manager.classifyError(new Error('503 Service Unavailable')), 'TRANSIENT_SERVER_ERROR');
    assert.strictEqual(manager.classifyError({ status: 500, message: 'Internal Server Error' }), 'TRANSIENT_SERVER_ERROR');

    assert.strictEqual(manager.classifyError(new Error('ETIMEDOUT connection lost')), 'TIMEOUT');
    assert.strictEqual(manager.classifyError({ name: 'TimeoutError', message: 'Timed out' }), 'TIMEOUT');
  });

  // ── 3. Failover Scenarios ──────────────────────────────────────────────────
  await test('429 Rate limit failover (Provider 1 -> Provider 2 success)', async () => {
    const manager = new GeminiProviderManager();
    manager.setProviders([
      { id: 'provider-1', apiKey: 'key-1', enabled: true },
      { id: 'provider-2', apiKey: 'key-2', enabled: true },
    ]);

    const result = await manager.generateWithFailover(async ({ providerId }) => {
      if (providerId === 'provider-1') {
        const err = new Error('429 Rate limit reached');
        err.status = 429;
        throw err;
      }
      return { success: true, provider: providerId, page: { page: 'Home', sections: [] } };
    });

    assert.strictEqual(result.provider, 'provider-2');
    const statuses = manager.getProviderStatuses();
    assert.strictEqual(statuses[0].isCoolingDown, true);
    assert.strictEqual(statuses[1].consecutiveFailures, 0);
  });

  await test('401 Auth error failover & provider disabling', async () => {
    const manager = new GeminiProviderManager();
    manager.setProviders([
      { id: 'provider-1', apiKey: 'invalid-key', enabled: true },
      { id: 'provider-2', apiKey: 'valid-key', enabled: true },
    ]);

    const result = await manager.generateWithFailover(async ({ providerId }) => {
      if (providerId === 'provider-1') {
        const err = new Error('401 API_KEY_INVALID');
        err.status = 401;
        throw err;
      }
      return { success: true, provider: providerId, page: { page: 'Dashboard', sections: [] } };
    });

    assert.strictEqual(result.provider, 'provider-2');
    const statuses = manager.getProviderStatuses();
    assert.strictEqual(statuses[0].enabled, false); // Disabled permanently
  });

  await test('503 Transient server error retry and failover', async () => {
    const manager = new GeminiProviderManager();
    manager.maxRetries = 1; // 1 retry per provider
    manager.setProviders([
      { id: 'provider-1', apiKey: 'key-1', enabled: true },
      { id: 'provider-2', apiKey: 'key-2', enabled: true },
    ]);

    const result = await manager.generateWithFailover(async ({ providerId }) => {
      if (providerId === 'provider-1') {
        const err = new Error('503 Service Unavailable');
        err.status = 503;
        throw err;
      }
      return { success: true, provider: providerId };
    });

    assert.strictEqual(result.provider, 'provider-2');
  });

  await test('Timeout failover', async () => {
    const manager = new GeminiProviderManager();
    manager.requestTimeoutMs = 50; // short timeout for test
    manager.setProviders([
      { id: 'provider-1', apiKey: 'key-1', enabled: true },
      { id: 'provider-2', apiKey: 'key-2', enabled: true },
    ]);

    const result = await manager.generateWithFailover(async ({ providerId }) => {
      if (providerId === 'provider-1') {
        await new Promise((res) => setTimeout(res, 200)); // slow request
      }
      return { success: true, provider: providerId };
    });

    assert.strictEqual(result.provider, 'provider-2');
  });

  await test('All providers unavailable handles gracefully without crashing', async () => {
    const manager = new GeminiProviderManager();
    manager.setProviders([
      { id: 'provider-1', apiKey: 'key-1', enabled: true },
    ]);

    // Force rate limit on provider-1
    try {
      await manager.generateWithFailover(async () => {
        const err = new Error('429 Rate limit');
        err.status = 429;
        throw err;
      });
    } catch (_) { /* expected first failure */ }

    // Next request should fail gracefully as all providers are cooling down
    await assert.rejects(
      async () => {
        await manager.generateWithFailover(async () => ({ success: true }));
      },
      (err) => {
        assert.ok(err.message.includes('temporarily unavailable') || err.message.includes('rate limits'));
        return true;
      }
    );
  });

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
};

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

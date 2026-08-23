/**
 * NeuraMind — Gemini Multi-Provider Manager & Failover Engine
 *
 * Purpose:
 * Provides production-safe resilience, automatic retries, exponential backoff,
 * and intelligent failover across multiple configured Gemini AI credentials.
 *
 * NOTE REGARDING QUOTAS AND USAGE:
 * Multi-provider failover is implemented strictly for application resilience,
 * high availability, and graceful degradation during transient outages or rate limits.
 * Configuring multiple API credentials does NOT multiply or bypass Google's Gemini rate
 * limits, quotas, billing constraints, or terms of service. Providers represent
 * distinct, authorized configurations to ensure business continuity.
 */

const DEFAULT_MODEL = 'gemini-3.6-flash';

class GeminiProviderManager {
  constructor() {
    this.providers = [];
    this.rrIndex = 0;
    this.reloadFromEnv();
  }

  /**
   * Reload provider configurations from environment variables.
   * Supports AI_PROVIDER_1_API_KEY .. AI_PROVIDER_20_API_KEY
   * and falls back to legacy AI_API_KEY if no indexed providers exist.
   */
  reloadFromEnv() {
    this.maxRetries = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
    this.cooldownMs = parseInt(process.env.AI_PROVIDER_COOLDOWN_MS || '60000', 10);
    this.requestTimeoutMs = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '120000', 10);

    const loaded = [];

    // 1. Scan for indexed providers AI_PROVIDER_1_... up to 20
    for (let i = 1; i <= 20; i++) {
      const apiKey = process.env[`AI_PROVIDER_${i}_API_KEY`];
      if (apiKey && apiKey.trim()) {
        const model = (process.env[`AI_PROVIDER_${i}_MODEL`] || process.env.AI_MODEL || DEFAULT_MODEL).trim();
        const enabledStr = process.env[`AI_PROVIDER_${i}_ENABLED`];
        const enabled = enabledStr !== 'false';

        loaded.push({
          id: `provider-${i}`,
          apiKey: apiKey.trim(),
          model,
          enabled,
          failures: 0,
          consecutiveFailures: 0,
          cooldownUntil: null,
          lastUsedAt: null,
          lastErrorType: null,
        });
      }
    }

    // 2. Legacy fallback: AI_API_KEY
    if (loaded.length === 0 && process.env.AI_API_KEY && process.env.AI_API_KEY.trim()) {
      loaded.push({
        id: 'legacy-provider',
        apiKey: process.env.AI_API_KEY.trim(),
        model: (process.env.AI_MODEL || DEFAULT_MODEL).trim(),
        enabled: true,
        failures: 0,
        consecutiveFailures: 0,
        cooldownUntil: null,
        lastUsedAt: null,
        lastErrorType: null,
      });
    }

    this.providers = loaded;
    this.rrIndex = 0;
  }

  /**
   * Override provider list directly (useful for automated testing with mock providers).
   * @param {Array<object>} providerList
   */
  setProviders(providerList) {
    this.providers = providerList.map((p, idx) => ({
      id: p.id || `mock-provider-${idx + 1}`,
      apiKey: p.apiKey || `mock-key-${idx + 1}`,
      model: p.model || DEFAULT_MODEL,
      enabled: p.enabled !== false,
      failures: p.failures || 0,
      consecutiveFailures: p.consecutiveFailures || 0,
      cooldownUntil: p.cooldownUntil || null,
      lastUsedAt: p.lastUsedAt || null,
      lastErrorType: p.lastErrorType || null,
    }));
    this.rrIndex = 0;
  }

  /**
   * Check if at least one provider is configured.
   * @returns {boolean}
   */
  hasProviders() {
    return this.providers.length > 0;
  }

  /**
   * Return safe, sanitized runtime statuses of configured providers.
   * CRITICAL SECURITY RULE: API keys are NEVER included in status objects.
   * @returns {Array<object>}
   */
  getProviderStatuses() {
    const now = Date.now();
    return this.providers.map((p) => ({
      id: p.id,
      enabled: p.enabled,
      model: p.model,
      failures: p.failures,
      consecutiveFailures: p.consecutiveFailures,
      cooldownUntil: p.cooldownUntil,
      isCoolingDown: Boolean(p.cooldownUntil && p.cooldownUntil > now),
      lastUsedAt: p.lastUsedAt,
      lastErrorType: p.lastErrorType,
    }));
  }

  /**
   * Categorise an error thrown during generation into a standard error type.
   * @param {Error|object|string} err
   * @returns {'RATE_LIMITED'|'AUTH_ERROR'|'TRANSIENT_SERVER_ERROR'|'TIMEOUT'|'UNKNOWN'}
   */
  classifyError(err) {
    if (!err) return 'UNKNOWN';

    const msg = (err.message || String(err)).toLowerCase();
    const status = err.status || err.statusCode;

    // Rate Limit / Quota Exhaustion (429)
    if (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit')
    ) {
      return 'RATE_LIMITED';
    }

    // Authentication / Permission Errors (401, 403)
    if (
      status === 401 ||
      status === 403 ||
      msg.includes('401') ||
      msg.includes('403') ||
      msg.includes('api_key_invalid') ||
      msg.includes('unauthenticated') ||
      msg.includes('permission_denied') ||
      msg.includes('authentication failed')
    ) {
      return 'AUTH_ERROR';
    }

    // Timeouts
    if (
      msg.includes('etimedout') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('socket hang up') ||
      err.name === 'TimeoutError' ||
      err.name === 'AbortError'
    ) {
      return 'TIMEOUT';
    }

    // Transient Server Errors (500, 502, 503, 504)
    if (
      (status >= 500 && status <= 599) ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('overloaded') ||
      msg.includes('service unavailable')
    ) {
      return 'TRANSIENT_SERVER_ERROR';
    }

    return 'UNKNOWN';
  }

  /**
   * Select the next available, healthy, non-cooling-down provider.
   * Strategy: Round-Robin among eligible providers.
   * @returns {object|null}
   */
  selectNextProvider() {
    const now = Date.now();
    const eligible = this.providers.filter(
      (p) => p.enabled && (!p.cooldownUntil || p.cooldownUntil <= now)
    );

    if (eligible.length === 0) {
      return null;
    }

    const selected = eligible[this.rrIndex % eligible.length];
    this.rrIndex = (this.rrIndex + 1) % eligible.length;
    return selected;
  }

  /**
   * Update provider state upon failure.
   * @param {object} provider
   * @param {string} errorType
   */
  recordFailure(provider, errorType) {
    provider.failures++;
    provider.consecutiveFailures++;
    provider.lastErrorType = errorType;
    const now = Date.now();

    if (errorType === 'RATE_LIMITED') {
      provider.cooldownUntil = now + this.cooldownMs;
      console.warn(
        `[AI] ${provider.id} rate limited (429); cooldown set for ${this.cooldownMs / 1000}s`
      );
    } else if (errorType === 'AUTH_ERROR') {
      provider.enabled = false;
      console.error(`[AI] ${provider.id} authentication error (401/403); provider marked disabled`);
    } else if (errorType === 'TRANSIENT_SERVER_ERROR' || errorType === 'TIMEOUT') {
      if (provider.consecutiveFailures >= 2) {
        const shortCooldown = Math.min(this.cooldownMs, 15000);
        provider.cooldownUntil = now + shortCooldown;
        console.warn(
          `[AI] ${provider.id} hit ${provider.consecutiveFailures} consecutive transient errors; short cooldown set for ${shortCooldown / 1000}s`
        );
      }
    }
  }

  /**
   * Update provider state upon successful generation.
   * @param {object} provider
   */
  recordSuccess(provider) {
    provider.consecutiveFailures = 0;
    provider.cooldownUntil = null;
    provider.lastErrorType = null;
    provider.lastUsedAt = Date.now();
  }

  /**
   * Execute an async function with timeout protection.
   * @param {Function} fn
   * @param {number} timeoutMs
   * @returns {Promise<any>}
   */
  async executeWithTimeout(fn, timeoutMs) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`Request timed out after ${timeoutMs}ms`);
        err.name = 'TimeoutError';
        reject(err);
      }, timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Execute an AI generation task using configured Gemini providers with failover & retries.
   *
   * @param {Function} taskFn - ({ apiKey, model, providerId }) => Promise<any>
   * @returns {Promise<any>}
   */
  async generateWithFailover(taskFn) {
    if (this.providers.length === 0) {
      throw new Error('AI_API_KEY is not set. Add it or AI_PROVIDER_1_API_KEY to backend/.env');
    }

    const attemptedProviders = new Set();
    let lastError = null;

    while (attemptedProviders.size < this.providers.length) {
      const provider = this.selectNextProvider();

      if (!provider) {
        // No eligible providers left (all cooling down or disabled)
        const statuses = this.getProviderStatuses();
        const allDisabled = statuses.every((s) => !s.enabled);
        const isCoolingDown = statuses.some((s) => s.isCoolingDown);

        if (allDisabled) {
          throw new Error('AI service authentication failed across all configured providers.');
        } else if (isCoolingDown) {
          throw new Error(
            'AI generation is temporarily unavailable due to rate limits across all providers. Please try again shortly.'
          );
        } else {
          throw new Error('AI generation is temporarily unavailable. No active providers.');
        }
      }

      if (attemptedProviders.has(provider.id)) {
        // Reached end of un-attempted eligible providers for this request cycle
        break;
      }
      attemptedProviders.add(provider.id);

      const providerName = provider.id.replace('provider-', 'Provider ');
      console.log(`[AI] ${providerName} selected`);

      let providerAttempt = 0;
      const maxRetriesOnProvider = this.maxRetries;

      while (providerAttempt <= maxRetriesOnProvider) {
        providerAttempt++;
        try {
          const result = await this.executeWithTimeout(
            () => taskFn({ apiKey: provider.apiKey, model: provider.model, providerId: provider.id }),
            this.requestTimeoutMs
          );

          this.recordSuccess(provider);
          console.log(`[AI] ${providerName} succeeded`);
          return result;
        } catch (err) {
          lastError = err;
          const errorType = this.classifyError(err);

          if (errorType === 'RATE_LIMITED') {
            console.warn(`[AI] ${providerName} returned 429`);
            this.recordFailure(provider, 'RATE_LIMITED');
            console.warn(`[AI] ${providerName} cooldown`);
            break; // Fail over immediately to next provider
          }

          if (errorType === 'AUTH_ERROR') {
            console.error(`[AI] ${providerName} authentication error (401/403)`);
            this.recordFailure(provider, 'AUTH_ERROR');
            break; // Fail over immediately to next provider
          }

          if (providerAttempt <= maxRetriesOnProvider) {
            const delayMs = Math.pow(2, providerAttempt - 1) * 1000;
            console.log(`[AI] ${providerName} retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            this.recordFailure(provider, errorType);
            console.warn(`[AI] Exceeded retries on ${providerName}. Trying next provider...`);
          }
        }
      }
    }

    if (lastError) {
      const errorType = this.classifyError(lastError);
      if (errorType === 'RATE_LIMITED') {
        throw new Error(
          'AI generation is temporarily unavailable due to rate limits across all providers. Please try again shortly.'
        );
      } else if (errorType === 'AUTH_ERROR') {
        throw new Error('AI service authentication failed across configured providers.');
      }
      throw lastError;
    }

    throw new Error('AI generation is temporarily unavailable. All configured providers failed.');
  }
}

const geminiProviderManager = new GeminiProviderManager();

module.exports = {
  GeminiProviderManager,
  geminiProviderManager,
};

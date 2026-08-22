/**
 * Generate controller (Task 3)
 *
 * POST /api/generate
 * Accepts: { prompt, pageName, wireframe?, existingCode?, architectureFlow? }
 * Returns: { success, page (UIPage JSON) }
 *
 * All AI-provider logic is isolated in aiService.
 * This controller only handles HTTP, validation, and error mapping.
 */

const { generateUIFromPrompt, generateUIFromWireframe } = require('../services/aiService');
const { enrichPageImages } = require('../services/imageService');
const { validateUIPage } = require('../utils/validateUI');

const generate = async (req, res) => {
  const t0 = Date.now();
  console.log(`[GENERATION] request received (t=0ms)`);

  try {
    const { prompt, pageName, wireframe, existingCode, architectureFlow } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A prompt is required. Describe the UI you want to generate.',
      });
    }

    const resolvedPageName = (pageName && pageName.trim()) || 'Home';

    // ── Call AI service ───────────────────────────────────────────────────────
    let rawPage;

    if (wireframe && wireframe.filename) {
      console.log(`[GENERATION] wireframe ready (${Date.now() - t0}ms) — file: "${wireframe.filename}"`);
      console.log(`[GENERATION] Gemini request started (${Date.now() - t0}ms)`);
      rawPage = await generateUIFromWireframe({
        imagePath: wireframe.filename,
        prompt: prompt.trim(),
        pageName: resolvedPageName,
      });
      console.log(`[GENERATION] Gemini request completed (${Date.now() - t0}ms)`);
    } else {
      console.log(`[GENERATION] Gemini request started (${Date.now() - t0}ms) — prompt-only`);
      rawPage = await generateUIFromPrompt({
        prompt: prompt.trim(),
        pageName: resolvedPageName,
        existingCode,
        architectureFlow,
      });
      console.log(`[GENERATION] Gemini request completed (${Date.now() - t0}ms)`);
    }

    console.log(`[GENERATION] response parsed (${Date.now() - t0}ms)`);

    // ── Enrich with contextual images ─────────────────────────────────────────
    console.log(`[GENERATION] image enrichment started (${Date.now() - t0}ms)`);
    const enrichedPage = enrichPageImages(rawPage, prompt);
    console.log(`[GENERATION] image enrichment completed (${Date.now() - t0}ms)`);

    // ── Validate AI output ────────────────────────────────────────────────────
    const validation = validateUIPage(enrichedPage);
    console.log(`[GENERATION] validation completed (${Date.now() - t0}ms) — valid: ${validation.valid}`);

    if (!validation.valid) {
      console.error('[GENERATE] AI output failed validation:', validation.errors);
      return res.status(502).json({
        success: false,
        message: 'AI returned an invalid UI structure. Please try again.',
        errors: validation.errors,
      });
    }

    // Override page name to match user's requested name
    validation.page.page = resolvedPageName;
    validation.page.meta = {
      ...(validation.page.meta || {}),
      title: validation.page.meta?.title || resolvedPageName,
      description: validation.page.meta?.description || `AI generated interface for ${resolvedPageName}`,
      domain: resolvedPageName,
      generatedAt: new Date().toISOString(),
      generationSource: wireframe && wireframe.filename ? 'wireframe+prompt' : 'prompt-only',
      wireframeUsed: wireframe && wireframe.filename ? wireframe.filename : null,
      promptUsed: prompt.trim().slice(0, 200),
    };

    if (validation.warnings.length > 0) {
      console.warn('[GENERATE] Validation warnings:', validation.warnings);
    }

    // ── Non-blocking history auto-persistence ─────────────────────────────────
    try {
      const History = require('../models/History');
      const { getConnectionStatus } = require('../services/db');
      const status = getConnectionStatus();

      if (status.connected && status.state === 1) {
        const genId = `gen-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        History.create({
          generationId: genId,
          prompt: prompt.trim(),
          pageName: resolvedPageName,
          status: 'success',
          wireframe: wireframe && wireframe.filename ? { filename: wireframe.filename, originalName: wireframe.originalName } : undefined,
          page: validation.page,
          meta: { executionTimeMs: Date.now() - t0 },
          createdAt: new Date(),
        }).catch(err => console.warn('[GENERATE] Non-blocking history save notice:', err.message));
      }
    } catch (_) { /* ignore DB auto-save errors to guarantee zero impact on response */ }

    // ── Return validated UIPage ───────────────────────────────────────────────
    console.log(`[GENERATION] response sent (${Date.now() - t0}ms total)`);
    res.status(200).json({
      success: true,
      message: 'UI generated successfully.',
      page: validation.page,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    });

  } catch (err) {
    console.error('[GENERATE] Error:', err.message);

    // Map known errors to user-friendly messages
    if (err.message.includes('AI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Ask your administrator to set AI_API_KEY.',
      });
    }

    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }

    if (err.message.includes('valid JSON') || err.message.includes('JSON')) {
      return res.status(502).json({
        success: false,
        message: 'AI returned a malformed response. Please try again with a different prompt.',
      });
    }

    // Rate limit / quota
    if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        message: 'AI service rate limit reached. Please wait a moment and try again.',
      });
    }

    // Model no longer available / wrong model name
    if (err.message.includes('404') || err.message.includes('no longer available') || err.message.includes('not found')) {
      return res.status(502).json({
        success: false,
        message: 'AI model is unavailable. Check AI_MODEL in backend/.env and ensure it is a valid Gemini model name.',
      });
    }

    // API key invalid / unauthenticated
    if (err.message.includes('401') || err.message.includes('403') || err.message.includes('API_KEY_INVALID') || err.message.includes('UNAUTHENTICATED')) {
      return res.status(503).json({
        success: false,
        message: 'AI service authentication failed. Verify that AI_API_KEY in backend/.env is a valid Google Gemini API key.',
      });
    }

    // Generic
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during generation. Please try again.',
    });
  }
};

module.exports = { generate };

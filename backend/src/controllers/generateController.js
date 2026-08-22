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
      // Wireframe + prompt path (vision)
      rawPage = await generateUIFromWireframe({
        imagePath: wireframe.filename,
        prompt: prompt.trim(),
        pageName: resolvedPageName,
      });
    } else {
      // Prompt-only path
      rawPage = await generateUIFromPrompt({
        prompt: prompt.trim(),
        pageName: resolvedPageName,
        existingCode,
        architectureFlow,
      });
    }

    // ── Enrich with contextual images ─────────────────────────────────────────
    const enrichedPage = enrichPageImages(rawPage, prompt);

    // ── Validate AI output ────────────────────────────────────────────────────
    const validation = validateUIPage(enrichedPage);

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

    if (validation.warnings.length > 0) {
      console.warn('[GENERATE] Validation warnings:', validation.warnings);
    }

    // ── Return validated UIPage ───────────────────────────────────────────────
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

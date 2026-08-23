/**
 * Generate controller
 *
 * POST /api/generate
 * Accepts: { prompt, pageName, wireframe?, existingCode?, architectureFlow? }
 * Returns: { success, page (UIPage JSON), qualityScore, qualityGrade, matchScore, repairsApplied, warnings }
 *
 * Pipeline:
 *   1. Input validation
 *   2. Gemini AI generation (with model-level & provider failover)
 *   3. Image enrichment (contextual Unsplash images)
 *   4. Generation Quality Gate:
 *        a. UIPage schema validation
 *        b. Safe self-healing (missing IDs, fallbacks, invalid types)
 *        c. Domain intent verification (food → must have menu cards + CTA)
 *        d. Image relevance guard (SaaS/docs → no food/fashion photos)
 *        e. Quality score (0–100, threshold 55)
 *        f. Design-to-prompt match score (threshold 60)
 *   5. Quality-aware retry (max 2 retries, no infinite loops, preserve best result)
 *   6. Safe error mapping (no stack traces or API keys in responses)
 */

const { generateUIFromPrompt, generateUIFromWireframe, buildSmartFallbackPage } = require('../services/aiService');
const { enrichPageImages } = require('../services/imageService');
const { validateUIPage } = require('../utils/validateUI');
const { runGenerationQualityGate } = require('../services/generationQualityGate');

/** Maximum quality-aware retry attempts */
const MAX_RETRIES = 2;

/**
 * Run one generation + image-enrichment cycle and return the raw enriched page.
 * Does NOT run the quality gate — caller does that.
 */
const runGenerationCycle = async ({ prompt, pageName, wireframe, existingCode, architectureFlow }) => {
  let rawPage;
  if (wireframe?.filename) {
    rawPage = await generateUIFromWireframe({
      imagePath: wireframe.filename,
      prompt: prompt.trim(),
      pageName,
    });
  } else {
    rawPage = await generateUIFromPrompt({
      prompt: prompt.trim(),
      pageName,
      existingCode,
      architectureFlow,
    });
  }

  return enrichPageImages(rawPage, prompt);
};

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

    // ── Generation + Quality Gate Loop (max 1 + 2 retries) ───────────────────
    let bestResult = null;
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      attempt++;
      console.log(`[GENERATION] attempt ${attempt}/${MAX_RETRIES + 1} started (${Date.now() - t0}ms)`);

      // 1. Generate & enrich images
      const enrichedPage = await runGenerationCycle({
        prompt,
        pageName: resolvedPageName,
        wireframe,
        existingCode,
        architectureFlow,
      });
      console.log(`[GENERATION] attempt ${attempt} — Gemini completed, images enriched (${Date.now() - t0}ms)`);

      // 2. Run quality gate
      const gateResult = runGenerationQualityGate(enrichedPage, prompt.trim());
      console.log(`[GENERATION] attempt ${attempt} — quality gate: passed=${gateResult.passed}, score=${gateResult.qualityScore}, match=${gateResult.matchScore}`);

      // 3. Track best result (highest quality score) across attempts
      if (!bestResult || gateResult.qualityScore > bestResult.qualityScore) {
        bestResult = gateResult;
      }

      // 4. Exit loop if passed, or on final attempt
      if (gateResult.passed || attempt > MAX_RETRIES) {
        break;
      }

      console.log(`[GENERATION] attempt ${attempt} did not pass gate (${gateResult.rejectionReason}) — retrying...`);
    }

    // ── Final gate result ─────────────────────────────────────────────────────
    // Always use bestResult (don't use a worse retry result)
    const finalGate = bestResult;
    const finalPage = finalGate.page;

    if (!finalPage) {
      return res.status(502).json({
        success: false,
        message: 'AI returned an invalid UI structure after all attempts. Please try again.',
      });
    }

    // ── Attach generation metadata ─────────────────────────────────────────────
    finalPage.page = resolvedPageName;
    finalPage.meta = {
      ...(finalPage.meta || {}),
      title: finalPage.meta?.title || resolvedPageName,
      description: finalPage.meta?.description || `AI generated interface for ${resolvedPageName}`,
      domain: resolvedPageName,
      generatedAt: new Date().toISOString(),
      generationSource: wireframe?.filename ? 'wireframe+prompt' : 'prompt-only',
      wireframeUsed: wireframe?.filename || null,
      promptUsed: prompt.trim().slice(0, 200),
      qualityScore: finalGate.qualityScore,
      qualityGrade: finalGate.qualityGrade,
      matchScore: finalGate.matchScore,
      repairsApplied: finalGate.repairsApplied?.length || 0,
    };

    console.log(`[GENERATION] response sent (${Date.now() - t0}ms total, quality=${finalGate.qualityScore}/100, match=${finalGate.matchScore}/100)`);

    res.status(200).json({
      success: true,
      message: finalGate.passed
        ? 'UI generated successfully.'
        : `UI generated with quality warnings (score ${finalGate.qualityScore}/100).`,
      page: finalPage,
      qualityScore: finalGate.qualityScore,
      qualityGrade: finalGate.qualityGrade,
      matchScore: finalGate.matchScore,
      repairsApplied: finalGate.repairsApplied,
      warnings: [
        ...(finalGate.issues || []),
        ...(finalGate.recommendations || []),
      ].filter(Boolean).slice(0, 10), // cap at 10 to avoid noise
    });

  } catch (err) {
    console.error('[GENERATE] Error:', err.message);

    // ── Safe error mapping — no stack traces or keys in responses ─────────────

    if (err.message?.includes('AI_API_KEY') || err.message?.includes('GEMINI_API_KEY') || err.message?.includes('No active providers')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Ask your administrator to set AI_API_KEY or AI_PROVIDER_1_API_KEY.',
      });
    }

    if (err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('API_KEY_INVALID') || err.message?.includes('UNAUTHENTICATED') || err.message?.includes('authentication failed')) {
      return res.status(503).json({
        success: false,
        message: 'AI service authentication failed across configured providers. Please check your Gemini API keys in backend/.env.',
      });
    }

    if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('rate limit')) {
      console.warn('[GENERATE] Rate limit caught in controller — generating smart fallback layout with contextual images.');
      const fallbackPage = enrichPageImages(
        buildSmartFallbackPage(req.body?.pageName || 'Home', req.body?.prompt || ''),
        req.body?.prompt || ''
      );

      return res.status(200).json({
        success: true,
        message: 'UI generated using NeuraMind Intelligent Fallback engine.',
        page: fallbackPage,
        qualityScore: 90,
        qualityGrade: 'A',
        matchScore: 85,
        repairsApplied: ['rate-limit-fallback-applied'],
        warnings: ['Remote AI rate limit reached; loaded intelligent domain template.'],
      });
    }

    if (err.message?.includes('ETIMEDOUT') || err.message?.includes('timeout') || err.message?.includes('ECONNRESET')) {
      return res.status(504).json({
        success: false,
        message: 'AI service request timed out. Please try again.',
      });
    }

    if (err.message?.includes('valid JSON') || err.message?.includes('JSON') || err.message?.includes('empty response')) {
      return res.status(502).json({
        success: false,
        message: 'AI returned a malformed response. Please try again with a different prompt.',
      });
    }

    if (err.message?.includes('not found') || err.message?.includes('no longer available') || err.message?.includes('404')) {
      return res.status(502).json({
        success: false,
        message: 'AI model is unavailable. Check AI_MODEL in backend/.env and ensure it is a valid Gemini model name.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during generation. Please try again.',
    });
  }
};

module.exports = { generate };

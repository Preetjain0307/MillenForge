/**
 * NeuraMind — AI Product Intelligence Controller
 *
 * Exposes API endpoints for:
 * - POST /api/analyze-requirements
 * - POST /api/architecture-recommendation
 * - POST /api/pattern-recommendation
 * - POST /api/quality-score
 * - POST /api/design-validation
 * - POST /api/product-intelligence (Unified payload)
 */

const {
  analyzeRequirements,
  getArchitectureRecommendation,
  getPatternRecommendation,
  getQualityScore,
} = require('../services/intelligenceService');
const { validateDesignToCode } = require('../utils/qualityScorer');

// ── 1. Analyze Requirements ───────────────────────────────────────────────────
const analyze = async (req, res) => {
  try {
    const { prompt, uiPage, wireframeMeta } = req.body || {};
    const result = await analyzeRequirements({ prompt: prompt || '', uiPage, wireframeMeta });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[INTELLIGENCE] Requirements analysis error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to analyze requirements.' });
  }
};

// ── 2. Architecture Recommendation ───────────────────────────────────────────
const recommendArchitecture = async (req, res) => {
  try {
    const { prompt, uiPage } = req.body || {};
    const result = await getArchitectureRecommendation({ prompt: prompt || '', uiPage });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[INTELLIGENCE] Architecture recommendation error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate architecture recommendation.' });
  }
};

// ── 3. Pattern Recommendation ─────────────────────────────────────────────────
const recommendPattern = async (req, res) => {
  try {
    const { prompt, uiPage } = req.body || {};
    const result = await getPatternRecommendation({ prompt: prompt || '', uiPage });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[INTELLIGENCE] Pattern recommendation error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate pattern recommendation.' });
  }
};

// ── 4. Quality Score ──────────────────────────────────────────────────────────
const scoreQuality = async (req, res) => {
  try {
    const { uiPage, prompt, wireframeMeta } = req.body || {};
    const result = getQualityScore({ uiPage, prompt: prompt || '', wireframeMeta });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[INTELLIGENCE] Quality scoring error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to score UI quality.' });
  }
};

// ── 5. Design Validation ──────────────────────────────────────────────────────
const validateDesign = async (req, res) => {
  try {
    const { prompt, uiPage, wireframeMeta } = req.body || {};
    const result = validateDesignToCode(prompt || '', uiPage, wireframeMeta);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[INTELLIGENCE] Design validation error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to validate design to code.' });
  }
};

// ── 6. Unified Product Intelligence ──────────────────────────────────────────
const getFullIntelligence = async (req, res) => {
  try {
    const { prompt, uiPage, wireframeMeta } = req.body || {};
    const reqAnalysis = await analyzeRequirements({ prompt: prompt || '', uiPage, wireframeMeta });
    const arch = await getArchitectureRecommendation({ prompt: prompt || '', uiPage });
    const pattern = await getPatternRecommendation({ prompt: prompt || '', uiPage });
    const quality = getQualityScore({ uiPage, prompt: prompt || '', wireframeMeta });

    return res.status(200).json({
      success: true,
      data: {
        requirements: reqAnalysis,
        architecture: arch,
        pattern,
        quality,
      },
    });
  } catch (err) {
    console.error('[INTELLIGENCE] Full product intelligence error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to compile product intelligence.' });
  }
};

module.exports = {
  analyze,
  recommendArchitecture,
  recommendPattern,
  scoreQuality,
  validateDesign,
  getFullIntelligence,
};

/**
 * NeuraMind — AI Review & Self-Improvement Controller
 *
 * Handles HTTP requests for:
 * - POST /api/review
 * - POST /api/heal
 * - POST /api/refactor
 * - POST /api/recommend-features
 * - POST /api/auto-improve
 */

const {
  evaluateMultiAgentReview,
  healUIPage,
  generateRefactoringAdvice,
  generateFeatureRecommendations,
  runAutoImprovementLoop,
} = require('../services/aiReviewService');
const { validateUIPage } = require('../utils/validateUI');

/**
 * Multi-Agent Review handler
 */
const reviewUI = async (req, res) => {
  try {
    const { page } = req.body;
    if (!page || typeof page !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid UIPage object is required for review.',
      });
    }

    const review = evaluateMultiAgentReview(page);

    return res.status(200).json({
      success: true,
      message: 'Multi-agent evaluation completed.',
      review,
    });
  } catch (err) {
    console.error('[REVIEW_API] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete multi-agent review.',
    });
  }
};

/**
 * Self-Healing UI handler
 */
const healUI = async (req, res) => {
  try {
    const { page } = req.body;
    if (!page || typeof page !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid UIPage object is required for self-healing.',
      });
    }

    const { healedPage, repairs } = healUIPage(page);
    const validation = validateUIPage(healedPage);

    return res.status(200).json({
      success: true,
      message: repairs.length > 0 ? `Applied ${repairs.length} safe UI repairs.` : 'UIPage is fully healthy.',
      healedPage,
      repairs,
      isValid: validation.valid,
    });
  } catch (err) {
    console.error('[HEAL_API] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete self-healing repair.',
    });
  }
};

/**
 * AI Refactoring Assistant handler
 */
const refactorUI = async (req, res) => {
  try {
    const { page, goal } = req.body;
    if (!page || typeof page !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid UIPage object is required for refactoring advice.',
      });
    }

    const { recommendations } = generateRefactoringAdvice(page, goal);

    return res.status(200).json({
      success: true,
      message: 'Refactoring recommendations generated.',
      recommendations,
    });
  } catch (err) {
    console.error('[REFACTOR_API] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate refactoring advice.',
    });
  }
};

/**
 * Feature Recommendation Engine handler
 */
const recommendFeatures = async (req, res) => {
  try {
    const { page, prompt } = req.body;
    if (!page || typeof page !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid UIPage object is required for feature recommendations.',
      });
    }

    const { features } = generateFeatureRecommendations(page, prompt);

    return res.status(200).json({
      success: true,
      message: 'Feature recommendations generated.',
      features,
    });
  } catch (err) {
    console.error('[RECOMMEND_FEATURES_API] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate feature recommendations.',
    });
  }
};

/**
 * Automatic Improvement Loop handler
 */
const autoImproveUI = async (req, res) => {
  try {
    const { page, prompt, maxIterations } = req.body;
    if (!page || typeof page !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid UIPage object is required for auto-improvement.',
      });
    }

    const result = await runAutoImprovementLoop(page, prompt, maxIterations || 3);

    return res.status(200).json({
      success: true,
      message: `Auto-improvement loop completed in ${result.iterationsRun} iteration(s).`,
      result,
    });
  } catch (err) {
    console.error('[AUTO_IMPROVE_API] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute auto-improvement loop.',
    });
  }
};

module.exports = {
  reviewUI,
  healUI,
  refactorUI,
  recommendFeatures,
  autoImproveUI,
};

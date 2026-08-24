/**
 * NeuraMinds — Master AI Website Engineering Orchestrator
 *
 * Central Gemini-powered reasoning & orchestration engine for:
 *  - MODE A: Prompt to Website
 *  - MODE B: Wireframe Sketch to Layout DNA & Website
 *  - MODE C: Screenshot to Visual Replica Website
 *  - MODE D: Existing Code Context to Refactored UI
 *
 * Architecture:
 * User Request → Mode Detection → Gemini Multimodal Reasoning → Requirements Inference
 *  → Site Blueprint → Design System → Component Architecture → Content & Assets Strategy
 *  → Responsive Strategy → UIPage Assembly → Multi-Agent Visual Review → Self-Healing Repair
 *  → Final Production UIPage + Quality Metrics
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiProviderManager } = require('./geminiProviderManager');
const { extractPromptRequirements } = require('./promptRequirementExtractor');
const { generateBrandIdentity } = require('./brandIdentityService');
const { generateWebsiteBlueprint } = require('./blueprintService');
const { analyzeAndPlanWebsite, critiqueAndScoreUI } = require('./websiteArchitectService');
const { enrichPageImages } = require('./imageService');
const { runGenerationQualityGate } = require('./generationQualityGate');
const { runAutoImprovementLoop } = require('./aiReviewService');
const { calculateGenerationQualityMetrics } = require('../utils/qualityScorer');

// ── 1. Generation Mode Enum ───────────────────────────────────────────────────
const GENERATION_MODES = {
  MODE_A_PROMPT: 'MODE_A_PROMPT',
  MODE_B_WIREFRAME: 'MODE_B_WIREFRAME',
  MODE_C_SCREENSHOT: 'MODE_C_SCREENSHOT',
  MODE_D_EXISTING_CODE: 'MODE_D_EXISTING_CODE',
};

/**
 * Automatically detects generation mode from input parameters.
 *
 * @param {object} params
 * @returns {string} Mode from GENERATION_MODES
 */
const detectGenerationMode = ({ wireframe, prompt = '', existingCode = '', screenshotPath = null }) => {
  if (wireframe || (typeof wireframe === 'object' && wireframe.filename)) {
    return GENERATION_MODES.MODE_B_WIREFRAME;
  }
  if (screenshotPath || prompt.toLowerCase().includes('screenshot')) {
    return GENERATION_MODES.MODE_C_SCREENSHOT;
  }
  if (existingCode && existingCode.trim().length > 0) {
    return GENERATION_MODES.MODE_D_EXISTING_CODE;
  }
  return GENERATION_MODES.MODE_A_PROMPT;
};

/**
 * Master Orchestrator Execution Pipeline
 *
 * @param {object} params
 * @param {string} params.prompt
 * @param {string} [params.pageName='Home']
 * @param {object} [params.wireframe]
 * @param {string} [params.existingCode]
 * @param {string} [params.architectureFlow]
 * @returns {Promise<object>} { success: boolean, page: object, mode: string, metrics: object, plan: object }
 */
const orchestrateWebsiteEngineering = async (params) => {
  const { prompt = '', pageName = 'Home', wireframe, existingCode, architectureFlow } = params;
  const mode = detectGenerationMode(params);

  console.log(`\n================ MASTER AI ORCHESTRATOR ================`);
  console.log(`Mode Detected: [${mode}]`);
  console.log(`Prompt: "${prompt}"`);
  console.log(`Page Name: "${pageName}"`);
  console.log(`========================================================\n`);

  // 1. Requirement Inference & Website Architecture Plan
  const reqSpec = extractPromptRequirements(prompt);
  const brandIdentity = generateBrandIdentity(prompt);
  const websitePlan = await analyzeAndPlanWebsite(prompt);

  // 2. Delegate generation to Gemini with failover provider
  const { generateUIFromPrompt, generateUIFromWireframe } = require('./aiService');

  let rawUIPage = null;

  if (mode === GENERATION_MODES.MODE_B_WIREFRAME && wireframe) {
    const imagePath = wireframe.path || wireframe.filename;
    rawUIPage = await generateUIFromWireframe({ imagePath, prompt, pageName });
  } else {
    rawUIPage = await generateUIFromPrompt({ prompt, pageName, existingCode, architectureFlow });
  }

  // 3. Image Strategy Enrichment
  const imageEnrichedPage = enrichPageImages(rawUIPage, prompt);

  // 4. Quality Gate & Anti-Template Sanitization
  const qualityGateResult = runGenerationQualityGate(imageEnrichedPage, prompt);
  const sanitizedPage = qualityGateResult.sanitizedPage || imageEnrichedPage;

  // 5. Multi-Agent Critic & Auto-Improvement Loop
  const { finalPage, iterationsRun } = await runAutoImprovementLoop(sanitizedPage, prompt, 2);

  // 6. Calculate Comprehensive Quality Metrics
  const metrics = calculateGenerationQualityMetrics(finalPage, prompt);

  console.log(`[AI-ORCHESTRATOR] Generation complete.`);
  console.log(`Quality Score: ${metrics.visualQuality}/100 | Domain Match: ${metrics.domainMatch}/100 | Template Similarity: ${metrics.templateSimilarity}%`);

  return {
    success: true,
    page: finalPage,
    mode,
    metrics,
    plan: websitePlan,
    iterationsRun,
  };
};

module.exports = {
  GENERATION_MODES,
  detectGenerationMode,
  orchestrateWebsiteEngineering,
};

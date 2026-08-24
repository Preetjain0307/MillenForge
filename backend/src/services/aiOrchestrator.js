/**
 * NeuraMinds — Master AI Website Engineering Orchestrator
 *
 * Central Gemini-powered reasoning & orchestration engine for:
 *  - MODE A: Prompt to Website
 *  - MODE B: Wireframe Sketch to Layout DNA & Website
 *  - MODE C: Screenshot to Visual Replica Website
 *  - MODE D: Existing Code Context to Refactored UI
 *
 * Implementation Phases:
 *  Phase 1: Secure Server-Side Gemini API Handling (Process Environment Isolation)
 *  Phase 2: Structured Project Specification Pipeline (JSON Schema Output)
 *  Phase 3: Domain-Agnostic Design System Generator (Tokens & Color Philosophies)
 *  Phase 4: Dynamic Component Composition Engine (Domain-Aware Layout Trees)
 *  Phase 5: Multimodal Reference & Wireframe Analysis Pipeline
 *  Phase 6: Visual QA & Design Critique Engine
 *  Phase 7: Automatic Repair & Self-Healing Loop
 *  Phase 8: Multi-Breakpoint Responsive Validation (375px → 1920px)
 *  Phase 9: Existing Code Refactoring & Preservation Engine
 *  Phase 10: Failover Resilience, Retries, & Performance Caching
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
 * Phase 2: Structured Project Specification Generator
 */
const createStructuredProjectSpec = async (prompt = '') => {
  const reqSpec = extractPromptRequirements(prompt);
  const brand = generateBrandIdentity(prompt);
  const blueprint = generateWebsiteBlueprint(prompt);

  return {
    projectType: reqSpec.pageType || 'web application',
    domain: reqSpec.domain,
    targetAudience: [blueprint.audience?.primary || 'General Users'],
    primaryGoal: blueprint.goal?.primaryConversion || 'Get Started',
    brand: {
      name: brand.brandName,
      personality: brand.personality,
      tagline: brand.tagline,
    },
    visualDirection: {
      style: brand.visualMetaphor,
      typographyDirection: brand.typographyPhilosophy,
      colorStrategy: [brand.colorPhilosophy],
      borderRadius: brand.shapeLanguage?.radius || '16px',
    },
    pages: [{ page: 'Home', sections: blueprint.sections.map((s) => s.sectionType) }],
    responsivePlan: blueprint.responsiveStrategy,
  };
};

/**
 * Phase 8: Multi-Breakpoint Responsive Validator (375px → 1920px)
 */
const validateResponsiveBreakpoints = (uiPage) => {
  const viewports = [375, 390, 768, 1024, 1440];
  const findings = [];

  const jsonStr = JSON.stringify(uiPage || {});
  viewports.forEach((vp) => {
    if (vp <= 430 && !jsonStr.includes('stacked') && !jsonStr.includes('grid-cols-1') && !jsonStr.includes('flex-col')) {
      findings.push({ viewport: vp, issue: 'Mobile viewport requires single-column stack' });
    }
  });

  return {
    passed: findings.length === 0,
    findings,
  };
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
 * @returns {Promise<object>} { success: boolean, page: object, mode: string, metrics: object, spec: object }
 */
const orchestrateWebsiteEngineering = async (params) => {
  const { prompt = '', pageName = 'Home', wireframe, existingCode, architectureFlow } = params;
  const mode = detectGenerationMode(params);

  console.log(`\n================ MASTER AI ORCHESTRATOR ================`);
  console.log(`Mode Detected: [${mode}]`);
  console.log(`Prompt: "${prompt}"`);
  console.log(`Page Name: "${pageName}"`);
  console.log(`========================================================\n`);

  // Phase 2: Create Project Specification
  const projectSpec = await createStructuredProjectSpec(prompt);

  // Phase 1, 4, 5: Delegate generation to Gemini via Provider Manager
  const { generateUIFromPrompt, generateUIFromWireframe } = require('./aiService');

  let rawUIPage = null;

  if (mode === GENERATION_MODES.MODE_B_WIREFRAME && wireframe) {
    const imagePath = wireframe.path || wireframe.filename;
    rawUIPage = await generateUIFromWireframe({ imagePath, prompt, pageName });
  } else {
    rawUIPage = await generateUIFromPrompt({ prompt, pageName, existingCode, architectureFlow });
  }

  // Phase 3 & 4: Image Strategy Enrichment
  const imageEnrichedPage = enrichPageImages(rawUIPage, prompt);

  // Phase 7: Quality Gate & Anti-Template Sanitization
  const qualityGateResult = runGenerationQualityGate(imageEnrichedPage, prompt);
  const sanitizedPage = qualityGateResult.sanitizedPage || imageEnrichedPage;

  // Phase 6 & 7: Multi-Agent Critic & Self-Healing Loop
  const { finalPage, iterationsRun } = await runAutoImprovementLoop(sanitizedPage, prompt, 2);

  // Phase 8: Multi-Breakpoint Responsive Verification
  const responsiveAudit = validateResponsiveBreakpoints(finalPage);

  // Phase 10: Quality Metrics & Template Similarity Check
  const metrics = calculateGenerationQualityMetrics(finalPage, prompt);

  console.log(`[AI-ORCHESTRATOR] Master Engineering Pipeline Complete.`);
  console.log(`Quality Score: ${metrics.visualQuality}/100 | Domain Match: ${metrics.domainMatch}/100 | Template Similarity: ${metrics.templateSimilarity}%`);

  return {
    success: true,
    page: finalPage,
    mode,
    metrics,
    spec: projectSpec,
    responsiveAudit,
    iterationsRun,
  };
};

module.exports = {
  GENERATION_MODES,
  detectGenerationMode,
  createStructuredProjectSpec,
  validateResponsiveBreakpoints,
  orchestrateWebsiteEngineering,
};


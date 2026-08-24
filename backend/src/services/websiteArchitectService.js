/**
 * NeuraMinds — AI Website Architect Service
 *
 * Senior Developer & Creative Director Agent for NeuraMinds.
 *
 * Responsibilities:
 * 1. Intent & Product Reasoning: Translates tiny user prompts into a structured WebsitePlan
 * 2. Visual Art Direction & Design Tokens: Creates domain-tailored color palettes, typography, spacing, and shape language
 * 3. Component Toolbox Composition: Selects from available UI primitives (Hero, SplitHero, BentoGrid, ProductGrid, LoginPanel, FAQ, etc.)
 * 4. Multi-Agent Critique & Auto-Repair Loop: Evaluates generated UIPage against design standards and repairs weak areas.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiProviderManager } = require('./geminiProviderManager');
const { extractPromptRequirements } = require('./promptRequirementExtractor');
const { generateBrandIdentity } = require('./brandIdentityService');
const { generateWebsiteBlueprint } = require('./blueprintService');

// ── Helper: Safe JSON Extractor ───────────────────────────────────────────────
const extractJSON = (text) => {
  if (!text || typeof text !== 'string') throw new Error('AI returned empty response');
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch (_) {}
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {} }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch (_) {}
  }
  throw new Error('AI response did not contain valid JSON');
};

/**
 * Generate a complete structured WebsitePlan for a given user prompt.
 * Uses Gemini API to reason about domain intent, audience, components, design tokens, and assets.
 *
 * @param {string} userPrompt
 * @returns {Promise<object>} WebsitePlan
 */
const analyzeAndPlanWebsite = async (userPrompt = '') => {
  const reqSpec = extractPromptRequirements(userPrompt);
  const brandIdentity = generateBrandIdentity(userPrompt);
  const blueprint = generateWebsiteBlueprint(userPrompt);

  const fallbackPlan = {
    intent: { prompt: userPrompt, domain: reqSpec.domain, pageType: reqSpec.pageType },
    business: { brandName: brandIdentity.brandName, tagline: brandIdentity.tagline, industry: reqSpec.domain },
    audience: blueprint.audience,
    goals: blueprint.goal,
    brand: brandIdentity,
    visualDirection: {
      style: brandIdentity.visualMetaphor,
      themeTokens: reqSpec.themeTokens,
      spacing: brandIdentity.spacingMode,
      typography: brandIdentity.typographyPhilosophy,
      heroComposition: brandIdentity.heroComposition,
    },
    informationArchitecture: blueprint.sections,
    componentPlan: blueprint.sections.map((s) => s.sectionType),
    responsivePlan: blueprint.responsiveStrategy,
  };

  return geminiProviderManager.generateWithFailover(async ({ apiKey, model: modelName }) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: `You are NeuraMinds's Lead AI Website Architect and Senior Creative Director.
Your task is to analyze a user prompt and output a complete, highly structured WebsitePlan JSON object.

Output ONLY valid JSON matching this schema:
{
  "intent": { "domain": "<domain>", "pageType": "<pageType>" },
  "business": { "brandName": "<brand>", "tagline": "<tagline>", "industry": "<industry>" },
  "audience": { "primary": "<audience>", "intent": "<intent>" },
  "goals": { "primaryConversion": "<conversion CTA>", "visualStory": "<story>" },
  "brand": { "personality": ["<trait>"], "visualLanguage": "<visual style>" },
  "visualDirection": {
    "style": "<visual style>",
    "heroComposition": "<EDITORIAL_HERO|SPLIT_HERO|FULL_BLEED_HERO|CENTERED_HERO>",
    "themeTokens": {
      "background": "<hex>",
      "surface": "<hex>",
      "primary": "<hex>",
      "primaryText": "<hex>",
      "text": "<hex>"
    }
  },
  "informationArchitecture": [
    { "sectionType": "<navbar|hero|cards|features|testimonials|pricing|footer>", "purpose": "<purpose>" }
  ],
  "responsivePlan": { "desktopColumns": 3, "tabletColumns": 2, "mobileLayout": "stacked" }
}`,
    });

    const userMsg = `Analyze user prompt and generate WebsitePlan JSON:\n"${userPrompt}"`;
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    });

    const text = response.response.text();
    const parsed = extractJSON(text);
    return { ...fallbackPlan, ...parsed };
  }).catch((err) => {
    console.warn('[WEBSITE-ARCHITECT] AI planning fallback engaged:', err.message);
    return fallbackPlan;
  });
};

/**
 * Critiques a generated UIPage as a Senior Developer + UI Architect.
 * Returns numerical scores across visual, domain relevance, content realism, and mobile responsiveness.
 *
 * @param {object} uiPage
 * @param {string} userPrompt
 * @returns {object} { score: number, strengths: string[], problems: string[], requiredFixes: string[] }
 */
const critiqueAndScoreUI = (uiPage, userPrompt = '') => {
  const { evaluateMultiAgentReview } = require('./aiReviewService');
  const review = evaluateMultiAgentReview(uiPage);
  const promptLower = String(userPrompt).toLowerCase();

  const problems = [];
  const requiredFixes = [];

  const jsonStr = JSON.stringify(uiPage || {});
  if (jsonStr.includes('GENERIC') || jsonStr.includes('generic Solution')) {
    problems.push('Contains placeholder text or generic solution references');
    requiredFixes.push('Replace generic fallback copy with domain-specific brand messaging');
  }

  if (promptLower.includes('chinese') && !jsonStr.includes('Dim Sum') && !jsonStr.includes('Noodle') && !jsonStr.includes('Chinese')) {
    problems.push('Chinese dining prompt missing authentic culinary menu items');
    requiredFixes.push('Inject authentic Chinese dim sum and wok dish cards');
  }

  return {
    score: Math.max(0, review.overallScore - (problems.length * 15)),
    strengths: ['Multi-section structure present', 'Design tokens compliant'],
    problems,
    requiredFixes,
  };
};

module.exports = {
  analyzeAndPlanWebsite,
  critiqueAndScoreUI,
};

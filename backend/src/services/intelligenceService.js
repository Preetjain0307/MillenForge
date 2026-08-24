/**
 * NeuraMinds — AI Product Intelligence Service
 *
 * AI-assisted requirement gap detection, requirement prioritization,
 * frontend architecture recommendations, MVC/MVVM pattern analysis,
 * UI quality scoring, and design-to-code validation.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateQualityScore, validateDesignToCode } = require('../utils/qualityScorer');

// ── Gemini configuration fallback ─────────────────────────────────────────────
const getConfig = () => {
  const apiKey = process.env.AI_API_KEY;
  const rawModel = (process.env.AI_MODEL || 'gemini-2.0-flash').trim();
  return { apiKey, model: rawModel };
};

/**
 * Extract JSON safely with 3-pass fallback
 */
const extractJSON = (text) => {
  if (!text || typeof text !== 'string') throw new Error('AI returned an empty response');
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

// ── Deterministic Requirement Gap Analyzer ────────────────────────────────────
const analyzeRequirements = async ({ prompt = '', uiPage = null, wireframeMeta = null }) => {
  const promptLower = String(prompt).toLowerCase();

  // Try Gemini AI structured analysis if API key is configured
  const config = getConfig();
  if (config.apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const model = genAI.getGenerativeModel({ model: config.model });

      const aiPrompt = `You are a Senior Product Manager and System Architect analyzing a software product requirement.

User Prompt: "${prompt}"

Analyze this requirement and output ONLY a valid JSON object matching this exact schema:
{
  "summary": "Executive summary of requirement scope",
  "missingRequirements": [
    {
      "id": "req-1",
      "title": "Requirement Title",
      "description": "Clear description",
      "severity": "high",
      "reason": "Why this is critical to address"
    }
  ],
  "priorities": [
    {
      "requirementId": "req-1",
      "priority": "critical",
      "impact": 9,
      "effort": 4,
      "confidence": 0.9,
      "rationale": "High user impact with manageable implementation effort"
    }
  ],
  "ambiguousRequirements": ["Unclear detail 1"],
  "assumptions": ["Assumption 1"],
  "recommendedQuestions": ["Clarifying question 1"]
}

Identify missing requirements such as: authentication, user roles, mobile responsiveness, empty/error/loading states, accessibility, CTAs, data persistence, search/filter controls. Output ONLY the JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      });

      const text = result.response.text();
      const parsed = extractJSON(text);
      if (parsed && Array.isArray(parsed.missingRequirements)) {
        return parsed;
      }
    } catch (err) {
      console.warn('[INTELLIGENCE] Gemini analysis fallback to rule engine:', err.message);
    }
  }

  // Fallback Rule Engine
  const missingRequirements = [];
  const priorities = [];
  const ambiguous = [];
  const assumptions = [];
  const questions = [];

  if (!promptLower.includes('auth') && !promptLower.includes('login') && !promptLower.includes('signup')) {
    missingRequirements.push({
      id: 'req-auth',
      title: 'User Authentication & Session Management',
      description: 'Missing authentication, registration flow, and session persistence.',
      severity: 'high',
      reason: 'Necessary if users need personalized dashboards or saved state.',
    });
    priorities.push({
      requirementId: 'req-auth',
      priority: 'high',
      impact: 9,
      effort: 5,
      confidence: 0.95,
      rationale: 'Core foundation for user accounts and data privacy.',
    });
  }

  if (!promptLower.includes('mobile') && !promptLower.includes('responsive')) {
    missingRequirements.push({
      id: 'req-responsive',
      title: 'Mobile Touch Controls & Responsive Breakpoints',
      description: 'Touch target optimization and mobile viewport adaptivity.',
      severity: 'medium',
      reason: 'Ensures accessibility on smartphones and tablets.',
    });
    priorities.push({
      requirementId: 'req-responsive',
      priority: 'critical',
      impact: 9,
      effort: 3,
      confidence: 0.98,
      rationale: 'Essential for mobile device usability.',
    });
  }

  if (!promptLower.includes('error') && !promptLower.includes('loading')) {
    missingRequirements.push({
      id: 'req-states',
      title: 'Explicit Empty, Loading & Error States',
      description: 'Feedback indicators for network delay or failed requests.',
      severity: 'medium',
      reason: 'Prevents user confusion during async operations.',
    });
    priorities.push({
      requirementId: 'req-states',
      priority: 'medium',
      impact: 7,
      effort: 2,
      confidence: 0.9,
      rationale: 'Improves UX polish during async data loading.',
    });
  }

  assumptions.push('Assumed standard web browser client target.');
  assumptions.push('Assumed REST/JSON HTTP backend API.');
  questions.push('Will users need dark mode theme toggle?');
  questions.push('What are the primary KPI metrics to highlight?');

  return {
    summary: `Analyzed requirement scope for "${prompt.slice(0, 50) || 'General UI'}". Identified ${missingRequirements.length} functional requirement gaps.`,
    missingRequirements,
    priorities,
    ambiguousRequirements: ambiguous,
    assumptions,
    recommendedQuestions: questions,
  };
};

// ── Frontend Architecture & Pattern Recommender ───────────────────────────────
const getArchitectureRecommendation = async ({ prompt = '', uiPage = null }) => {
  const promptLower = String(prompt).toLowerCase();

  const isComplex = promptLower.includes('dashboard') || promptLower.includes('saas') || promptLower.includes('analytics') || promptLower.includes('cms');

  const architecture = isComplex ? 'feature-based' : 'component-based';
  const reason = isComplex
    ? 'High component density and domain complexity benefit from grouping components, state, and services by feature module.'
    : 'Page is content-focused and benefits from a clean atomic component hierarchy.';

  return {
    architecture,
    reason,
    stateManagement: 'Redux Toolkit (Centralized global state with Slice reducers)',
    recommendedStructure: [
      'src/components/ — Reusable atomic UI elements (NmButton, NmCard, NmInput)',
      'src/features/ — Feature domain slices (generationSlice, pagesSlice, cmsSlice)',
      'src/pages/ — Route containers (GeneratePage, PreviewPage)',
      'src/services/ — Centralized API HTTP client layer',
      'src/types/ — Data contract models and schema validators',
    ],
    reusableComponents: [
      'NmButton (Primary, Secondary, Ghost variants)',
      'NmCard (Container & Repeating Collections)',
      'NmInput (TextField & Label wrapper)',
      'UIRenderer (Atomic UIPage Renderer)',
    ],
    apiBoundaries: [
      'POST /api/generate → AI Generation',
      'POST /api/upload → Multipart Wireframe Upload',
      'GET /api/pages → Persistence & Retrieval',
    ],
  };
};

const getPatternRecommendation = async ({ prompt = '', uiPage = null }) => {
  const promptLower = String(prompt).toLowerCase();
  const isDashboard = promptLower.includes('dashboard') || promptLower.includes('analytics') || promptLower.includes('data');

  const recommendedPattern = isDashboard ? 'MVVM' : 'MVC';
  const confidence = isDashboard ? 0.92 : 0.88;
  const reason = isDashboard
    ? 'MVVM (Model-View-ViewModel) decouples complex data transformation and interactive state from visual React presentation views.'
    : 'MVC (Model-View-Controller) provides a simple, clean separation of backend controller endpoints, shared JSON models, and React views.';

  const layers = isDashboard
    ? [
        { name: 'Model', responsibility: 'UIPage JSON Contract & Redux Store State' },
        { name: 'ViewModel', responsibility: 'Redux Selectors, custom React hooks, and valueNormalizer' },
        { name: 'View', responsibility: 'UIRenderer, NmCmsElement, and PreviewPage presentation components' },
      ]
    : [
        { name: 'Model', responsibility: 'Mongoose Page Schemas and JSDoc data types' },
        { name: 'View', responsibility: 'React Component Views & PrimeReact UI Widgets' },
        { name: 'Controller', responsibility: 'Express route controllers handling HTTP validation & Gemini API calls' },
      ];

  return {
    recommendedPattern,
    confidence,
    reason,
    layers,
  };
};

// ── Quality Scoring & Design Validation Composite ─────────────────────────────
const getQualityScore = ({ uiPage = null, prompt = '', wireframeMeta = null }) => {
  const quality = calculateQualityScore(uiPage, prompt, wireframeMeta);
  const designValidation = validateDesignToCode(prompt, uiPage, wireframeMeta);

  return {
    ...quality,
    designValidation,
  };
};

module.exports = {
  analyzeRequirements,
  getArchitectureRecommendation,
  getPatternRecommendation,
  getQualityScore,
};

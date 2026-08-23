/**
 * NeuraMind — Generation Quality Gate
 *
 * Runs every generated UIPage through a deterministic pipeline:
 *   1. Schema Validation  (validateUIPage)
 *   2. Self-Healing       (healUIPage — fills missing IDs, fallbacks, invalid props, bad types)
 *   3. Quality Scoring    (calculateQualityScore — 10 categories, 0–100 score)
 *   4. Design-to-Prompt   (validateDesignToCode — domain intent verification)
 *   5. Domain Image Rules (rejectIrrelevantImages — blocks off-domain imagery)
 *
 * Consumed exclusively by generateController.js.
 * Never calls Gemini. Deterministic and synchronous (no await needed).
 *
 * Gate result shape:
 * {
 *   passed:           boolean,
 *   page:             UIPage,
 *   qualityScore:     number,
 *   qualityGrade:     'A'|'B'|'C'|'D'|'F',
 *   matchScore:       number,
 *   repairsApplied:   Repair[],
 *   issues:           string[],
 *   recommendations:  string[],
 *   rejectionReason:  string|null
 * }
 */

const { validateUIPage } = require('../utils/validateUI');
const { calculateQualityScore, validateDesignToCode } = require('../utils/qualityScorer');
const { healUIPage } = require('./aiReviewService');

// ── Domain detection helpers ──────────────────────────────────────────────────

const DOMAIN_RULES = [
  {
    name: 'food',
    keywords: ['food', 'pizza', 'restaurant', 'burger', 'cafe', 'dining', 'sushi', 'menu', 'meal', 'lunch', 'dinner', 'chef', 'cuisine', 'takeaway', 'delivery'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['order', 'add to cart', 'menu', 'reserve'],
  },
  {
    name: 'travel',
    keywords: ['travel', 'hotel', 'booking', 'resort', 'tour', 'vacation', 'holiday', 'flight', 'destination', 'trip', 'hospitality'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['book', 'reserve', 'explore', 'plan'],
  },
  {
    name: 'fashion',
    keywords: ['fashion', 'ecommerce', 'e-commerce', 'store', 'shop', 'clothing', 'apparel', 'wear', 'sneakers', 'accessories', 'boutique', 'collection'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['buy', 'add to bag', 'shop', 'order'],
  },
  {
    name: 'realestate',
    keywords: ['real estate', 'property', 'house', 'villa', 'apartment', 'listing', 'mortgage', 'architecture', 'home for sale'],
    requiresImages: true,
    requiresCTA: true,
    requiredCTAHints: ['inquire', 'contact', 'schedule', 'view'],
  },
  {
    name: 'portfolio',
    keywords: ['portfolio', 'creative', 'designer', 'artist', 'photographer', 'showcase', 'projects', 'work', 'freelance'],
    requiresImages: true,
    requiresCTA: false,
    requiredCTAHints: ['view project', 'hire', 'contact'],
  },
  {
    name: 'saas',
    keywords: ['saas', 'dashboard', 'analytics', 'platform', 'software', 'crm', 'erp', 'monitoring', 'metrics', 'data', 'api', 'integration'],
    requiresImages: false, // SaaS typically uses data/charts not photos
    requiresCTA: true,
    requiredCTAHints: ['start', 'free trial', 'sign up', 'get started', 'demo'],
  },
  {
    name: 'documentation',
    keywords: ['documentation', 'docs', 'api reference', 'developer guide', 'readme', 'knowledge base', 'wiki', 'guide'],
    requiresImages: false,
    requiresCTA: false,
    requiredCTAHints: [],
  },
  {
    name: 'auth',
    keywords: ['login', 'signup', 'sign up', 'sign in', 'register', 'authentication', 'onboarding', 'create account'],
    requiresImages: false,
    requiresCTA: true,
    requiredCTAHints: ['sign up', 'login', 'create account', 'get started'],
  },
];

/**
 * Detect the domain from the user prompt.
 * Returns the matched domain rule or null.
 */
const detectDomain = (prompt = '') => {
  const p = String(prompt).toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.keywords.some((kw) => p.includes(kw))) {
      return rule;
    }
  }
  return null;
};

// ── Image relevance guard ─────────────────────────────────────────────────────

const SAAS_IRRELEVANT_QUERIES = ['pizza', 'burger', 'food', 'beach', 'resort', 'villa', 'fashion', 'sneakers', 'wedding'];
const DOC_IRRELEVANT_QUERIES  = ['pizza', 'burger', 'beach', 'resort', 'fashion', 'villa', 'concert'];

/**
 * Removes or replaces images that are clearly domain-irrelevant.
 * E.g. a SaaS page should never have food photos.
 *
 * @param {object} uiPage
 * @param {object|null} domainRule
 * @returns {object} cleaned UIPage
 */
const rejectIrrelevantImages = (uiPage, domainRule) => {
  if (!domainRule || !uiPage || !Array.isArray(uiPage.sections)) return uiPage;

  const blockList = domainRule.name === 'saas' ? SAAS_IRRELEVANT_QUERIES
    : domainRule.name === 'documentation' ? DOC_IRRELEVANT_QUERIES
    : [];

  if (blockList.length === 0) return uiPage;

  const cleanedSections = uiPage.sections.map((section) => {
    if (!Array.isArray(section.elements)) return section;

    const cleanedElements = section.elements.map((el) => {
      if (el.type !== 'image') return el;

      const query = (el.content?.imageQuery || el.props?.imageQuery || el.props?.alt || '').toLowerCase();
      const isIrrelevant = blockList.some((blocked) => query.includes(blocked));

      if (isIrrelevant) {
        // Replace with a neutral workspace/dashboard placeholder
        const fallbackSrc = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80';
        return {
          ...el,
          content: {
            src: fallbackSrc,
            alt: 'Professional workspace',
            imageQuery: 'professional workspace',
          },
          props: {
            ...el.props,
            src: fallbackSrc,
            alt: 'Professional workspace',
          },
        };
      }

      return el;
    });

    return { ...section, elements: cleanedElements };
  });

  return { ...uiPage, sections: cleanedSections };
};

// ── Domain-specific missing section detection ─────────────────────────────────

/**
 * Returns a list of critical missing elements for the detected domain.
 * Only flags things that would make the site feel hollow or wrong.
 */
const detectMissingRequiredSections = (uiPage, domainRule) => {
  const missing = [];
  if (!domainRule || !uiPage || !Array.isArray(uiPage.sections)) return missing;

  const allElements = uiPage.sections.flatMap((s) => s.elements || []);
  const sectionTypes = uiPage.sections.map((s) => s.type || '');

  // Check for CTA requirement
  if (domainRule.requiresCTA) {
    const hasCTA = allElements.some((el) => el.type === 'button' || el.type === 'link');
    if (!hasCTA) {
      missing.push(`Missing required CTA button for ${domainRule.name} page (e.g. "${domainRule.requiredCTAHints[0] || 'Get Started'}")`);
    }
  }

  // Check for imagery requirement
  if (domainRule.requiresImages) {
    const hasImage = allElements.some(
      (el) => el.type === 'image' || (Array.isArray(el.props?.items) && el.props.items.some((i) => i.src || i.image || i.imageQuery))
    );
    if (!hasImage) {
      missing.push(`Missing required imagery for ${domainRule.name} page — visuals are essential for this domain`);
    }
  }

  // Food: must have a menu/cards section
  if (domainRule.name === 'food') {
    const hasMenuCards = sectionTypes.some((t) => t === 'cards') ||
      allElements.some((el) => el.type === 'cards' && Array.isArray(el.props?.items) && el.props.items.length > 0);
    if (!hasMenuCards) {
      missing.push('Food site missing menu items cards section with dishes, prices, and ratings');
    }
  }

  // Auth: must have form inputs
  if (domainRule.name === 'auth') {
    const hasInput = allElements.some((el) => el.type === 'input' || el.type === 'textfield');
    if (!hasInput) {
      missing.push('Authentication page missing form input fields (email, password)');
    }
  }

  return missing;
};

// ── Quality Gate Threshold ────────────────────────────────────────────────────

/** Minimum quality score to pass without retry */
const QUALITY_THRESHOLD = 55;

/** Minimum design-to-prompt match to pass */
const MATCH_THRESHOLD = 60;

// ── Main Gate Function ────────────────────────────────────────────────────────

/**
 * Run the full quality gate pipeline on a freshly generated UIPage.
 *
 * @param {object} rawPage - raw Gemini output (already parsed JSON)
 * @param {string} userPrompt - original user prompt
 * @returns {object} GateResult
 */
const runGenerationQualityGate = (rawPage, userPrompt = '') => {
  const issues = [];
  const recommendations = [];
  let repairsApplied = [];

  // ── Early rejection: null / non-object / empty sections ───────────────────
  // The self-healer can produce a valid default page from null — but that would
  // be a fabricated page, not the AI output. Reject outright so the controller
  // knows to retry or fail, rather than silently returning a stub page.
  if (
    rawPage === null ||
    rawPage === undefined ||
    typeof rawPage !== 'object' ||
    !Array.isArray(rawPage.sections) ||
    rawPage.sections.length === 0
  ) {
    return {
      passed: false,
      page: null,
      qualityScore: 0,
      qualityGrade: 'F',
      matchScore: 0,
      repairsApplied: [],
      issues: ['AI output is null, empty, or missing sections — cannot produce a valid page'],
      recommendations: ['Retry generation with a more detailed prompt'],
      rejectionReason: 'Null or empty page — generation failed',
    };
  }

  // ── Step 1: Schema validation ──────────────────────────────────────────────
  const validation = validateUIPage(rawPage);
  if (!validation.valid) {
    // Don't reject here — attempt self-healing first
    issues.push(...(validation.errors || []).map((e) => `Schema: ${e}`));
  }
  if (validation.warnings?.length > 0) {
    recommendations.push(...validation.warnings.map((w) => `Warning: ${w}`));
  }

  // ── Step 2: Self-healing pass ──────────────────────────────────────────────
  const { healedPage, repairs } = healUIPage(validation.valid ? validation.page : rawPage);
  repairsApplied = repairs;

  // Re-validate after healing
  const healedValidation = validateUIPage(healedPage);
  if (!healedValidation.valid) {
    return {
      passed: false,
      page: healedPage,
      qualityScore: 0,
      qualityGrade: 'F',
      matchScore: 0,
      repairsApplied,
      issues: [...issues, 'UIPage failed schema validation even after self-healing attempt'],
      recommendations,
      rejectionReason: 'Schema validation failed after self-healing',
    };
  }

  const page = healedValidation.page;

  // ── Step 3: Domain detection ───────────────────────────────────────────────
  const domainRule = detectDomain(userPrompt);

  // ── Step 4: Image relevance gate ───────────────────────────────────────────
  const cleanedPage = rejectIrrelevantImages(page, domainRule);

  // ── Step 5: Missing required sections check ────────────────────────────────
  const missingSections = detectMissingRequiredSections(cleanedPage, domainRule);
  if (missingSections.length > 0) {
    issues.push(...missingSections);
  }

  // ── Step 6: Quality score ──────────────────────────────────────────────────
  const qualityResult = calculateQualityScore(cleanedPage, userPrompt);
  const qualityScore = qualityResult.score;
  const qualityGrade = qualityResult.grade;

  if (qualityResult.issues) {
    qualityResult.issues.forEach((iss) => {
      if (!iss.includes('No critical quality')) issues.push(`Quality: ${iss}`);
    });
  }
  if (qualityResult.recommendations) {
    qualityResult.recommendations.forEach((rec) => {
      if (!rec.includes('meets high production')) recommendations.push(rec);
    });
  }

  // ── Step 7: Design-to-prompt match ────────────────────────────────────────
  const matchResult = validateDesignToCode(userPrompt, cleanedPage);
  const matchScore = matchResult.matchScore;

  matchResult.missingSections?.forEach((ms) => recommendations.push(`Add missing section: ${ms}`));
  matchResult.missingCTAs?.forEach((mc) => issues.push(`Missing CTA: ${mc}`));
  matchResult.missingImages?.forEach((mi) => issues.push(`Missing imagery: ${mi}`));

  // ── Step 8: Gate decision ──────────────────────────────────────────────────
  const passed = qualityScore >= QUALITY_THRESHOLD && matchScore >= MATCH_THRESHOLD;
  const rejectionReason = !passed
    ? `Quality score ${qualityScore}/100 (min ${QUALITY_THRESHOLD}) and match score ${matchScore}/100 (min ${MATCH_THRESHOLD})`
    : null;

  return {
    passed,
    page: cleanedPage,
    qualityScore,
    qualityGrade,
    matchScore,
    repairsApplied,
    issues,
    recommendations,
    rejectionReason,
  };
};

module.exports = {
  runGenerationQualityGate,
  detectDomain,
  detectMissingRequiredSections,
  rejectIrrelevantImages,
  QUALITY_THRESHOLD,
  MATCH_THRESHOLD,
};

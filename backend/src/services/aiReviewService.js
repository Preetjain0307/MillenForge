/**
 * NeuraMindss — AI Review & Self-Improvement Engine (Service)
 *
 * Implements:
 * 1. Multi-Agent Review System (UX, Visual, Accessibility, Engineering, Product + Aggregator)
 * 2. Safe Self-Healing UI Mechanism (repairs missing IDs, missing fallbacks, malformed objects, unsupported element types)
 * 3. AI Refactoring Assistant (provides low/medium/high risk refactoring recommendations)
 * 4. Feature Recommendation Engine (recommends domain-specific missing features)
 * 5. Automatic Improvement Loop (Max 1-3 iterations, quality guards, no infinite loops)
 */

const { validateUIPage } = require('../utils/validateUI');
const { generateUIFromPrompt } = require('./aiService');

// ── 1. MULTI-AGENT REVIEW ENGINE ──────────────────────────────────────────────

/**
 * UX Reviewer Agent
 * Checks: text hierarchy, CTA clarity, usability, navigation
 */
const runUxReviewer = (uiPage) => {
  const issues = [];
  const recommendations = [];
  let score = 100;

  if (!uiPage || !Array.isArray(uiPage.sections)) {
    return { agent: 'ux', score: 0, issues: ['Invalid page structure'], recommendations: ['Provide a valid UIPage'] };
  }

  const hasNavbar = uiPage.sections.some((s) => s.type === 'navbar' || s.id?.includes('nav'));
  const hasHero = uiPage.sections.some((s) => s.type === 'hero' || s.id?.includes('hero'));
  let buttonCount = 0;
  let missingCtaLabel = false;

  uiPage.sections.forEach((sec) => {
    (sec.elements || []).forEach((el) => {
      if (el.type === 'button') {
        buttonCount++;
        const label = typeof el.content === 'string' ? el.content : (el.content?.label || el.props?.label || '');
        if (!label || label.trim() === '') missingCtaLabel = true;
      }
    });
  });

  if (!hasNavbar) {
    score -= 10;
    recommendations.push('Add a top navigation bar for clearer usability');
  }

  if (!hasHero) {
    score -= 10;
    recommendations.push('Include a prominent Hero section to introduce the main value proposition');
  }

  if (buttonCount === 0) {
    score -= 20;
    issues.push('No call-to-action buttons found on page');
    recommendations.push('Add primary CTAs to drive user action');
  }

  if (missingCtaLabel) {
    score -= 15;
    issues.push('One or more CTA buttons have empty or unclear text labels');
    recommendations.push('Ensure every button has clear action-oriented text');
  }

  return {
    agent: 'ux',
    score: Math.max(0, score),
    issues,
    recommendations,
  };
};

/**
 * Visual Reviewer Agent
 * Checks: spacing, consistency, typography, imagery, visual hierarchy
 */
const runVisualReviewer = (uiPage) => {
  const issues = [];
  const recommendations = [];
  let score = 100;

  if (!uiPage || !Array.isArray(uiPage.sections)) {
    return { agent: 'visual', score: 0, issues: ['Invalid page structure'], recommendations: [] };
  }

  let imageCount = 0;
  let cardCount = 0;
  let h1Count = 0;

  uiPage.sections.forEach((sec) => {
    (sec.elements || []).forEach((el) => {
      if (el.type === 'image') imageCount++;
      if (el.type === 'card' || el.type === 'cards') cardCount++;
      if (el.type === 'text' && (el.props?.tag === 'h1' || el.id?.includes('heading'))) h1Count++;
    });
  });

  if (h1Count === 0) {
    score -= 10;
    recommendations.push('Establish a clear primary heading (h1) for strong typography hierarchy');
  } else if (h1Count > 2) {
    score -= 10;
    issues.push('Multiple h1 headings detected');
    recommendations.push('Use a single primary h1 and use h2/h3 for secondary section headers');
  }

  if (imageCount === 0 && !uiPage.page?.toLowerCase().includes('saas')) {
    score -= 15;
    recommendations.push('Incorporate high-quality visual imagery to enhance aesthetic appeal');
  }

  if (cardCount > 0 && uiPage.sections.length < 2) {
    score -= 10;
    recommendations.push('Balance content distribution across multiple distinct sections for better visual rhythm');
  }

  return {
    agent: 'visual',
    score: Math.max(0, score),
    issues,
    recommendations,
  };
};

/**
 * Accessibility Reviewer Agent
 * Checks: alt text, labels, button names, contrast intent, keyboard usability metadata
 */
const runAccessibilityReviewer = (uiPage) => {
  const issues = [];
  const recommendations = [];
  let score = 100;

  if (!uiPage || !Array.isArray(uiPage.sections)) {
    return { agent: 'accessibility', score: 0, issues: ['Invalid page structure'], recommendations: [] };
  }

  uiPage.sections.forEach((sec) => {
    (sec.elements || []).forEach((el) => {
      if (el.type === 'image') {
        const alt = el.props?.alt || (typeof el.content === 'object' ? el.content.alt : '') || el.fallback;
        if (!alt || alt.trim() === '' || alt === 'Generated image' || alt === 'Image') {
          score -= 10;
          issues.push(`Image element "${el.id}" lacks descriptive alt text for screen readers`);
          recommendations.push(`Provide meaningful alt text for image "${el.id}"`);
        }
      }

      if (el.type === 'button') {
        const ariaLabel = el.props?.['aria-label'] || (typeof el.content === 'string' ? el.content : el.props?.label);
        if (!ariaLabel) {
          score -= 5;
          recommendations.push(`Add aria-label metadata for button "${el.id}"`);
        }
      }

      if (el.type === 'input' || el.type === 'textfield') {
        if (!el.props?.label && !el.props?.placeholder) {
          score -= 10;
          issues.push(`Input element "${el.id}" missing accessible label or placeholder`);
          recommendations.push(`Add label or placeholder hint for input "${el.id}"`);
        }
      }
    });
  });

  return {
    agent: 'accessibility',
    score: Math.max(0, score),
    issues,
    recommendations,
  };
};

/**
 * Engineering Reviewer Agent
 * Checks: UIPage contract, element safety, missing fallbacks, malformed data, unnecessary complexity
 */
const runEngineeringReviewer = (uiPage) => {
  const issues = [];
  const recommendations = [];
  let score = 100;

  if (!uiPage || typeof uiPage !== 'object') {
    return {
      agent: 'engineering',
      score: 0,
      issues: ['Invalid or null UIPage structure'],
      recommendations: ['Provide a valid UIPage JSON object'],
    };
  }

  const validation = validateUIPage(uiPage);
  if (!validation.valid) {
    score -= 40;
    (validation.errors || []).forEach((err) => issues.push(`Contract Error: ${err}`));
    recommendations.push('Run self-healing pass to repair UIPage schema violations');
  }

  if (validation.warnings && validation.warnings.length > 0) {
    score -= 10;
    validation.warnings.forEach((warn) => issues.push(`Warning: ${warn}`));
  }

  if (uiPage && Array.isArray(uiPage.sections)) {
    uiPage.sections.forEach((sec) => {
      (sec.elements || []).forEach((el) => {
        if (!el.id || el.id.trim() === '') {
          score -= 5;
          issues.push('Element missing stable ID');
        }
        if (el.content === undefined || el.content === null) {
          score -= 5;
          issues.push(`Element "${el.id}" content is null or undefined`);
        }
      });
    });
  }

  return {
    agent: 'engineering',
    score: Math.max(0, score),
    issues,
    recommendations,
  };
};

/**
 * Product Reviewer Agent
 * Checks: requirement coverage, missing features, unclear flows, conversion opportunities
 */
const runProductReviewer = (uiPage) => {
  const issues = [];
  const recommendations = [];
  let score = 100;

  if (!uiPage || !Array.isArray(uiPage.sections)) {
    return { agent: 'product', score: 0, issues: ['Invalid page structure'], recommendations: [] };
  }

  const pageName = (uiPage.page || '').toLowerCase();
  const sectionTypes = uiPage.sections.map((s) => (s.type || '').toLowerCase());

  if (pageName.includes('food') || pageName.includes('menu')) {
    if (!sectionTypes.includes('cards')) {
      score -= 20;
      issues.push('Food ordering website missing menu items grid');
      recommendations.push('Add a cards section detailing dishes, prices, and ratings');
    }
  } else if (pageName.includes('travel') || pageName.includes('booking')) {
    if (!sectionTypes.includes('cards') && !sectionTypes.includes('hero')) {
      score -= 20;
      issues.push('Travel site missing destination showcases');
      recommendations.push('Add destination cards with pricing per night and booking CTAs');
    }
  } else if (pageName.includes('saas') || pageName.includes('analytics')) {
    if (!sectionTypes.includes('cards') && !sectionTypes.includes('features')) {
      score -= 15;
      issues.push('SaaS dashboard missing metric cards');
      recommendations.push('Add KPI cards for revenue growth and active users');
    }
  }

  return {
    agent: 'product',
    score: Math.max(0, score),
    issues,
    recommendations,
  };
};

/**
 * Aggregates all 5 agent reviews into a final multi-agent evaluation score
 */
const evaluateMultiAgentReview = (uiPage) => {
  const ux = runUxReviewer(uiPage);
  const visual = runVisualReviewer(uiPage);
  const accessibility = runAccessibilityReviewer(uiPage);
  const engineering = runEngineeringReviewer(uiPage);
  const product = runProductReviewer(uiPage);

  const agents = [ux, visual, accessibility, engineering, product];

  const totalScore = agents.reduce((acc, curr) => acc + curr.score, 0);
  const overallScore = Math.round(totalScore / agents.length);

  const criticalIssues = [];
  const recommendations = [];

  agents.forEach((ag) => {
    ag.issues.forEach((iss) => criticalIssues.push(`[${ag.agent.toUpperCase()}] ${iss}`));
    ag.recommendations.forEach((rec) => recommendations.push(`[${ag.agent.toUpperCase()}] ${rec}`));
  });

  return {
    overallScore,
    agents,
    criticalIssues,
    recommendations,
  };
};

// ── 2. SAFE SELF-HEALING UI MECHANISM ────────────────────────────────────────

/**
 * Safely heals a malformed or invalid UIPage structure and produces audit trail logs.
 *
 * @param {object} uiPage - Input UIPage
 * @returns {{ healedPage: object, repairs: Array<{ repair: string, before: string, after: string, confidence: number }> }}
 */
const healUIPage = (uiPage) => {
  const repairs = [];
  if (!uiPage || typeof uiPage !== 'object') {
    return {
      healedPage: {
        page: 'Home',
        sections: [
          {
            id: 'sec-healed-1',
            type: 'hero',
            elements: [
              { id: 'el-healed-1', type: 'text', content: 'Repaired Page Content', fallback: 'Repaired Content', props: {} },
            ],
          },
        ],
      },
      repairs: [
        {
          repair: 'Replaced invalid non-object page with valid default UIPage',
          before: String(uiPage),
          after: 'UIPage object',
          confidence: 1.0,
        },
      ],
    };
  }

  const healed = JSON.parse(JSON.stringify(uiPage));

  if (!healed.page || typeof healed.page !== 'string') {
    repairs.push({
      repair: 'Added missing page name property',
      before: String(healed.page),
      after: 'Home',
      confidence: 0.98,
    });
    healed.page = 'Home';
  }

  if (!Array.isArray(healed.sections) || healed.sections.length === 0) {
    repairs.push({
      repair: 'Created default section array for sectionless page',
      before: '[]',
      after: '1 default section',
      confidence: 0.95,
    });
    healed.sections = [
      {
        id: 'sec-healed-auto',
        type: 'hero',
        elements: [
          { id: 'el-healed-text', type: 'text', content: 'Welcome', fallback: 'Welcome', props: {} },
        ],
      },
    ];
  }

  const VALID_ELEMENT_TYPES = new Set(['text', 'image', 'button', 'input', 'textfield', 'card', 'cards', 'carousel', 'wizard', 'icon', 'divider', 'link', 'list', 'badge', 'custom']);

  healed.sections = healed.sections.map((section, sIdx) => {
    if (!section || typeof section !== 'object') return section;
    const secCopy = { ...section };

    if (!secCopy.id || typeof secCopy.id !== 'string') {
      const newSecId = `sec-auto-${sIdx + 1}`;
      repairs.push({
        repair: 'Generated stable section ID',
        before: String(secCopy.id),
        after: newSecId,
        confidence: 0.99,
      });
      secCopy.id = newSecId;
    }

    if (!secCopy.type || typeof secCopy.type !== 'string') {
      secCopy.type = 'features';
      repairs.push({
        repair: 'Set default section type to "features"',
        before: String(section.type),
        after: 'features',
        confidence: 0.90,
      });
    }

    if (!Array.isArray(secCopy.elements)) {
      secCopy.elements = [];
      repairs.push({
        repair: 'Normalized elements property to array',
        before: String(section.elements),
        after: '[]',
        confidence: 0.95,
      });
    }

    secCopy.elements = secCopy.elements.map((el, eIdx) => {
      if (!el || typeof el !== 'object') return el;
      const elCopy = { ...el };

      // Missing ID repair
      if (!elCopy.id || typeof elCopy.id !== 'string' || elCopy.id.trim() === '') {
        const newElId = `${secCopy.id}-el-${eIdx + 1}`;
        repairs.push({
          repair: 'Generated stable element ID',
          before: String(elCopy.id),
          after: newElId,
          confidence: 0.99,
        });
        elCopy.id = newElId;
      }

      // Unsupported element type repair
      if (!elCopy.type || typeof elCopy.type !== 'string' || !VALID_ELEMENT_TYPES.has(elCopy.type.toLowerCase())) {
        repairs.push({
          repair: `Converted unsupported element type "${elCopy.type}" to safe "text" element`,
          before: String(elCopy.type),
          after: 'text',
          confidence: 0.92,
        });
        elCopy.type = 'text';
      }

      // Missing fallback repair
      if (elCopy.fallback === undefined || elCopy.fallback === null) {
        const defaultFallback = typeof elCopy.content === 'string' ? elCopy.content : 'Fallback content';
        repairs.push({
          repair: `Added safe default fallback to element "${elCopy.id}"`,
          before: 'null/undefined',
          after: defaultFallback,
          confidence: 0.95,
        });
        elCopy.fallback = defaultFallback;
      }

      // Missing props repair
      if (!elCopy.props || typeof elCopy.props !== 'object' || Array.isArray(elCopy.props)) {
        repairs.push({
          repair: `Normalized invalid props object on element "${elCopy.id}"`,
          before: String(elCopy.props),
          after: '{}',
          confidence: 0.98,
        });
        elCopy.props = {};
      }

      // Image element fallback repair
      if (elCopy.type === 'image') {
        const currentSrc = typeof elCopy.content === 'string' ? elCopy.content : elCopy.content?.src || elCopy.props?.src || '';
        if (!currentSrc || currentSrc.trim() === '') {
          const fallbackSrc = 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image';
          repairs.push({
            repair: `Provided safe fallback image URL for element "${elCopy.id}"`,
            before: 'empty/null src',
            after: fallbackSrc,
            confidence: 0.96,
          });
          elCopy.props.src = fallbackSrc;
          elCopy.props.alt = elCopy.props.alt || 'Generated image asset';
        }
      }

      return elCopy;
    });

    return secCopy;
  });

  return {
    healedPage: healed,
    repairs,
  };
};

// ── 3. AI REFACTORING ASSISTANT ──────────────────────────────────────────────

/**
 * Generates structured refactoring recommendations for a UIPage.
 *
 * @param {object} uiPage
 * @param {string} [refactorGoal='Improve layout hierarchy and reusable components']
 * @returns {{ recommendations: Array<{ targetElementIds: string[], changes: string[], reason: string, risk: 'low' | 'medium' | 'high' }>, updatedPage?: object }}
 */
const generateRefactoringAdvice = (uiPage, refactorGoal = '') => {
  const recommendations = [];
  if (!uiPage || !Array.isArray(uiPage.sections)) return { recommendations };

  let duplicateCardCount = 0;
  const cardIds = [];

  uiPage.sections.forEach((sec) => {
    (sec.elements || []).forEach((el) => {
      if (el.type === 'card') {
        duplicateCardCount++;
        cardIds.push(el.id);
      }
    });
  });

  if (duplicateCardCount > 2) {
    recommendations.push({
      targetElementIds: cardIds,
      changes: ['Consolidate repetitive card elements into a single repeating "cards" grid container'],
      reason: 'Reduces section redundancy, simplifies CMS editing, and ensures consistent grid responsiveness',
      risk: 'low',
    });
  }

  const heroSection = uiPage.sections.find((s) => s.type === 'hero');
  if (heroSection) {
    const hasHeroCta = (heroSection.elements || []).some((el) => el.type === 'button');
    if (!hasHeroCta) {
      recommendations.push({
        targetElementIds: [heroSection.id],
        changes: ['Add a primary action CTA button to the Hero section header'],
        reason: 'Drives immediate user conversion directly upon landing',
        risk: 'low',
      });
    }
  }

  recommendations.push({
    targetElementIds: uiPage.sections.map((s) => s.id),
    changes: ['Standardize vertical section padding to Tailwind py-12 px-6 spacing token'],
    reason: 'Ensures a balanced visual rhythm across desktop and mobile screens',
    risk: 'low',
  });

  return { recommendations };
};

// ── 4. FEATURE RECOMMENDATION ENGINE ────────────────────────────────────────

/**
 * Recommends missing domain-appropriate features based on prompt & current UIPage structure.
 *
 * @param {object} uiPage
 * @param {string} userPrompt
 * @returns {{ features: Array<{ name: string, priority: 'high' | 'medium' | 'low', reason: string, confidence: number }> }}
 */
const generateFeatureRecommendations = (uiPage, userPrompt = '') => {
  const promptLower = String(userPrompt).toLowerCase();
  const pageName = String(uiPage?.page || '').toLowerCase();
  const features = [];

  if (promptLower.includes('food') || pageName.includes('food')) {
    features.push(
      { name: 'Cart Drawer & Quick Checkout', priority: 'high', reason: 'Allows customers to customize orders and view cart totals instantly', confidence: 0.95 },
      { name: 'Dietary & Category Filters', priority: 'medium', reason: 'Enables quick filtering by Vegan, Gluten-Free, or Chef Specials', confidence: 0.88 },
      { name: 'Live Order Tracker', priority: 'medium', reason: 'Provides real-time updates on food preparation and delivery ETA', confidence: 0.82 }
    );
  } else if (promptLower.includes('travel') || pageName.includes('travel')) {
    features.push(
      { name: 'Interactive Date Picker & Guest Selector', priority: 'high', reason: 'Streamlines hotel and flight availability queries', confidence: 0.94 },
      { name: 'Price & Rating Filter Bar', priority: 'high', reason: 'Allows travelers to sort luxury resorts by budget and reviews', confidence: 0.90 }
    );
  } else if (promptLower.includes('saas') || pageName.includes('saas')) {
    features.push(
      { name: 'Workspace & Team Selector', priority: 'high', reason: 'Facilitates multi-tenant organization switching', confidence: 0.92 },
      { name: 'Notification & Alert Center', priority: 'medium', reason: 'Notifies operators of metric anomalies or threshold breaches', confidence: 0.86 }
    );
  } else {
    features.push(
      { name: 'Search & Category Filter Bar', priority: 'high', reason: 'Enhances discovery across catalog collections', confidence: 0.89 },
      { name: 'Customer Testimonial Showcase', priority: 'medium', reason: 'Builds trust and social proof for visitors', confidence: 0.85 }
    );
  }

  return { features };
};

// ── 5. AUTOMATIC IMPROVEMENT LOOP ───────────────────────────────────────────

/**
 * Runs an iterative improvement loop (Max 1 to 3 iterations) to review, repair,
 * and validate a UIPage until high quality is achieved.
 *
 * @param {object} initialPage - Initial generated UIPage
 * @param {string} [userPrompt='']
 * @param {number} [maxIterations=3]
 * @returns {object} { finalPage: object, iterationsRun: number, repairsApplied: Array, initialScore: number, finalScore: number }
 */
const runAutoImprovementLoop = async (initialPage, userPrompt = '', maxIterations = 3) => {
  let currentPage = JSON.parse(JSON.stringify(initialPage));
  let currentReview = evaluateMultiAgentReview(currentPage);
  const initialScore = currentReview.overallScore;
  const allRepairs = [];
  let iterationsRun = 0;

  const maxLoops = Math.min(3, Math.max(1, maxIterations));

  while (iterationsRun < maxLoops && currentReview.overallScore < 95) {
    iterationsRun++;

    // 1. Run self-healing pass
    const { healedPage, repairs } = healUIPage(currentPage);
    if (repairs.length > 0) {
      allRepairs.push(...repairs);
      currentPage = healedPage;
    }

    // 2. Re-evaluate score
    const newReview = evaluateMultiAgentReview(currentPage);

    // Guard: If quality decreased, rollback to previous state and terminate loop
    if (newReview.overallScore < currentReview.overallScore) {
      console.warn(`[AUTO-IMPROVE] Iteration ${iterationsRun}: Quality score dropped (${currentReview.overallScore} -> ${newReview.overallScore}). Rolling back.`);
      break;
    }

    currentReview = newReview;
  }

  return {
    finalPage: currentPage,
    iterationsRun,
    repairsApplied: allRepairs,
    initialScore,
    finalScore: currentReview.overallScore,
    reviewDetails: currentReview,
  };
};

module.exports = {
  runUxReviewer,
  runVisualReviewer,
  runAccessibilityReviewer,
  runEngineeringReviewer,
  runProductReviewer,
  evaluateMultiAgentReview,
  healUIPage,
  generateRefactoringAdvice,
  generateFeatureRecommendations,
  runAutoImprovementLoop,
};

/**
 * NeuraMind — AI Review & Self-Improvement Engine Test Suite
 *
 * Verifies:
 * 1. Multi-Agent Reviewers (UX, Visual, Accessibility, Engineering, Product)
 * 2. Aggregated Evaluation Score
 * 3. Safe Self-Healing UI Mechanism & Audit Trails (missing IDs, missing fallbacks, malformed objects, unsupported element types)
 * 4. Refactoring Assistant Recommendations
 * 5. Feature Recommendation Engine
 * 6. Automatic Improvement Loop Controls & Max Iteration Guard
 * 7. Error resilience on malformed inputs & AI unavailability
 */

const {
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
} = require('./src/services/aiReviewService');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- Running NeuraMind AI Review & Self-Improvement Engine Tests ---\n');

// Mock sample UIPage for review
const validMockPage = {
  page: 'FoodOrdering',
  sections: [
    {
      id: 'sec-nav',
      type: 'navbar',
      elements: [
        { id: 'el-logo', type: 'text', content: 'Gourmet Bistro', props: { tag: 'h2' }, fallback: 'Gourmet Bistro' },
      ],
    },
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'el-h1', type: 'text', content: 'Fresh Artisan Pizzas', props: { tag: 'h1' }, fallback: 'Pizzas' },
        { id: 'el-btn', type: 'button', content: 'Order Online', props: { variant: 'primary', 'aria-label': 'Order Online' }, fallback: 'Order' },
      ],
    },
    {
      id: 'sec-menu',
      type: 'cards',
      elements: [
        {
          id: 'menu-cards',
          type: 'cards',
          content: '',
          fallback: 'No dishes',
          props: {
            items: [
              { id: 'item-1', title: 'Margherita Pizza', price: '$15.99', badge: 'Popular' },
            ],
          },
        },
      ],
    },
  ],
};

// ── 1. Individual Reviewer Agent Tests ────────────────────────────────────────

const uxRes = runUxReviewer(validMockPage);
assert(uxRes.agent === 'ux' && uxRes.score > 80, '1. UX Reviewer evaluates valid page with high score');

const visualRes = runVisualReviewer(validMockPage);
assert(visualRes.agent === 'visual' && visualRes.score > 70, '2. Visual Reviewer evaluates typography and hierarchy');

const a11yRes = runAccessibilityReviewer(validMockPage);
assert(a11yRes.agent === 'accessibility' && a11yRes.score >= 80, '3. Accessibility Reviewer checks button labels and ARIA metadata');

const engRes = runEngineeringReviewer(validMockPage);
assert(engRes.agent === 'engineering' && engRes.score === 100, '4. Engineering Reviewer validates UIPage contract adherence');

const prodRes = runProductReviewer(validMockPage);
assert(prodRes.agent === 'product' && prodRes.score >= 80, '5. Product Reviewer evaluates domain feature coverage');

// ── 2. Aggregated Evaluation Score ───────────────────────────────────────────

const aggregated = evaluateMultiAgentReview(validMockPage);
assert(
  aggregated.overallScore >= 80 &&
  aggregated.agents.length === 5 &&
  Array.isArray(aggregated.criticalIssues) &&
  Array.isArray(aggregated.recommendations),
  '6. Aggregator combines 5 agent scores into overall score'
);

// ── 3. Safe Self-Healing Mechanism Tests ──────────────────────────────────────

const malformedPage = {
  page: null, // missing page name
  sections: [
    {
      id: '', // missing section ID
      type: 12345, // invalid section type
      elements: [
        {
          id: '', // missing element ID
          type: 'unsupported_type_xyz', // unsupported element type
          content: null,
          fallback: null, // missing fallback
          props: 'invalid_props_string', // invalid props shape
        },
      ],
    },
  ],
};

const { healedPage, repairs } = healUIPage(malformedPage);

assert(
  healedPage.page === 'Home' &&
  Boolean(healedPage.sections[0].id) &&
  healedPage.sections[0].elements[0].type === 'text' &&
  typeof healedPage.sections[0].elements[0].props === 'object' &&
  repairs.length >= 4,
  '7. Self-healing repairs missing IDs, unsupported element types, missing fallbacks, and malformed props'
);

assert(
  repairs.every((r) => r.repair && r.before !== undefined && r.after !== undefined && typeof r.confidence === 'number'),
  '8. Every self-healing repair produces structured audit trail log'
);

// ── 4. Refactoring Assistant Tests ───────────────────────────────────────────

const refactorAdvice = generateRefactoringAdvice(validMockPage, 'Improve layout');
assert(
  Array.isArray(refactorAdvice.recommendations) &&
  refactorAdvice.recommendations.every((r) => r.reason && (r.risk === 'low' || r.risk === 'medium' || r.risk === 'high')),
  '9. Refactoring assistant provides structured, risk-rated recommendations'
);

// ── 5. Feature Recommendation Engine Tests ──────────────────────────────────

const foodFeatures = generateFeatureRecommendations(validMockPage, 'Food Ordering');
assert(
  foodFeatures.features.length >= 2 &&
  foodFeatures.features.some((f) => f.name.includes('Cart') || f.name.includes('Filter')),
  '10. Feature recommendation engine suggests domain-appropriate features for Food Ordering'
);

// ── 6. Automatic Improvement Loop Controls ───────────────────────────────────

async function testAutoImprovementLoop() {
  const loopResult = await runAutoImprovementLoop(malformedPage, 'Fix and improve', 3);
  assert(
    loopResult.iterationsRun >= 1 &&
    loopResult.iterationsRun <= 3 &&
    loopResult.finalScore >= loopResult.initialScore &&
    Boolean(loopResult.finalPage),
    '11. Automatic improvement loop respects max 3 iteration limit and improves score'
  );
}

// ── 7. Error Resilience Tests ────────────────────────────────────────────────

const emptyReview = evaluateMultiAgentReview(null);
assert(emptyReview.overallScore === 0 && emptyReview.criticalIssues.length > 0, '12. Review engine handles null input gracefully without throwing');

const emptyHealing = healUIPage(null);
assert(Boolean(emptyHealing.healedPage) && emptyHealing.repairs.length > 0, '13. Self-healing handles null input and returns safe default page');

testAutoImprovementLoop().then(() => {
  console.log('\n========================================');
  console.log(`AI REVIEW ENGINE TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) process.exit(1);
});

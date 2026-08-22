/**
 * NeuraMind — Generation Quality Gate Test Suite
 *
 * Tests:
 *  1–6:   Domain detection (food, travel, fashion, saas, realestate, auth)
 *  7–9:   Quality Gate pass/fail on valid and invalid pages
 * 10–11:  Self-healing integration within the gate
 * 12–14:  Domain CTA/image/section requirements
 * 15–16:  Image relevance guard (SaaS rejects food photos)
 * 17–19:  Design-to-prompt match scoring
 * 20–25:  Error resilience (malformed output, missing sections, empty input)
 * 26–28:  Metadata attachment
 * 29–30:  Quality-score thresholds
 */

const {
  runGenerationQualityGate,
  detectDomain,
  detectMissingRequiredSections,
  rejectIrrelevantImages,
  QUALITY_THRESHOLD,
  MATCH_THRESHOLD,
} = require('./src/services/generationQualityGate');

const { calculateQualityScore, validateDesignToCode } = require('./src/utils/qualityScorer');
const { validateUIPage } = require('./src/utils/validateUI');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log('\n=== NeuraMind Generation Quality Gate Tests ===\n');

// ── Shared fixtures ───────────────────────────────────────────────────────────

const makePage = (overrides = {}) => ({
  page: 'TestPage',
  sections: [
    {
      id: 'sec-nav',
      type: 'navbar',
      elements: [
        { id: 'el-logo', type: 'text', content: 'BrandName', fallback: 'Brand', props: { tag: 'h2' } },
      ],
    },
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'el-h1', type: 'text', content: 'Amazing Page Title', fallback: 'Title', props: { tag: 'h1' } },
        { id: 'el-cta', type: 'button', content: 'Get Started', fallback: 'Click', props: { variant: 'primary' } },
        {
          id: 'el-img',
          type: 'image',
          content: { src: 'https://images.unsplash.com/photo-1513104890138', alt: 'Hero', imageQuery: 'product hero' },
          fallback: 'Image',
          props: { src: 'https://images.unsplash.com/photo-1513104890138', alt: 'Hero' },
        },
      ],
    },
    {
      id: 'sec-features',
      type: 'features',
      elements: [
        { id: 'el-h2', type: 'text', content: 'Why Choose Us', fallback: 'Features', props: { tag: 'h2' } },
        {
          id: 'el-cards',
          type: 'cards',
          content: '',
          fallback: 'Cards',
          props: {
            columns: 3,
            items: [
              { id: 'item-1', title: 'Feature One', description: 'Description one', price: '$9.99', badge: 'Popular', imageQuery: 'feature product', icon: 'pi pi-star' },
              { id: 'item-2', title: 'Feature Two', description: 'Description two', badge: 'New', imageQuery: 'feature product two', icon: 'pi pi-check' },
            ],
          },
        },
      ],
    },
    {
      id: 'sec-footer',
      type: 'footer',
      elements: [
        { id: 'el-footer-text', type: 'text', content: '© 2024 BrandName', fallback: 'Footer', props: { tag: 'p' } },
      ],
    },
  ],
  ...overrides,
});

const foodPage = makePage({
  page: 'FoodOrdering',
  sections: [
    ...makePage().sections.slice(0, 3),
    {
      id: 'sec-menu',
      type: 'cards',
      elements: [
        {
          id: 'el-menu-cards',
          type: 'cards',
          content: '',
          fallback: 'Menu',
          props: {
            columns: 3,
            items: [
              { id: 'food-1', title: 'Margherita Pizza', description: 'Wood-fired', price: '$15.99', badge: 'Best Seller', imageQuery: 'margherita pizza', icon: 'pi pi-star' },
              { id: 'food-2', title: 'Beef Burger', description: 'Gourmet', price: '$12.99', badge: 'Popular', imageQuery: 'gourmet burger', icon: 'pi pi-check' },
            ],
          },
        },
      ],
    },
    makePage().sections[3],
  ],
});

const saasMaliciousPage = {
  page: 'SaaS Dashboard',
  sections: [
    {
      id: 'sec-nav',
      type: 'navbar',
      elements: [
        { id: 'el-logo', type: 'text', content: 'DataFlow', fallback: 'DataFlow', props: { tag: 'h2' } },
      ],
    },
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'el-h1', type: 'text', content: 'Analytics Dashboard', fallback: 'Dashboard', props: { tag: 'h1' } },
        // Bad: food image in a SaaS page
        {
          id: 'el-img',
          type: 'image',
          content: { src: 'https://images.unsplash.com/photo-1513104890138', alt: 'pizza image', imageQuery: 'pizza food restaurant' },
          fallback: 'Image',
          props: { src: 'https://images.unsplash.com/photo-1513104890138', alt: 'pizza image', imageQuery: 'pizza food restaurant' },
        },
        { id: 'el-cta', type: 'button', content: 'Start Free Trial', fallback: 'Trial', props: { variant: 'primary' } },
      ],
    },
    {
      id: 'sec-footer',
      type: 'footer',
      elements: [{ id: 'el-f', type: 'text', content: '© 2024 DataFlow', fallback: 'Footer', props: { tag: 'p' } }],
    },
  ],
};

// ── 1–6: Domain detection ─────────────────────────────────────────────────────
console.log('--- Domain Detection ---');
assert(detectDomain('Build a food ordering website for pizza delivery')?.name === 'food', '1. Detects food domain');
assert(detectDomain('Create a travel booking site for luxury resorts')?.name === 'travel', '2. Detects travel domain');
assert(detectDomain('Design an e-commerce fashion store for clothing')?.name === 'fashion', '3. Detects fashion domain');
assert(detectDomain('Build a SaaS analytics dashboard')?.name === 'saas', '4. Detects SaaS domain');
assert(detectDomain('Luxury real estate property listing website')?.name === 'realestate', '5. Detects real estate domain');
assert(detectDomain('User signup and login authentication page')?.name === 'auth', '6. Detects auth domain');

// ── 7–9: Quality Gate pass/fail ───────────────────────────────────────────────
console.log('\n--- Quality Gate Pass/Fail ---');
const validGate = runGenerationQualityGate(makePage(), 'Product landing page');
assert(validGate.qualityScore >= QUALITY_THRESHOLD, `7. Valid page passes quality threshold (score=${validGate.qualityScore})`);
assert(typeof validGate.matchScore === 'number' && validGate.matchScore >= 0, '8. Match score is computed for valid page');

const emptyGate = runGenerationQualityGate(null, 'any prompt');
assert(emptyGate.passed === false, '9. Null page fails quality gate without throwing');

// ── 10–11: Self-healing within gate ──────────────────────────────────────────
console.log('\n--- Self-Healing Integration ---');
const malformedPage = {
  page: null,
  sections: [
    {
      id: '',
      type: 'hero',
      elements: [
        { id: '', type: 'unsupported_xyz', content: null, fallback: null, props: 'bad_props' },
        { id: 'el-btn', type: 'button', content: 'Click', fallback: 'Click', props: { variant: 'primary' } },
      ],
    },
    { id: 'sec-footer', type: 'footer', elements: [{ id: 'el-f', type: 'text', content: 'Footer', fallback: 'Footer', props: {} }] },
  ],
};
const healedGate = runGenerationQualityGate(malformedPage, 'simple landing page');
assert(healedGate.repairsApplied.length > 0, '10. Self-healing produces repair audit trail on malformed page');
assert(Boolean(healedGate.page) && healedGate.page.sections.length > 0, '11. Healed page is valid and non-empty');

// ── 12–14: Domain requirements ───────────────────────────────────────────────
console.log('\n--- Domain Requirement Checks ---');
const foodDomainRule = detectDomain('food ordering website');
const foodMissingResult = detectMissingRequiredSections({ page: 'Food', sections: [{ id: 's1', type: 'hero', elements: [{ id: 'e1', type: 'text', content: 'Hello', fallback: 'Hello', props: {} }] }] }, foodDomainRule);
assert(foodMissingResult.some((m) => m.includes('CTA') || m.includes('menu')), '12. Detects missing CTA on food page with no buttons');

const authDomainRule = detectDomain('user signup page');
const authPage = { page: 'Auth', sections: [{ id: 's1', type: 'hero', elements: [{ id: 'btn', type: 'button', content: 'Sign Up', fallback: 'Sign Up', props: {} }] }] };
const authMissing = detectMissingRequiredSections(authPage, authDomainRule);
assert(authMissing.some((m) => m.includes('input')), '13. Detects missing form inputs on auth page');

const foodGate = runGenerationQualityGate(foodPage, 'food ordering website with pizza menu');
assert(foodGate.qualityScore >= QUALITY_THRESHOLD, `14. Food page with menu cards passes quality gate (score=${foodGate.qualityScore})`);

// ── 15–16: Image relevance guard ─────────────────────────────────────────────
console.log('\n--- Image Relevance Guard ---');
const saasDomain = detectDomain('saas analytics dashboard');
const cleanedSaas = rejectIrrelevantImages(saasMaliciousPage, saasDomain);
const heroImages = cleanedSaas.sections.find((s) => s.type === 'hero')?.elements?.filter((el) => el.type === 'image') || [];
assert(
  heroImages.length === 0 || !heroImages.some((img) => (img.content?.imageQuery || img.props?.imageQuery || '').includes('pizza')),
  '15. Image relevance guard removes food imagery from SaaS page'
);

const foodDomainRule2 = detectDomain('food ordering website');
const originalFoodPage = JSON.parse(JSON.stringify(foodPage));
const guardedFoodPage = rejectIrrelevantImages(originalFoodPage, foodDomainRule2);
// Food domain has no block list — page should pass through unmodified
const origSections = JSON.stringify(originalFoodPage.sections);
const guardedSections = JSON.stringify(guardedFoodPage.sections);
assert(origSections === guardedSections, '16. Food imagery is NOT removed from food domain pages (no block list applies)');

// ── 17–19: Design-to-prompt match ────────────────────────────────────────────
console.log('\n--- Design-to-Prompt Match ---');
const matchResult = validateDesignToCode('food ordering with order button and menu cards', foodPage);
assert(matchResult.matchScore >= MATCH_THRESHOLD, `17. Food page matches food prompt (match=${matchResult.matchScore})`);

const mismatchResult = validateDesignToCode('food ordering website', { page: 'Empty', sections: [{ id: 's1', type: 'hero', elements: [{ id: 'e1', type: 'text', content: 'Hello', fallback: 'Hello', props: {} }] }] });
assert(mismatchResult.missingCTAs.length > 0 || mismatchResult.matchScore < 100, '18. Missing CTA detected on page without buttons');

const saasPage = makePage({ page: 'SaaSDashboard' });
const saasMatch = validateDesignToCode('build a saas analytics dashboard', saasPage);
assert(typeof saasMatch.matchScore === 'number', '19. Match score is numeric for any prompt/page combination');

// ── 20–25: Error resilience ───────────────────────────────────────────────────
console.log('\n--- Error Resilience ---');
assert(runGenerationQualityGate(undefined, 'food site').passed === false, '20. Undefined input fails safely without throw');
assert(runGenerationQualityGate({}, 'food site').passed === false, '21. Empty object input fails safely without throw');
assert(runGenerationQualityGate({ page: 'Test', sections: [] }, 'food site').passed === false, '22. Empty sections fails quality gate');

const qualOnlyText = runGenerationQualityGate({ page: 'Test', sections: [{ id: 'sec-1', type: 'hero', elements: [{ id: 'el-1', type: 'text', content: 'Hello', fallback: 'Hello', props: {} }] }] }, '');
assert(typeof qualOnlyText.qualityScore === 'number', '23. Minimal one-element page scores without crashing');

const objectContentPage = makePage({
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'el-obj', type: 'text', content: { id: 'pizza', label: 'Pizza' }, fallback: 'Pizza', props: { tag: 'h1' } },
        { id: 'el-btn', type: 'button', content: 'Order Now', fallback: 'Order', props: { variant: 'primary' } },
      ],
    },
  ],
});
const objGate = runGenerationQualityGate(objectContentPage, 'food ordering');
assert(Boolean(objGate.page), '24. Object-as-content elements pass through gate without crashing');

const noImgGate = runGenerationQualityGate({ page: 'Test', sections: [{ id: 's1', type: 'features', elements: [{ id: 'e1', type: 'text', content: 'Feature', fallback: 'Feature', props: { tag: 'h2' } }, { id: 'e2', type: 'button', content: 'Click', fallback: 'Click', props: {} }] }] }, 'saas dashboard');
assert(typeof noImgGate.qualityScore === 'number', '25. Pages without images are scored without crashing (image score defaults safely)');

// ── 26–28: Gate metadata ──────────────────────────────────────────────────────
console.log('\n--- Gate Result Metadata ---');
const metaGate = runGenerationQualityGate(makePage(), 'product landing page');
assert(typeof metaGate.qualityGrade === 'string' && ['A','B','C','D','F'].includes(metaGate.qualityGrade), '26. Quality grade is one of A/B/C/D/F');
assert(Array.isArray(metaGate.repairsApplied), '27. repairsApplied is always an array');
assert(Array.isArray(metaGate.issues) && Array.isArray(metaGate.recommendations), '28. issues and recommendations are always arrays');

// ── 29–30: Threshold verification ────────────────────────────────────────────
console.log('\n--- Quality Threshold Verification ---');
assert(QUALITY_THRESHOLD === 55, `29. QUALITY_THRESHOLD is 55 (got ${QUALITY_THRESHOLD})`);
assert(MATCH_THRESHOLD === 60, `30. MATCH_THRESHOLD is 60 (got ${MATCH_THRESHOLD})`);

console.log('\n========================================');
console.log(`QUALITY GATE TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) process.exit(1);

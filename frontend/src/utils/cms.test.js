/**
 * NeuraMind — CMS Data Foundation & Reusable Component Test Suite
 *
 * Runs headless assertions against:
 * 1. Text element (string + object payload)
 * 2. Image element (src + alt + fallback)
 * 3. Button element (label + variant + fallback)
 * 4. Textfield element (label + placeholder + fallback)
 * 5. Cards with loop items (array data binding + stable IDs)
 * 6. Missing optional content (fallback hierarchy)
 * 7. Stable IDs & deterministic binding roundtrips
 */

import assert from 'node:assert/strict';
import {
  ELEMENT_TYPES,
  createRepeatingElement,
} from '../types/ui.js';
import {
  resolveCmsContent,
  normalizeToUiElement,
  extractCmsData,
  bindCmsData,
  updateElementContent,
} from '../types/cms.js';
import {
  generateStableId,
  ensureStableIds,
  getDefaultCmsContent,
} from './cms.js';
import {
  EXAMPLE_TEXT_ELEMENT,
  EXAMPLE_IMAGE_ELEMENT,
  EXAMPLE_BUTTON_ELEMENT,
  EXAMPLE_TEXTFIELD_ELEMENT,
  EXAMPLE_CARDS_ELEMENT,
  EXAMPLE_FALLBACK_ELEMENT,
  EXAMPLE_CMS_BOUND_PAGE,
  EXAMPLE_CMS_OVERRIDE_MAP,
} from '../types/cmsExamples.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n--- Running NeuraMind Task D: CMS Data Foundation Tests ---\n');

// ─── TEST 1: Text Element ───────────────────────────────────────────────────
runTest('1. Text Element: Resolves structured { text } and primitive strings', () => {
  const resolvedObj = resolveCmsContent(EXAMPLE_TEXT_ELEMENT.content, EXAMPLE_TEXT_ELEMENT.fallback);
  assert.equal(resolvedObj, 'Build faster with NeuraMind');

  const normalized = normalizeToUiElement(EXAMPLE_TEXT_ELEMENT);
  assert.equal(normalized.id, 'hero-title');
  assert.equal(normalized.type, ELEMENT_TYPES.TEXT);
  assert.equal(normalized.content, 'Build faster with NeuraMind');
  assert.equal(normalized.fallback, 'Build faster with AI');

  // Direct string test
  const directStrEl = { id: 't1', type: 'text', content: 'Direct String Content', fallback: 'Fallback' };
  assert.equal(resolveCmsContent(directStrEl.content, directStrEl.fallback), 'Direct String Content');
});

// ─── TEST 2: Image Element ──────────────────────────────────────────────────
runTest('2. Image Element: Preserves src, alt, and fallback metadata', () => {
  const normalized = normalizeToUiElement(EXAMPLE_IMAGE_ELEMENT);
  assert.equal(normalized.id, 'hero-banner-image');
  assert.equal(normalized.type, ELEMENT_TYPES.IMAGE);
  assert.equal(normalized.props.src, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80');
  assert.equal(normalized.props.alt, 'NeuraMind AI Generator Workspace Preview');
  assert.equal(normalized.fallback, 'AI Dashboard Preview');
});

// ─── TEST 3: Button Element ─────────────────────────────────────────────────
runTest('3. Button Element: Resolves label, variant, and fallback', () => {
  const normalized = normalizeToUiElement(EXAMPLE_BUTTON_ELEMENT);
  assert.equal(normalized.id, 'hero-cta-button');
  assert.equal(normalized.type, ELEMENT_TYPES.BUTTON);
  assert.equal(normalized.content, 'Get Started Free');
  assert.equal(normalized.props.variant, 'primary');
  assert.equal(normalized.fallback, 'Get Started');
});

// ─── TEST 4: Textfield Element ──────────────────────────────────────────────
runTest('4. Textfield Element: Resolves label, placeholder, and inputType', () => {
  const normalized = normalizeToUiElement(EXAMPLE_TEXTFIELD_ELEMENT);
  assert.equal(normalized.id, 'prompt-input-field');
  assert.equal(normalized.type, ELEMENT_TYPES.TEXTFIELD);
  assert.equal(normalized.props.label, 'Describe your UI prompt');
  assert.equal(normalized.props.placeholder, 'e.g. A modern SaaS analytics dashboard with dark mode...');
  assert.equal(normalized.props.inputType, 'text');
});

// ─── TEST 5: Cards with Loop Items ──────────────────────────────────────────
runTest('5. Cards Element: Uses repeating data array with stable item IDs', () => {
  assert.equal(Array.isArray(EXAMPLE_CARDS_ELEMENT.items), true);
  assert.equal(EXAMPLE_CARDS_ELEMENT.items.length, 3);
  assert.equal(EXAMPLE_CARDS_ELEMENT.items[0].id, 'card-1');
  assert.equal(EXAMPLE_CARDS_ELEMENT.items[1].id, 'card-2');
  assert.equal(EXAMPLE_CARDS_ELEMENT.items[2].id, 'card-3');

  const normalized = normalizeToUiElement(EXAMPLE_CARDS_ELEMENT);
  assert.equal(normalized.type, ELEMENT_TYPES.CARDS);
  assert.equal(Array.isArray(normalized.props.items), true);
  assert.equal(normalized.props.items.length, 3);
  assert.equal(normalized.props.items[0].title, 'Lightning Fast');

  // Test createRepeatingElement factory helper
  const repeatHelperEl = createRepeatingElement({
    id: 'test-cards',
    items: [{ id: 'tc-1', title: 'Card Alpha' }],
    props: { columns: 2 },
  });
  assert.equal(repeatHelperEl.id, 'test-cards');
  assert.equal(repeatHelperEl.type, ELEMENT_TYPES.CARDS);
  assert.equal(repeatHelperEl.items.length, 1);
  assert.equal(repeatHelperEl.props.items.length, 1);
});

// ─── TEST 6: Missing Optional Content (Fallback Hierarchy) ───────────────────
runTest('6. Fallback Behavior: Gracefully uses fallback when content is empty or null', () => {
  const emptyText = resolveCmsContent('', 'Default Fallback Value');
  assert.equal(emptyText, 'Default Fallback Value');

  const nullObj = resolveCmsContent(null, 'Null Fallback');
  assert.equal(nullObj, 'Null Fallback');

  const emptyObj = resolveCmsContent({}, 'Empty Object Fallback');
  assert.equal(emptyObj, 'Empty Object Fallback');

  const normalizedFallback = normalizeToUiElement(EXAMPLE_FALLBACK_ELEMENT);
  assert.equal(normalizedFallback.content, 'Flexible Pricing for Every Team');
  assert.equal(normalizedFallback.fallback, 'Flexible Pricing for Every Team');

  const defaults = getDefaultCmsContent(ELEMENT_TYPES.TEXT);
  assert.ok(defaults.content);
  assert.ok(defaults.fallback);
});

// ─── TEST 7: Stable IDs & Deterministic CMS Binding ─────────────────────────
runTest('7. Stable IDs & CMS Data Binding: Deterministic key generation & live re-binding', () => {
  // Check stable ID generator
  const generatedId = generateStableId('features', 'card', 0);
  assert.equal(generatedId, 'features-card-0');

  // Check ensureStableIds on random-generated structure
  const rawPage = {
    page: 'My Page',
    sections: [
      {
        type: 'hero',
        elements: [
          { type: 'text', content: 'Hello' },
          { type: 'cards', items: [{ title: 'One' }, { title: 'Two' }] },
        ],
      },
    ],
  };

  const stabilized = ensureStableIds(rawPage);
  assert.equal(stabilized.id, 'page-my-page');
  assert.equal(stabilized.sections[0].id, 'hero-1');
  assert.equal(stabilized.sections[0].elements[0].id, 'hero-1-text-0');
  assert.equal(stabilized.sections[0].elements[1].id, 'hero-1-cards-1');
  assert.equal(stabilized.sections[0].elements[1].items[0].id, 'hero-1-cards-1-item-1');

  // Check extractCmsData
  const extractedMap = extractCmsData(EXAMPLE_CMS_BOUND_PAGE);
  assert.ok(extractedMap['hero-title']);
  assert.ok(extractedMap['feature-cards']);
  assert.equal(Array.isArray(extractedMap['feature-cards']), true);

  // Check bindCmsData with override map
  const updatedPage = bindCmsData(EXAMPLE_CMS_BOUND_PAGE, EXAMPLE_CMS_OVERRIDE_MAP);
  const heroSection = updatedPage.sections.find((s) => s.id === 'sec-hero');
  const heroTitleEl = heroSection.elements.find((el) => el.id === 'hero-title');
  const heroBtnEl = heroSection.elements.find((el) => el.id === 'hero-cta-button');

  assert.equal(heroTitleEl.content, 'Updated Live CMS: Supercharged UI Generation');
  assert.equal(heroBtnEl.content, 'Launch App Now');

  const featureSection = updatedPage.sections.find((s) => s.id === 'sec-features');
  const cardsEl = featureSection.elements.find((el) => el.id === 'feature-cards');
  assert.equal(cardsEl.items.length, 2);
  assert.equal(cardsEl.items[0].title, 'Ultra High Performance');
});

// ─── TEST 8: updateElementContent Helper ────────────────────────────────────
runTest('8. updateElementContent: Pure helper updates single element by ID', () => {
  const originalPage = EXAMPLE_CMS_BOUND_PAGE;
  const updatedPage = updateElementContent(originalPage, 'hero-title', 'Brand New Hero Title');

  const updatedHeroTitle = updatedPage.sections[0].elements.find((el) => el.id === 'hero-title');
  assert.equal(updatedHeroTitle.content, 'Brand New Hero Title');

  // Verify object content update
  const updatedWithObj = updateElementContent(originalPage, 'hero-cta-button', { label: 'Click to Start' });
  const updatedBtn = updatedWithObj.sections[0].elements.find((el) => el.id === 'hero-cta-button');
  assert.equal(updatedBtn.content, 'Click to Start');
});

// ─── TEST 9: Immutability ───────────────────────────────────────────────────
runTest('9. Immutability: Updating element creates a new structure without mutating original', () => {
  const originalTitleBefore = EXAMPLE_CMS_BOUND_PAGE.sections[0].elements[0].content;
  const updated = updateElementContent(EXAMPLE_CMS_BOUND_PAGE, 'hero-title', 'Mutated Title');

  // Original page must NOT be mutated
  assert.notEqual(updated, EXAMPLE_CMS_BOUND_PAGE);
  assert.notEqual(updated.sections, EXAMPLE_CMS_BOUND_PAGE.sections);
  assert.equal(
    typeof originalTitleBefore === 'object' ? originalTitleBefore.text : originalTitleBefore,
    typeof EXAMPLE_CMS_BOUND_PAGE.sections[0].elements[0].content === 'object'
      ? EXAMPLE_CMS_BOUND_PAGE.sections[0].elements[0].content.text
      : EXAMPLE_CMS_BOUND_PAGE.sections[0].elements[0].content
  );
  // Unrelated elements must remain intact
  const originalSubtitle = EXAMPLE_CMS_BOUND_PAGE.sections[0].elements[1].content;
  const updatedSubtitle = updated.sections[0].elements[1].content;
  assert.equal(
    typeof originalSubtitle === 'object' ? originalSubtitle.text : originalSubtitle,
    typeof updatedSubtitle === 'object' ? updatedSubtitle.text : updatedSubtitle
  );
});

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

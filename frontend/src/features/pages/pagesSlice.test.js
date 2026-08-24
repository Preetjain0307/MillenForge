/**
 * NeuraMindss — Task E1: CMS Element Editing & Redux Integration Test Suite
 *
 * Verifies:
 * 1. Element selection by ID via Redux actions
 * 2. Reading element content via selectors & lookup helpers
 * 3. Updating text element content via Redux
 * 4. Updating button element label & variant via Redux
 * 5. Updating image element src, alt, and fallback via Redux
 * 6. Updating textfield element label & placeholder via Redux
 * 7. Updating repeating card items via Redux
 * 8. Preserving unrelated elements during updates (strict element isolation)
 * 9. Preserving fallback content hierarchy
 * 10. Ensuring Redux state remains a valid UIPage matching schema
 * 11. Immutability of page and section references
 */

import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import pagesReducer, {
  setPage,
  setActivePage,
  selectElement,
  clearSelectedElement,
  updateElement,
  updateRepeatingItemInPage,
  selectPageByName,
  selectSelectedElementId,
  selectElementById,
  selectActiveSelectedElement,
} from './pagesSlice.js';
import {
  findElementById,
  getElementContent,
  updateElementContent,
  updateRepeatingItem,
} from '../../types/cms.js';
import {
  EXAMPLE_CMS_BOUND_PAGE,
} from '../../types/cmsExamples.js';
import { validateUiPage } from '../../utils/validateUi.js';

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

console.log('\n--- Running NeuraMindss Task E1: CMS Element Editing + Redux Tests ---\n');

// ─── Setup Store Helper ──────────────────────────────────────────────────────
const createTestStore = (initialPage = EXAMPLE_CMS_BOUND_PAGE) => {
  const store = configureStore({
    reducer: {
      pages: pagesReducer,
    },
  });
  if (initialPage) {
    store.dispatch(setPage({ pageName: initialPage.page, data: initialPage }));
    store.dispatch(setActivePage(initialPage.page));
  }
  return store;
};

// ─── 1. Element Selection ────────────────────────────────────────────────────
runTest('1. Element Selection: Select and clear element by stable ID in Redux', () => {
  const store = createTestStore();
  assert.equal(selectSelectedElementId(store.getState()), null);

  store.dispatch(selectElement('hero-title'));
  assert.equal(selectSelectedElementId(store.getState()), 'hero-title');

  const selectedEl = selectActiveSelectedElement(store.getState());
  assert.ok(selectedEl);
  assert.equal(selectedEl.id, 'hero-title');
  assert.equal(selectedEl.type, 'text');

  store.dispatch(clearSelectedElement());
  assert.equal(selectSelectedElementId(store.getState()), null);
  assert.equal(selectActiveSelectedElement(store.getState()), null);
});

// ─── 2. Reading Content by Element ID ────────────────────────────────────────
runTest('2. Reading Content: Helper & selector accurately read element data', () => {
  const store = createTestStore();
  const el = selectElementById('Landing Page', 'hero-title')(store.getState());
  assert.ok(el);
  assert.equal(el.id, 'hero-title');

  const contentMeta = getElementContent(store.getState().pages.pages['Landing Page'], 'hero-cta-button');
  assert.ok(contentMeta);
  assert.equal(contentMeta.id, 'hero-cta-button');
  assert.equal(contentMeta.type, 'button');
  assert.equal(contentMeta.fallback, 'Get Started');
});

// ─── 3. Updating Text Element ────────────────────────────────────────────────
runTest('3. Update Text: Redux dispatch updates text content cleanly', () => {
  const store = createTestStore();

  store.dispatch(
    updateElement({
      pageName: 'Landing Page',
      elementId: 'hero-title',
      newContent: 'New AI Powered Heading',
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const updatedHeroTitle = findElementById(updatedPage, 'hero-title');
  assert.equal(updatedHeroTitle.content, 'New AI Powered Heading');

  // Validate that updated page remains schema valid
  const validation = validateUiPage(updatedPage);
  assert.equal(validation.valid, true);
});

// ─── 4. Updating Button Label ────────────────────────────────────────────────
runTest('4. Update Button: Redux dispatch updates button label & props', () => {
  const store = createTestStore();

  store.dispatch(
    updateElement({
      pageName: 'Landing Page',
      elementId: 'hero-cta-button',
      newContent: { label: 'Explore Free Demo', variant: 'secondary' },
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const updatedBtn = findElementById(updatedPage, 'hero-cta-button');
  assert.equal(updatedBtn.content, 'Explore Free Demo');
  assert.equal(updatedBtn.fallback, 'Get Started');
});

// ─── 5. Updating Image Content ───────────────────────────────────────────────
runTest('5. Update Image: Redux dispatch updates image src and alt', () => {
  const store = createTestStore();

  store.dispatch(
    updateElement({
      pageName: 'Landing Page',
      elementId: 'hero-banner-image',
      newContent: {
        src: 'https://images.unsplash.com/photo-custom?w=1000',
        alt: 'Updated Workspace Dashboard',
      },
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const updatedImg = findElementById(updatedPage, 'hero-banner-image');
  assert.equal(updatedImg.props.src, 'https://images.unsplash.com/photo-custom?w=1000');
  assert.equal(updatedImg.props.alt, 'Updated Workspace Dashboard');
  assert.equal(updatedImg.fallback, 'AI Dashboard Preview');
});

// ─── 6. Updating Textfield Content ───────────────────────────────────────────
runTest('6. Update Textfield: Redux dispatch updates label & placeholder', () => {
  const store = createTestStore();

  store.dispatch(
    updateElement({
      pageName: 'Landing Page',
      elementId: 'prompt-input-field',
      newContent: {
        label: 'Enter your custom prompt',
        placeholder: 'e.g. Modern CRM dashboard',
      },
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const updatedField = findElementById(updatedPage, 'prompt-input-field');
  assert.equal(updatedField.props.label, 'Enter your custom prompt');
  assert.equal(updatedField.props.placeholder, 'e.g. Modern CRM dashboard');
});

// ─── 7. Updating Repeating Card Item ────────────────────────────────────────
runTest('7. Update Card Item: Redux dispatch updates single item within repeating cards', () => {
  const store = createTestStore();

  store.dispatch(
    updateRepeatingItemInPage({
      pageName: 'Landing Page',
      elementId: 'feature-cards',
      itemId: 'card-2',
      updatedItem: {
        title: 'Updated Card Title 2',
        description: 'Updated description for card item 2',
        badge: 'Upgraded',
      },
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const cardsEl = findElementById(updatedPage, 'feature-cards');
  assert.equal(cardsEl.items.length, 3);
  assert.equal(cardsEl.items[1].id, 'card-2');
  assert.equal(cardsEl.items[1].title, 'Updated Card Title 2');
  assert.equal(cardsEl.items[1].description, 'Updated description for card item 2');
  assert.equal(cardsEl.items[1].badge, 'Upgraded');

  // Other card items must remain unchanged
  assert.equal(cardsEl.items[0].title, 'Lightning Fast');
  assert.equal(cardsEl.items[2].title, 'CMS Data Binding');
});

// ─── 8. Preserving Unrelated Elements ───────────────────────────────────────
runTest('8. Isolation: Updating an element leaves all unrelated elements untouched', () => {
  const store = createTestStore();
  const originalSubtitle = findElementById(EXAMPLE_CMS_BOUND_PAGE, 'hero-subtitle').content;
  const originalPromptField = findElementById(EXAMPLE_CMS_BOUND_PAGE, 'prompt-input-field').props.label;

  store.dispatch(
    updateElement({
      pageName: 'Landing Page',
      elementId: 'hero-title',
      newContent: 'Only Title Has Changed',
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  assert.equal(findElementById(updatedPage, 'hero-title').content, 'Only Title Has Changed');
  assert.deepEqual(
    findElementById(updatedPage, 'hero-subtitle').content,
    originalSubtitle
  );
  assert.equal(
    findElementById(updatedPage, 'prompt-input-field').props.label,
    originalPromptField
  );
});

// ─── 9. Preserving Fallback Content ──────────────────────────────────────────
runTest('9. Fallbacks: Safe fallback values are strictly preserved', () => {
  const store = createTestStore();

  store.dispatch(
    updateElement({
      pageName: 'Landing Page',
      elementId: 'pricing-headline',
      newContent: '', // Intentionally empty to test fallback preservation
    })
  );

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const el = findElementById(updatedPage, 'pricing-headline');
  assert.equal(el.fallback, 'Flexible Pricing for Every Team');
});

// ─── 10. UIPage Contract Conformance ────────────────────────────────────────
runTest('10. Contract Conformance: Page remains valid against validateUiPage validator', () => {
  const store = createTestStore();

  // Perform multiple edits across different elements
  store.dispatch(updateElement({ pageName: 'Landing Page', elementId: 'hero-title', newContent: 'Title V2' }));
  store.dispatch(updateElement({ pageName: 'Landing Page', elementId: 'hero-cta-button', newContent: { label: 'Go V2' } }));
  store.dispatch(updateRepeatingItemInPage({
    pageName: 'Landing Page',
    elementId: 'feature-cards',
    itemId: 'card-1',
    updatedItem: { title: 'Fast V2' },
  }));

  const updatedPage = selectPageByName('Landing Page')(store.getState());
  const validationResult = validateUiPage(updatedPage);
  assert.equal(validationResult.valid, true);
  assert.equal(validationResult.errors.length, 0);
});

// ─── 11. Immutability ───────────────────────────────────────────────────────
runTest('11. Immutability: Pure functions return new object references', () => {
  const pageA = EXAMPLE_CMS_BOUND_PAGE;
  const pageB = updateElementContent(pageA, 'hero-title', 'Immutability Check');

  assert.notEqual(pageA, pageB);
  assert.notEqual(pageA.sections, pageB.sections);
  assert.notEqual(pageA.sections[0].elements, pageB.sections[0].elements);

  const pageC = updateRepeatingItem(pageA, 'feature-cards', 'card-1', { title: 'Card 1 Immutability' });
  assert.notEqual(pageA, pageC);
  assert.notEqual(pageA.sections[1].elements, pageC.sections[1].elements);
});

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

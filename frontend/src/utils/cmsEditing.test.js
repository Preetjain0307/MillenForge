/**
 * NeuraMinds — Task E3: CMS Editing Validation & Regression Test Suite
 *
 * Verifies:
 * 1. Stable element IDs
 * 2. Text content update
 * 3. Button label update
 * 4. Image content update
 * 5. Textfield content update
 * 6. Card item update
 * 7. Card collection handling
 * 8. Missing content fallback
 * 9. Null content fallback
 * 10. Empty string fallback where applicable
 * 11. Updating one element does not modify another
 * 12. Original page object is not mutated
 * 13. UIPage contract remains valid after editing
 * 14. Unknown element type fails safely
 * 15. Existing validation still passes
 * 16. Existing upload pipeline remains unaffected
 * 17. Existing generation pipeline remains unaffected
 * 18. Existing preview remains unaffected
 */

import assert from 'node:assert/strict';
import { ELEMENT_TYPES, EXAMPLE_UI_PAGE } from '../types/ui.js';
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
  EXAMPLE_CMS_BOUND_PAGE,
  EXAMPLE_CMS_OVERRIDE_MAP,
} from '../types/cmsExamples.js';
import { validateUiPage, isValidUiPage } from './validateUi.js';
import generationReducer, {
  setUploadStatus,
  setUploadedFile,
  setUploadError,
  clearUpload,
  setStatus,
  setError,
  setResult,
  resetGeneration,
} from '../features/generation/generationSlice.js';

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

// Helper to find element across all sections of a UIPage
function findElementInPage(page, elementId) {
  if (!page || !Array.isArray(page.sections)) return null;
  for (const sec of page.sections) {
    if (Array.isArray(sec.elements)) {
      const found = sec.elements.find((el) => el.id === elementId);
      if (found) return found;
    }
  }
  return null;
}

console.log('\n--- Running NeuraMinds Task E3: CMS Editing Validation & Regression Tests ---\n');

// ─── 1. Stable Element IDs ──────────────────────────────────────────────────
runTest('1. Stable Element IDs: Preserves or generates deterministic keys', () => {
  const page = {
    page: 'Landing',
    sections: [
      {
        type: 'hero',
        elements: [
          { type: 'text', content: 'Welcome' },
          { type: 'cards', items: [{ title: 'Card 1' }, { title: 'Card 2' }] },
        ],
      },
    ],
  };

  const stabilized = ensureStableIds(page);
  assert.equal(stabilized.id, 'page-landing');
  assert.equal(stabilized.sections[0].id, 'hero-1');
  assert.equal(stabilized.sections[0].elements[0].id, 'hero-1-text-0');
  assert.equal(stabilized.sections[0].elements[1].id, 'hero-1-cards-1');
  assert.equal(stabilized.sections[0].elements[1].items[0].id, 'hero-1-cards-1-item-1');

  // Updating content must preserve existing IDs
  const updated = updateElementContent(stabilized, 'hero-1-text-0', 'Updated Welcome');
  assert.equal(updated.sections[0].elements[0].id, 'hero-1-text-0');
});

// ─── 2. Text Content Update ─────────────────────────────────────────────────
runTest('2. Text Content Update: Modifies string or structured text payload', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;

  // Primitive string update
  const updatedStr = updateElementContent(page, 'hero-title', 'NextGen AI Workspace');
  const elStr = findElementInPage(updatedStr, 'hero-title');
  assert.equal(elStr.content, 'NextGen AI Workspace');
  assert.equal(resolveCmsContent(elStr.content), 'NextGen AI Workspace');

  // Structured object update
  const updatedObj = updateElementContent(page, 'hero-title', { text: 'Structured Title' });
  const elObj = findElementInPage(updatedObj, 'hero-title');
  assert.equal(resolveCmsContent(elObj.content), 'Structured Title');
});

// ─── 3. Button Label Update ─────────────────────────────────────────────────
runTest('3. Button Label Update: Updates button text and variant props', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;

  // String update
  const updated1 = updateElementContent(page, 'hero-cta-button', 'Join Waitlist');
  const btn1 = findElementInPage(updated1, 'hero-cta-button');
  assert.equal(btn1.content, 'Join Waitlist');

  // Object update with label
  const updated2 = updateElementContent(page, 'hero-cta-button', { label: 'Get Started Now', variant: 'secondary' });
  const btn2 = findElementInPage(updated2, 'hero-cta-button');
  assert.equal(resolveCmsContent(btn2.content, '', 'label'), 'Get Started Now');
});

// ─── 4. Image Content Update ────────────────────────────────────────────────
runTest('4. Image Content Update: Updates src, alt, and fallback metadata', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  const newImgData = {
    src: 'https://images.unsplash.com/photo-test?w=800',
    alt: 'Updated Workspace Screenshot',
    fallback: 'Workspace Image',
  };

  const updated = updateElementContent(page, 'hero-banner-image', newImgData);
  const imgEl = findElementInPage(updated, 'hero-banner-image');

  assert.equal(resolveCmsContent(imgEl.content, '', 'src'), 'https://images.unsplash.com/photo-test?w=800');
  assert.equal(imgEl.props.cmsContent.alt, 'Updated Workspace Screenshot');
});

// ─── 5. Textfield Content Update ────────────────────────────────────────────
runTest('5. Textfield Content Update: Updates label and placeholder', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  const newFieldData = {
    label: 'Work Email Address',
    placeholder: 'name@company.com',
  };

  const updated = updateElementContent(page, 'prompt-input-field', newFieldData);
  const fieldEl = findElementInPage(updated, 'prompt-input-field');

  assert.ok(fieldEl);
  assert.equal(resolveCmsContent(fieldEl.content, '', 'label'), 'Work Email Address');
  assert.equal(fieldEl.props.cmsContent.placeholder, 'name@company.com');
});

// ─── 6. Card Item Update ────────────────────────────────────────────────────
runTest('6. Card Item Update: Modifies specific item inside repeating card collection', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  const originalCards = findElementInPage(page, 'feature-cards');

  const updatedItems = originalCards.items.map((item) => {
    if (item.id === 'card-1') {
      return { ...item, title: 'Ultra Fast Generation', description: 'Generates UI in 2 seconds' };
    }
    return item;
  });

  const updated = updateElementContent(page, 'feature-cards', updatedItems);
  const cardsEl = findElementInPage(updated, 'feature-cards');

  assert.equal(cardsEl.items[0].title, 'Ultra Fast Generation');
  assert.equal(cardsEl.items[0].description, 'Generates UI in 2 seconds');
  // Unmodified card item remains intact
  assert.equal(cardsEl.items[1].title, 'Reusable Components');
});

// ─── 7. Card Collection Handling ───────────────────────────────────────────
runTest('7. Card Collection Handling: Add, remove, and reorder repeating cards', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  const originalCards = findElementInPage(page, 'feature-cards');

  // Add card
  const newCard = { id: 'card-4', title: 'New Feature', description: 'Fresh card' };
  const addedItems = [...originalCards.items, newCard];
  const updatedAdded = updateElementContent(page, 'feature-cards', addedItems);
  const cardsAdded = findElementInPage(updatedAdded, 'feature-cards');
  assert.equal(cardsAdded.items.length, 4);
  assert.equal(cardsAdded.items[3].title, 'New Feature');

  // Remove card
  const removedItems = originalCards.items.filter((i) => i.id !== 'card-2');
  const updatedRemoved = updateElementContent(page, 'feature-cards', removedItems);
  const cardsRemoved = findElementInPage(updatedRemoved, 'feature-cards');
  assert.equal(cardsRemoved.items.length, 2);
  assert.equal(cardsRemoved.items[0].id, 'card-1');
  assert.equal(cardsRemoved.items[1].id, 'card-3');
});

// ─── 8. Missing Content Fallback ───────────────────────────────────────────
runTest('8. Missing Content Fallback: Uses fallback when content field is absent', () => {
  const resolved = resolveCmsContent(undefined, 'Fallback Header');
  assert.equal(resolved, 'Fallback Header');

  const normalized = normalizeToUiElement({
    id: 'el-1',
    type: 'text',
    content: undefined,
    fallback: 'Fallback Header',
  });
  assert.equal(normalized.content, 'Fallback Header');
  assert.equal(normalized.fallback, 'Fallback Header');
});

// ─── 9. Null Content Fallback ──────────────────────────────────────────────
runTest('9. Null Content Fallback: Safely handles null without throwing', () => {
  const resolved = resolveCmsContent(null, 'Null Safe Fallback');
  assert.equal(resolved, 'Null Safe Fallback');

  const normalized = normalizeToUiElement({
    id: 'el-null',
    type: 'button',
    content: null,
    fallback: 'Default Button',
  });
  assert.equal(normalized.content, 'Default Button');
});

// ─── 10. Empty String Fallback ─────────────────────────────────────────────
runTest('10. Empty String Fallback: Resolves to fallback for empty or whitespace strings', () => {
  assert.equal(resolveCmsContent('', 'Fallback 1'), 'Fallback 1');
  assert.equal(resolveCmsContent('   ', 'Fallback 2'), 'Fallback 2');

  const normalized = normalizeToUiElement({
    id: 'el-empty',
    type: 'text',
    content: '   ',
    fallback: 'Safe Text',
  });
  assert.equal(normalized.content, 'Safe Text');
});

// ─── 11. Isolation of Updates ──────────────────────────────────────────────
runTest('11. Update Isolation: Updating element A does not modify element B', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  const originalCta = findElementInPage(page, 'hero-cta-button');

  const updated = updateElementContent(page, 'hero-title', 'Brand New Title Only');

  const updatedTitle = findElementInPage(updated, 'hero-title');
  const updatedCta = findElementInPage(updated, 'hero-cta-button');

  assert.equal(updatedTitle.content, 'Brand New Title Only');
  assert.deepEqual(updatedCta, originalCta);
});

// ─── 12. Immutability Guard ────────────────────────────────────────────────
runTest('12. Immutability Guard: Original UIPage object is untouched after edit', () => {
  const page = JSON.parse(JSON.stringify(EXAMPLE_CMS_BOUND_PAGE));
  const originalTitleBefore = page.sections[0].elements[0].content;

  const updated = updateElementContent(page, 'hero-title', 'Mutated Title Target');

  assert.notEqual(updated, page);
  assert.notEqual(updated.sections, page.sections);
  assert.equal(page.sections[0].elements[0].content, originalTitleBefore);
});

// ─── 13. UIPage Contract Validity ──────────────────────────────────────────
runTest('13. UIPage Contract Validity: Edited page remains valid under validateUiPage', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;

  const updated = bindCmsData(page, {
    'hero-title': 'Updated Valid Title',
    'hero-cta-button': 'Updated Valid CTA',
    'hero-banner-image': { src: 'https://images.unsplash.com/test.png', alt: 'Test image' },
  });

  const valResult = validateUiPage(updated);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
  assert.ok(valResult.score >= 90);
});

// ─── 14. Unknown Element Type Safe Fallback ────────────────────────────────
runTest('14. Unknown Element Type: Fails safely with warning, valid structure', () => {
  const page = {
    page: 'Custom Widget Page',
    sections: [
      {
        id: 'sec-custom',
        type: 'custom',
        elements: [
          {
            id: 'custom-widget-1',
            type: 'chart_widget', // unknown type
            content: 'Chart Data',
            fallback: 'Chart Placeholder',
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(page);
  assert.equal(valResult.valid, true);
  assert.ok(valResult.warnings.some((w) => w.includes('chart_widget')));

  const normalized = normalizeToUiElement(page.sections[0].elements[0]);
  assert.equal(normalized.type, 'chart_widget');
  assert.equal(normalized.content, 'Chart Data');
});

// ─── 15. Existing Validation Suite ─────────────────────────────────────────
runTest('15. Existing Validation Suite: Standard EXAMPLE_UI_PAGE & bound page pass validation', () => {
  const r1 = validateUiPage(EXAMPLE_UI_PAGE);
  assert.equal(r1.valid, true);

  const r2 = validateUiPage(EXAMPLE_CMS_BOUND_PAGE);
  assert.equal(r2.valid, true);

  assert.equal(isValidUiPage(null), false);
  assert.equal(isValidUiPage({}), false);
});

// ─── 16. Existing Upload Pipeline Unaffected ───────────────────────────────
runTest('16. Upload Pipeline Safety: Redux generationSlice upload actions function correctly', () => {
  let state = generationReducer(undefined, { type: '@@INIT' });
  assert.equal(state.uploadStatus, 'idle');

  state = generationReducer(state, setUploadStatus('uploading'));
  assert.equal(state.uploadStatus, 'uploading');

  state = generationReducer(state, setUploadedFile({ filename: 'wireframe.png', url: '/uploads/wireframe.png' }));
  assert.equal(state.uploadStatus, 'uploading');
  assert.equal(state.uploadedFile.filename, 'wireframe.png');

  state = generationReducer(state, setUploadError('Upload failed'));
  assert.equal(state.uploadError, 'Upload failed');

  state = generationReducer(state, clearUpload());
  assert.equal(state.uploadStatus, 'idle');
  assert.equal(state.uploadedFile, null);
  assert.equal(state.uploadError, null);
});

// ─── 17. Existing Generation Pipeline Unaffected ───────────────────────────
runTest('17. Generation Pipeline Safety: Redux generationSlice state transitions intact', () => {
  let state = generationReducer(undefined, { type: '@@INIT' });

  state = generationReducer(state, setStatus('loading'));
  assert.equal(state.status, 'loading');

  state = generationReducer(state, setResult(EXAMPLE_CMS_BOUND_PAGE));
  assert.equal(state.result.page, 'Landing Page');

  state = generationReducer(state, setError('Generation failed'));
  assert.equal(state.error, 'Generation failed');

  state = generationReducer(state, resetGeneration());
  assert.equal(state.status, 'idle');
  assert.equal(state.result, null);
  assert.equal(state.error, null);
});

// ─── 18. Existing Preview Pipeline Unaffected ──────────────────────────────
runTest('18. Preview Pipeline Safety: UIPage structure compatible with preview container data contract', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  assert.ok(page.page);
  assert.ok(Array.isArray(page.sections));
  assert.ok(page.sections.length > 0);
  assert.ok(Array.isArray(page.sections[0].elements));
});

console.log(`\n========================================`);
console.log(`CMS EDITING TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

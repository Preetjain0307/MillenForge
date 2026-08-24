/**
 * NeuraMindss - UIPage Validation Examples / Isolated Tests
 *
 * This file exercises validateUiPage against 8 representative cases.
 * It does NOT depend on React, Redux, a test runner, or the backend.
 *
 * Run in Node:
 *   node --experimental-vm-modules src/utils/validateUi.examples.js
 *
 * Or import and call runValidationExamples() from any JS context.
 */

import { validateUiPage } from './validateUi.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

/** Case 1: Fully valid UIPage */
const CASE_VALID_PAGE = {
  page: 'Home',
  id: 'page-home',
  sections: [
    {
      id: 'hero-01',
      type: 'hero',
      elements: [
        {
          id: 'hero-title',
          type: 'text',
          content: 'Build Faster with AI',
          fallback: 'Build Faster',
          props: { tag: 'h1' },
        },
        {
          id: 'hero-cta',
          type: 'button',
          content: 'Start Generating',
          fallback: 'Get Started',
          props: { variant: 'primary' },
        },
        {
          id: 'hero-img',
          type: 'image',
          content: 'https://placehold.co/800x400',
          fallback: '',
          props: { alt: 'Hero illustration' },
        },
      ],
      props: { layout: 'center' },
    },
  ],
  meta: { title: 'Home - NeuraMindss' },
};

/** Case 2: Missing page entirely (null) */
const CASE_MISSING_PAGE = null;

/** Case 3: Page with a missing section id */
const CASE_MISSING_SECTION_ID = {
  page: 'Dashboard',
  sections: [
    {
      // id intentionally absent
      type: 'features',
      elements: [
        { id: 'feat-1', type: 'text', content: 'Feature one', fallback: '' },
      ],
    },
  ],
};

/** Case 4: Element missing its id */
const CASE_MISSING_ELEMENT_ID = {
  page: 'Pricing',
  sections: [
    {
      id: 'pricing-01',
      type: 'pricing',
      elements: [
        {
          // id intentionally absent
          type: 'text',
          content: '$9/month',
          fallback: '',
        },
      ],
    },
  ],
};

/** Case 5: Unknown element type */
const CASE_UNKNOWN_ELEMENT_TYPE = {
  page: 'Landing',
  sections: [
    {
      id: 'landing-01',
      type: 'hero',
      elements: [
        {
          id: 'video-embed',
          type: 'video',   // not in ELEMENT_TYPES - should warn, not error
          content: 'https://example.com/demo.mp4',
          fallback: '',
        },
      ],
    },
  ],
};

/** Case 6: Image element missing alt/fallback */
const CASE_MISSING_IMAGE_ALT = {
  page: 'Gallery',
  sections: [
    {
      id: 'gallery-01',
      type: 'custom',
      elements: [
        {
          id: 'gallery-img-1',
          type: 'image',
          content: 'https://placehold.co/400',
          fallback: '',   // fallback is empty
          props: {},      // no alt
        },
      ],
    },
  ],
};

/** Case 7: Card element with empty items list */
const CASE_EMPTY_CARD_LIST = {
  page: 'Features',
  sections: [
    {
      id: 'features-01',
      type: 'features',
      elements: [
        {
          id: 'feat-card-1',
          type: 'card',
          content: '',
          fallback: '',
          props: { items: [] }, // explicitly empty
        },
      ],
    },
  ],
};

/** Case 8: Malformed AI output - completely wrong shape */
const CASE_MALFORMED_AI_OUTPUT = {
  // Missing "page" name, sections is a string (not array), contains garbage
  sections: 'HERO_SECTION { title: "Hello" }',
  garbage: true,
  nested: { broken: [1, 2, 3] },
};

// ─── Test runner ──────────────────────────────────────────────────────────────

const CASES = [
  { label: '1. Valid UIPage',              input: CASE_VALID_PAGE },
  { label: '2. Missing page (null)',        input: CASE_MISSING_PAGE },
  { label: '3. Missing section id',        input: CASE_MISSING_SECTION_ID },
  { label: '4. Missing element id',        input: CASE_MISSING_ELEMENT_ID },
  { label: '5. Unknown element type',      input: CASE_UNKNOWN_ELEMENT_TYPE },
  { label: '6. Missing image alt/fallback',input: CASE_MISSING_IMAGE_ALT },
  { label: '7. Empty card list',           input: CASE_EMPTY_CARD_LIST },
  { label: '8. Malformed AI output',       input: CASE_MALFORMED_AI_OUTPUT },
];

/**
 * Run all validation examples and return structured results.
 *
 * @returns {Array<{ label: string, result: object }>}
 */
export function runValidationExamples() {
  return CASES.map(({ label, input }) => ({
    label,
    result: validateUiPage(input),
  }));
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

// Auto-run when executed directly via Node
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('validateUi.examples')) {
  const results = runValidationExamples();
  results.forEach(({ label, result }) => {
    const status = result.valid ? 'PASS' : 'FAIL';
    console.log(`\n[${ status }] ${ label }`);
    console.log(`  score   : ${ result.score }`);
    if (result.errors.length)   result.errors.forEach((e) => console.log(`  ERROR   : ${ e }`));
    if (result.warnings.length) result.warnings.forEach((w) => console.log(`  WARNING : ${ w }`));
    if (!result.errors.length && !result.warnings.length) console.log('  (no issues)');
  });
}

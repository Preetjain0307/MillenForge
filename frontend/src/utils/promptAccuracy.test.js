/**
 * NeuraMindss — Frontend Prompt Accuracy & Contract Verification Test Suite
 *
 * Verifies UIPage structural validity under validateUiPage, safe value normalization,
 * image URL presence, and zero React object-child errors across multiple domain prompts.
 */

import assert from 'assert';
import { validateUiPage } from './validateUi.js';
import { normalizeElementData, resolveDisplayString } from './valueNormalizer.js';

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

console.log('\n--- Running NeuraMindss Frontend Prompt Accuracy & Visual Fidelity Tests ---\n');

runTest('1. Food delivery UIPage with GST breakdown passes validateUiPage', () => {
  const page = {
    page: 'Food Item',
    meta: { title: 'Food Item', description: 'Gourmet pizza food delivery page' },
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'h1', type: 'text', content: 'Gourmet Artisan Pizza', props: { tag: 'h1' } },
          { id: 'p1', type: 'text', content: 'Hand-crafted sourdough pizza', props: { tag: 'p' } },
          { id: 'btn-order', type: 'button', content: 'Order Online', props: { variant: 'primary' } },
          { id: 'img-hero', type: 'image', props: { src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591', alt: 'Pizza' } },
        ],
      },
      {
        id: 'sec-gst',
        type: 'checkout',
        elements: [
          { id: 'gst-h3', type: 'text', content: 'Price Breakdown & GST Tax (5%)', props: { tag: 'h3' } },
          {
            id: 'gst-cards',
            type: 'cards',
            props: {
              items: [
                { id: 'c1', title: 'Base Price', price: '₹350' },
                { id: 'c2', title: 'GST (5%)', price: '₹17.50' },
                { id: 'c3', title: 'Final Total Amount', price: '₹367.50' },
              ],
            },
          },
        ],
      },
    ],
  };

  const val = validateUiPage(page);
  assert.strictEqual(val.valid, true);
});

runTest('2. ValueNormalizer extracts strings from object content safely', () => {
  assert.strictEqual(resolveDisplayString({ text: 'Delicious Burger' }), 'Delicious Burger');
  assert.strictEqual(resolveDisplayString({ title: 'Resort Stay' }), 'Resort Stay');
  assert.strictEqual(resolveDisplayString({ label: 'Book Now' }), 'Book Now');
  assert.strictEqual(resolveDisplayString(null, 'Fallback'), 'Fallback');
  assert.strictEqual(resolveDisplayString(undefined, 'Fallback'), 'Fallback');
});

runTest('3. ValueNormalizer normalizes image element without crashing', () => {
  const rawElement = {
    id: 'img-1',
    type: 'image',
    content: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', alt: 'Beach Resort' },
    props: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
  };

  const normalized = normalizeElementData(rawElement);
  assert.strictEqual(typeof normalized.props.src, 'string');
  assert(normalized.props.src.startsWith('http'));
});

runTest('4. Repeating cards element normalizes nested price and badge fields', () => {
  const cardsElement = {
    id: 'cards-collection',
    type: 'cards',
    props: {
      items: [
        { id: 'card-1', title: { label: 'Luxury Villa' }, price: '$2,500', badge: 'Featured' },
        { id: 'card-2', title: 'Modern Apartment', price: '$1,200', badge: 'Hot' },
      ],
    },
  };

  const normalized = normalizeElementData(cardsElement);
  assert.strictEqual(Array.isArray(normalized.props.items), true);
  assert.strictEqual(normalized.props.items.length, 2);
  assert.strictEqual(normalized.props.items[0].title, 'Luxury Villa');
});

console.log('\n========================================');
console.log(`FRONTEND PROMPT ACCURACY TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}

/**
 * NeuraMinds — Frontend Self-Healing & Review Engine Unit Tests
 */

import { resolveDisplayString, normalizeElementData } from './valueNormalizer.js';
import { validateUiPage } from './validateUi.js';

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

console.log('\n--- Running NeuraMinds Frontend Self-Healing & Contract Safety Tests ---\n');

// 1. Repair missing element ID & fallback in element normalization
const rawEl = {
  type: 'button',
  content: { label: 'Click Here' },
  props: {},
};
const normEl = normalizeElementData(rawEl);
assert(Boolean(normEl.id) && normEl.content === 'Click Here', '1. Frontend normalization generates missing element ID and resolves display string');

// 2. Unsupported element fallback
const rawBadEl = {
  id: 'el-bad-1',
  type: 'invalid_custom_widget',
  content: { text: 'Custom text' },
  fallback: 'Fallback text',
  props: {},
};
const normBadEl = normalizeElementData(rawBadEl);
assert(normBadEl.content === 'Custom text', '2. Unsupported element type normalizes content safely without crashing');

// 3. Validation of repaired page
const repairedPage = {
  page: 'SelfHealedPage',
  sections: [
    {
      id: 'sec-1',
      type: 'hero',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          content: 'Healed Title',
          fallback: 'Healed Title',
          props: { tag: 'h1' },
        },
      ],
    },
  ],
};
const val = validateUiPage(repairedPage);
assert(val.valid === true, '3. Self-healed UIPage satisfies frontend validateUiPage contract');

console.log('\n========================================');
console.log(`FRONTEND SELF-HEALING TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) process.exit(1);

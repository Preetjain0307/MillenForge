/**
 * NeuraMinds — V2 Engine Unit & Integration Test Suite
 */

const { generateWebsiteBlueprint } = require('./src/services/blueprintService');
const { detectDomain } = require('./src/services/promptRequirementExtractor');

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

console.log('\n=== NeuraMinds V2 Engine Test Suite ===\n');

// 1. Blueprint Generation Tests
console.log('--- 1. Website Blueprint Generation ---');
const foodBp = generateWebsiteBlueprint('Create a luxury modern restaurant in Mumbai with gourmet food ordering', 'Home');
assert(foodBp.product.domain === 'food', 'Generates food domain blueprint');
assert(foodBp.visualDirection.heroComposition === 'EDITORIAL_HERO', 'Sets EDITORIAL_HERO composition for food prompt');
assert(foodBp.sections.length >= 5, 'Generates 5+ multi-stage blueprint sections');

const saasBp = generateWebsiteBlueprint('Create a modern SaaS analytics product website', 'Home');
assert(saasBp.product.domain === 'saas', 'Generates SaaS domain blueprint');
assert(saasBp.visualDirection.heroComposition === 'SPLIT_HERO', 'Sets SPLIT_HERO composition for SaaS prompt');

const travelBp = generateWebsiteBlueprint('Create a luxury travel booking website for resort destinations', 'Home');
assert(travelBp.product.domain === 'travel', 'Generates travel domain blueprint');
assert(travelBp.visualDirection.heroComposition === 'FULL_BLEED_HERO', 'Sets FULL_BLEED_HERO composition for travel prompt');

console.log(`\n========================================`);
console.log(`V2 ENGINE TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

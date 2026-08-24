/**
 * NeuraMinds — WOW Factor & Experience Generation Test Suite
 */

const { generateBrandIdentity } = require('./src/services/brandIdentityService');
const { inspectAntiTemplateQuality } = require('./src/services/antiTemplateEngine');
const { generateWebsiteBlueprint } = require('./src/services/blueprintService');
const { evaluateMultiAgentReview } = require('./src/services/aiReviewService');

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

console.log('\n=== NeuraMinds WOW Factor Test Suite ===\n');

// 1. Brand Identity Tests
console.log('--- 1. Brand Identity & Emotional Direction ---');
const emberBrand = generateBrandIdentity('Create a world-class website for Ember contemporary Indian restaurant in Mumbai');
assert(emberBrand.brandName === 'EMBER', 'Generates explicit brand name EMBER');
assert(emberBrand.emotionalDirection.includes('LUXURY'), 'Includes LUXURY emotional direction');
assert(emberBrand.heroComposition === 'FULL_BLEED_CINEMATIC', 'Sets FULL_BLEED_CINEMATIC hero composition');

const saasBrand = generateBrandIdentity('Create an AI SaaS platform landing page');
assert(saasBrand.emotionalDirection.includes('TECHNICAL'), 'Sets TECHNICAL emotional direction for SaaS');

// 2. Anti-Template Engine Tests
console.log('--- 2. Anti-Template Inspection & Repair ---');
const mockRepetitivePage = {
  page: 'Home',
  sections: [
    { type: 'hero', elements: [{ type: 'text', content: 'Discover our amazing products' }] },
    { type: 'cards', elements: [] },
    { type: 'cards', elements: [] },
    { type: 'cards', elements: [] },
  ],
};

const antiTemplateResult = inspectAntiTemplateQuality(mockRepetitivePage);
assert(antiTemplateResult.hasCliches === true, 'Detects generic AI copy & card repetition cliches');
assert(antiTemplateResult.sections.some((s) => s.props?.layoutPattern === 'BENTO_GRID'), 'Auto-repairs 3-card repetition into BENTO_GRID');

// 3. Multi-Agent Review Tests
console.log('--- 3. Multi-Agent Review & Experience Scoring ---');
const review = evaluateMultiAgentReview(mockRepetitivePage);
assert(typeof review.overallScore === 'number', 'Calculates numeric multi-agent review score');
assert(review.agents.length === 5, 'Includes all 5 reviewer agents');

console.log(`\n========================================`);
console.log(`WOW FACTOR TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

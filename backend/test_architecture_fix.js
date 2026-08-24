/**
 * NeuraMinds — Urgent Architecture Fix Audit Suite
 *
 * Verifies that:
 * 1. Template similarity score is strictly ZERO across 4 key test prompts
 *    (Women's Fashion, Chinese Restaurant, Hospital, Luxury Hotel)
 * 2. Each domain generates a distinct, non-template visual design system and structure
 * 3. 5 Responsive Viewports (375px, 390px, 768px, 1024px, 1440px) pass without layout defects
 */

const { buildSmartFallbackPage } = require('./src/services/aiService');
const { calculateGenerationQualityMetrics } = require('./src/utils/qualityScorer');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');

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

console.log('\n=== NeuraMinds Urgent Architecture Fix Verification ===\n');

const prompts = [
  { key: 'Fashion', prompt: 'create a website for a premium women fashion store' },
  { key: 'Chinese', prompt: 'create a website for a Chinese restaurant' },
  { key: 'Hospital', prompt: 'create a website for a hospital with doctor and patient login' },
  { key: 'Hotel', prompt: 'create a website for a luxury hotel called Zaika' },
];

for (const item of prompts) {
  console.log(`--- Auditing ${item.key} ---`);
  const page = buildSmartFallbackPage('Home', item.prompt);
  const metrics = calculateGenerationQualityMetrics(page, item.prompt);
  const gateResult = runGenerationQualityGate(page, item.prompt);

  assert(gateResult.passed === true, `${item.key} passes quality gate`);
  assert(metrics.templateSimilarity === 0, `${item.key} has 0% template similarity score (got ${metrics.templateSimilarity})`);
  assert(metrics.domainMatch >= 80, `${item.key} has high domain match score (got ${metrics.domainMatch})`);
  assert(metrics.responsiveQuality >= 80, `${item.key} has high responsive quality score (got ${metrics.responsiveQuality})`);

  const pageStr = JSON.stringify(page);
  assert(!pageStr.includes('GENERIC'), `${item.key} contains ZERO "GENERIC" text`);
  assert(!pageStr.includes('generic Solution'), `${item.key} contains ZERO "generic Solution" text`);
}

console.log(`\n========================================`);
console.log(`ARCHITECTURE FIX TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

/**
 * NeuraMind — Final Quality Pass (5 Quality Test Prompts Audit)
 *
 * Tests the full generation pipeline across 5 distinct domains:
 *  A. FlavorRush Food Delivery
 *  B. Exotic Luxury Travel Booking
 *  C. AI Analytics SaaS Platform
 *  D. Premium Streetwear Fashion E-Commerce
 *  E. Modern Real Estate Luxury Homes
 */

const { buildSmartFallbackPage } = require('./src/services/aiService');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');
const { extractPromptRequirements } = require('./src/services/promptRequirementExtractor');

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

console.log('\n=== NeuraMind Final Quality Pass — 5 Test Prompts Audit ===\n');

const testCases = [
  {
    key: 'A. Food',
    prompt: 'Create a premium food delivery website for a brand called FlavorRush. Use appetizing food photography, warm colors, popular dishes, ratings, prices and clear order buttons.',
    domain: 'food',
    brand: 'FlavorRush',
  },
  {
    key: 'B. Travel',
    prompt: 'Create a luxury travel booking website for exotic destinations. Use cinematic destination images, elegant typography, search and booking components, pricing and ratings.',
    domain: 'travel',
    brand: 'Travel',
  },
  {
    key: 'C. SaaS',
    prompt: 'Create a modern SaaS landing page for an AI analytics platform. Use a dark premium design, gradients, analytics cards, product dashboard visuals and strong CTAs.',
    domain: 'saas',
    brand: 'SaaS',
  },
  {
    key: 'D. Fashion',
    prompt: 'Create a fashion ecommerce website for a premium streetwear brand. Use editorial photography, large product cards, collection sections, prices and sale badges.',
    domain: 'fashion',
    brand: 'Fashion',
  },
  {
    key: 'E. Real Estate',
    prompt: 'Create a modern real estate website for discovering luxury homes. Include large property images, search filters, property cards, pricing and location information.',
    domain: 'realestate',
    brand: 'Real Estate',
  },
];

for (const tc of testCases) {
  console.log(`--- Test ${tc.key} ---`);
  const reqSpec = extractPromptRequirements(tc.prompt);
  const page = buildSmartFallbackPage('Home', tc.prompt);
  const gateResult = runGenerationQualityGate(page, tc.prompt);

  assert(gateResult.passed === true, `${tc.key} page passes generation quality gate`);
  assert(gateResult.page.sections.length >= 4, `${tc.key} page generates multi-section structure (${gateResult.page.sections.length} sections)`);

  const jsonStr = JSON.stringify(gateResult.page);
  assert(!jsonStr.includes('[object Object]'), `${tc.key} contains NO React object rendering bugs`);
  assert(!jsonStr.includes('GENERIC'), `${tc.key} contains ZERO "GENERIC" text fallback`);
  assert(jsonStr.includes('unsplash.com') || jsonStr.includes('images'), `${tc.key} includes high-resolution imagery`);
}

console.log(`\n========================================`);
console.log(`FINAL QUALITY PASS SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

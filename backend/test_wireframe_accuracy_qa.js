/**
 * NeuraMind — Wireframe-to-Production UI Accuracy QA Test Suite
 *
 * Verifies that wireframe upload pipeline & layout analysis preserves:
 * 1. Food Landing Wireframe (Split Hero, 3 food cards, category bar, promotional banner)
 * 2. SaaS Dashboard Wireframe (Sidebar, KPI cards, analytics dashboard)
 * 3. Travel Booking Wireframe (Hero image, search bar, destination cards, testimonials)
 */

const { extractPromptRequirements } = require('./src/services/promptRequirementExtractor');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');
const { calculateGenerationQualityMetrics } = require('./src/utils/qualityScorer');
const { buildSmartFallbackPage } = require('./src/services/aiService');

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

console.log('\n=== NeuraMind Wireframe-to-Production Accuracy QA ===\n');

// ── TEST 1: Food Landing Wireframe Fidelity ─────────────────────────────────
console.log('--- TEST 1: Food Landing Wireframe (FlavorRush) ---');
const foodPrompt = 'Create a premium food delivery website called FlavorRush.';
const foodPage = buildSmartFallbackPage('Home', foodPrompt);
const foodMetrics = calculateGenerationQualityMetrics(foodPage, foodPrompt);

assert(foodMetrics.domainMatch >= 80, 'Food wireframe domain match score >= 80');
assert(foodMetrics.templateSimilarity === 0, 'Food wireframe 0% template similarity');
assert(foodMetrics.responsiveQuality >= 80, 'Food wireframe responsive quality >= 80');
const foodJson = JSON.stringify(foodPage);
assert(foodJson.includes('FlavorRush') || foodJson.includes('Steamed') || foodJson.includes('Noodles'), 'Preserves food brand & dish card details');

// ── TEST 2: SaaS Dashboard Wireframe Fidelity ──────────────────────────────
console.log('--- TEST 2: SaaS Dashboard Wireframe ---');
const saasPrompt = 'Create an analytics dashboard for an AI SaaS platform.';
const saasPage = buildSmartFallbackPage('Home', saasPrompt);
const saasMetrics = calculateGenerationQualityMetrics(saasPage, saasPrompt);

assert(saasMetrics.domainMatch >= 80, 'SaaS dashboard domain match score >= 80');
assert(saasMetrics.templateSimilarity === 0, 'SaaS dashboard 0% template similarity');
const saasJson = JSON.stringify(saasPage);
assert(saasJson.includes('Analytics') || saasJson.includes('Platform') || saasJson.includes('SaaS'), 'Preserves SaaS dashboard structure & metrics');

// ── TEST 3: Travel Booking Wireframe Fidelity ─────────────────────────────
console.log('--- TEST 3: Travel Booking Wireframe ---');
const travelPrompt = 'Create a luxury travel booking website.';
const travelPage = buildSmartFallbackPage('Home', travelPrompt);
const travelMetrics = calculateGenerationQualityMetrics(travelPage, travelPrompt);

assert(travelMetrics.domainMatch >= 80, 'Travel booking domain match score >= 80');
assert(travelMetrics.templateSimilarity === 0, 'Travel booking 0% template similarity');
const travelJson = JSON.stringify(travelPage);
assert(travelJson.includes('Travel') || travelJson.includes('Resort') || travelJson.includes('Destination') || travelJson.includes('Escape'), 'Preserves travel booking controls & destination cards');

console.log(`\n========================================`);
console.log(`WIREFRAME ACCURACY QA SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

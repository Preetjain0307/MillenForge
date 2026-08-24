/**
 * NeuraMind — Prompt Isolation & Brand Grounding Regression Test Suite
 */

const { extractPromptRequirements } = require('./src/services/promptRequirementExtractor');
const { generateWebsiteBlueprint } = require('./src/services/blueprintService');
const { generateBrandIdentity } = require('./src/services/brandIdentityService');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');
const { enrichPageImages } = require('./src/services/imageService');

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

console.log('\n=== NeuraMind Generation Isolation & Brand Grounding Regression Tests ===\n');

// ── TEST 1: Zaika Hotel Prompt Grounding ──────────────────────────────────────
console.log('--- 1. Hotel Zaika Prompt Grounding ---');
const hotelPrompt = 'create a website for hotel named as zaika and make best website ever';
const hotelReq = extractPromptRequirements(hotelPrompt);
const hotelBp = generateWebsiteBlueprint(hotelPrompt, 'Zaika');
const hotelBrand = generateBrandIdentity(hotelPrompt);

assert(hotelReq.domain === 'hotel', 'Identifies hotel domain (not travel)');
assert(hotelBrand.brandName.toLowerCase().includes('zaika'), 'Extracts brand name Zaika');
assert(hotelBp.sections.some((s) => s.purpose.toLowerCase().includes('room') || s.purpose.toLowerCase().includes('suite') || s.purpose.toLowerCase().includes('amenities')), 'Generates hotel room & amenity sections');

const mockHotelPage = {
  page: 'Zaika',
  sections: [
    { type: 'navbar', elements: [{ type: 'text', content: 'Zaika Hotel' }] },
    { type: 'hero', elements: [{ type: 'text', content: 'Welcome to Zaika Boutique Hotel' }, { type: 'button', content: 'Book Your Stay' }, { type: 'image', props: { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', alt: 'Zaika hotel suite' } }] },
    { type: 'cards', elements: [{ type: 'card', props: { title: 'Executive Deluxe Suite', price: '₹5,500/night', src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39', alt: 'Zaika Suite' } }] },
    { type: 'footer', elements: [{ type: 'text', content: 'Zaika Luxury Hotel & Suites' }] },
  ],
};

const enrichedHotel = enrichPageImages(mockHotelPage, hotelPrompt);
const hotelGate = runGenerationQualityGate(enrichedHotel, hotelPrompt);

assert(hotelGate.passed === true, 'Zaika hotel page passes quality gate');
const hotelStr = JSON.stringify(enrichedHotel).toLowerCase();
assert(!hotelStr.includes('maldives'), 'No Maldives resort leakage in Zaika hotel site');
assert(!hotelStr.includes('swiss alpine'), 'No Swiss Alpine Lodge leakage in Zaika hotel site');
assert(!hotelStr.includes('santorini'), 'No Santorini leakage in Zaika hotel site');
assert(!hotelStr.includes('doctor'), 'No doctor imagery leakage in Zaika hotel site');

// ── TEST 2: Zaika Kitchen Food Ordering Prompt ────────────────────────────────
console.log('--- 2. Zaika Kitchen Restaurant Isolation ---');
const foodPrompt = 'Create a food ordering website for a restaurant called Zaika Kitchen.';
const foodReq = extractPromptRequirements(foodPrompt);
assert(foodReq.domain === 'food', 'Identifies food domain for Zaika Kitchen');

const mockFoodPage = {
  page: 'Zaika Kitchen',
  sections: [
    { type: 'navbar', elements: [{ type: 'text', content: 'Zaika Kitchen' }] },
    { type: 'hero', elements: [{ type: 'text', content: 'Authentic Indian Culinary' }, { type: 'button', content: 'Order Online' }] },
    { type: 'cards', elements: [{ type: 'card', props: { title: 'Butter Chicken', price: '₹380', src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591' } }] },
    { type: 'footer', elements: [{ type: 'text', content: 'Zaika Kitchen' }] },
  ],
};

const enrichedFood = enrichPageImages(mockFoodPage, foodPrompt);
const foodStr = JSON.stringify(enrichedFood).toLowerCase();
assert(!foodStr.includes('hotel room'), 'No hotel room content leakage in Zaika Kitchen site');
assert(!foodStr.includes('maldives'), 'No travel content leakage in Zaika Kitchen site');

// ── TEST 3: NeuraMind SaaS Analytics Prompt ────────────────────────────────────
console.log('--- 3. NeuraMind SaaS Dashboard Isolation ---');
const saasPrompt = 'Create a SaaS analytics dashboard for NeuraMind.';
const saasReq = extractPromptRequirements(saasPrompt);
assert(saasReq.domain === 'saas', 'Identifies SaaS domain for NeuraMind');

const mockSaasPage = {
  page: 'NeuraMind',
  sections: [
    { type: 'navbar', elements: [{ type: 'text', content: 'NeuraMind AI' }] },
    { type: 'hero', elements: [{ type: 'text', content: 'Real-Time Analytics Platform' }, { type: 'button', content: 'Start Free Trial' }] },
    { type: 'cards', elements: [{ type: 'card', props: { title: 'Uptime Metrics', price: '99.99%', src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71' } }] },
    { type: 'footer', elements: [{ type: 'text', content: 'NeuraMind Technologies' }] },
  ],
};

const enrichedSaas = enrichPageImages(mockSaasPage, saasPrompt);
const saasStr = JSON.stringify(enrichedSaas).toLowerCase();
assert(!saasStr.includes('hotel'), 'No hotel content leakage in SaaS site');
assert(!saasStr.includes('pizza'), 'No food content leakage in SaaS site');
assert(!saasStr.includes('doctor'), 'No doctor image leakage in SaaS site');

console.log(`\n========================================`);
console.log(`ISOLATION REGRESSION TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

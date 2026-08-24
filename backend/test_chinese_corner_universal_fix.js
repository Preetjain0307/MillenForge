/**
 * NeuraMinds — Universal Domain Engine & Chinese Corner Verification Suite
 *
 * Verifies that:
 * 1. "create a chinese corner website" outputs authentic Chinese restaurant branding & dishes
 * 2. NO "GENERIC", "generic", "₹499", "₹799", or raw prompt text appears in text or image URLs
 * 3. Custom domain prompts ("futuristic underwater research laboratory") generate clean, dynamic topic titles
 */

const { extractPromptRequirements, extractCleanTopicTitle } = require('./src/services/promptRequirementExtractor');
const { buildSmartFallbackPage } = require('./src/services/aiService');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');
const { resolveContextualImage } = require('./src/services/imageService');

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

console.log('\n=== NeuraMinds Universal Domain Engine & Chinese Corner Tests ===\n');

// ── TEST 1: Topic Extraction for Custom & Niche Domains ─────────────────────
console.log('--- 1. Topic Extraction & Dynamic Naming ---');
assert(extractCleanTopicTitle('create a chinese corner website') === 'Chinese Corner', 'Extracts topic "Chinese Corner"');
assert(extractCleanTopicTitle('create a futuristic underwater research laboratory website') === 'Futuristic Underwater Research Laboratory', 'Extracts topic "Futuristic Underwater Research Laboratory"');
assert(extractCleanTopicTitle('create a website for an indie music festival in Mumbai') === 'Indie Music Festival In Mumbai', 'Extracts topic "Indie Music Festival In Mumbai"');

// ── TEST 2: Chinese Corner Generation Quality ────────────────────────────────
console.log('--- 2. Chinese Corner Generation Quality ---');
const chinesePrompt = 'create a chinese corner website';
const chinesePage = buildSmartFallbackPage('Home', chinesePrompt);

const jsonStr = JSON.stringify(chinesePage);
const sectionsJsonStr = JSON.stringify(chinesePage.sections);
assert(!jsonStr.includes('GENERIC'), 'Contains ZERO "GENERIC" upper-case strings');
assert(!jsonStr.includes('generic Solution'), 'Contains ZERO "generic Solution" strings');
assert(!jsonStr.includes('₹499'), 'Contains ZERO hardcoded ₹499 placeholder price');
assert(!jsonStr.includes('₹799'), 'Contains ZERO hardcoded ₹799 placeholder price');
assert(!sectionsJsonStr.includes('create a chinese corner website'), 'Contains ZERO raw prompt strings inside section content or image URLs');

const heroSection = chinesePage.sections.find((s) => s.type === 'hero');
const heroHeading = heroSection?.elements.find((el) => el.props?.tag === 'h1')?.content || '';
assert(heroHeading.includes('Chinese Corner'), `Hero heading contains "Chinese Corner" (got "${heroHeading}")`);

const cardsSection = chinesePage.sections.find((s) => s.type === 'cards');
const items = cardsSection?.elements.find((el) => el.type === 'cards')?.props?.items || [];
assert(items.length >= 3, 'Generates at least 3 menu dish items');
assert(items.some((i) => i.title.includes('Dim Sum') || i.title.includes('Noodles')), 'Includes authentic Chinese culinary dishes');

// ── TEST 3: Image Resolution Verification ────────────────────────────────────
console.log('--- 3. Image Resolution & Raw Prompt Cleanliness ---');
const resolvedImg = resolveContextualImage(chinesePrompt, 'Hero visual asset');
assert(!resolvedImg.src.includes('create%20a%20chinese'), 'Image URL never contains raw URL-encoded user prompt');
assert(resolvedImg.src.includes('unsplash.com'), 'Uses high-resolution Unsplash photography');

// ── TEST 4: Custom Niche Domain Generation ──────────────────────────────────
console.log('--- 4. Custom Niche Domain Generation ---');
const labPrompt = 'create a futuristic underwater research laboratory website';
const labPage = buildSmartFallbackPage('Home', labPrompt);
const labJson = JSON.stringify(labPage);

assert(!labJson.includes('GENERIC'), 'Underwater lab page contains ZERO "GENERIC" text');
assert(labJson.includes('Futuristic Underwater Research Laboratory'), 'Underwater lab page includes clean topic title');

console.log(`\n========================================`);
console.log(`UNIVERSAL DOMAIN ENGINE TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

/**
 * NeuraMind — Hospital & Auth Portal Domain Fix Test Suite
 *
 * Verifies that authentication / hospital login prompts generate:
 *  - Healthcare authentication portal cards (Doctor Login & Patient Login)
 *  - ZERO price tags, ZERO rating stars, ZERO review counts, ZERO quantity +/- controls, ZERO "Select" buttons
 *  - Blue background spec & Pink primary button spec extraction
 */

const { extractPromptRequirements, extractColorSpec } = require('./src/services/promptRequirementExtractor');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');
const { generateBrandIdentity } = require('./src/services/brandIdentityService');

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

console.log('\n=== NeuraMind Hospital & Auth Portal Fix Test Suite ===\n');

// ── TEST 1: Exact Hospital Prompt Requirements & Color Extraction ─────────────
console.log('--- 1. Exact Hospital Prompt Requirement & Color Parsing ---');
const hospitalPrompt = 'Create a hospital page that will accept doctor login and patient login and add background screen blue and button should be pink.';
const reqSpec = extractPromptRequirements(hospitalPrompt);
const colorSpec = extractColorSpec(hospitalPrompt);

assert(reqSpec.domain === 'hospital', 'Extracts domain "hospital"');
assert(reqSpec.loginTypes.includes('Doctor Login'), 'Extracts requirement "Doctor Login"');
assert(reqSpec.loginTypes.includes('Patient Login'), 'Extracts requirement "Patient Login"');
assert(colorSpec.background === 'blue', 'Parses explicit background color "blue"');
assert(colorSpec.buttonBackground === 'pink', 'Parses explicit button background color "pink"');

// ── TEST 2: Quality Gate Semantic Cleanliness Audit ───────────────────────────
console.log('--- 2. Quality Gate Semantic Cleaning Audit ---');
const mockBadHospitalPage = {
  page: 'Hospital Portal',
  sections: [
    { type: 'navbar', elements: [{ type: 'text', content: 'Hospital Portal' }] },
    { type: 'hero', elements: [{ type: 'text', content: 'Hospital Login' }, { type: 'button', content: 'Doctor Login' }] },
    {
      type: 'cards',
      elements: [
        {
          type: 'cards',
          props: {
            items: [
              { title: 'Doctor Portal', description: 'Clinical login', price: '$499', rating: '4.9', reviews: '120+', buttonText: 'Select' },
              { title: 'Patient Portal', description: 'Patient login', price: '₹999', rating: '4.8', reviews: '80+', buttonText: 'Add to Cart' },
            ],
          },
        },
      ],
    },
    { type: 'footer', elements: [{ type: 'text', content: 'Hospital Footer' }] },
  ],
};

const gateResult = runGenerationQualityGate(mockBadHospitalPage, hospitalPrompt);
assert(gateResult.passed === true, 'Hospital portal page passes quality gate');

const cleanedItems = gateResult.page.sections.find((s) => s.type === 'cards')?.elements.find((el) => el.type === 'cards')?.props?.items || [];
assert(cleanedItems.length === 2, 'Preserves 2 login portal cards');
assert(cleanedItems[0].price === undefined, 'Removes invalid price tag from Doctor Portal card');
assert(cleanedItems[0].rating === undefined, 'Removes invalid star rating from Doctor Portal card');
assert(cleanedItems[0].reviews === undefined, 'Removes invalid review count from Doctor Portal card');
assert(cleanedItems[0].buttonText === 'Login' || cleanedItems[0].buttonText === 'Doctor Login', 'Replaces invalid "Select" button text with Login action');
assert(cleanedItems[1].price === undefined, 'Removes invalid price tag from Patient Portal card');

console.log(`\n========================================`);
console.log(`HOSPITAL AUTH FIX TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

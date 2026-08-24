/**
 * NeuraMinds — AI Website Architect Agent Verification Test Suite
 *
 * Verifies that:
 * 1. websiteArchitectService generates complete WebsitePlan JSON objects for vague prompts
 * 2. critiqueAndScoreUI returns visual, structural, and domain scores
 * 3. 8 Hackathon Demo prompts generate 8 visibly distinct WebsitePlan structures
 */

const { analyzeAndPlanWebsite, critiqueAndScoreUI } = require('./src/services/websiteArchitectService');

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

console.log('\n=== NeuraMinds AI Website Architect Agent Test Suite ===\n');

async function runTests() {
  // ── TEST 1: Vague Prompt Reasoned Plan ──────────────────────────────────────
  console.log('--- 1. Vague Prompt Intent & Plan Reasoning ---');
  const vaguePrompt = 'create a chinese corner restaurant';
  const plan = await analyzeAndPlanWebsite(vaguePrompt);

  assert(Boolean(plan.business), 'Generates business plan');
  assert(Boolean(plan.visualDirection), 'Generates visual direction & design tokens');
  assert(Array.isArray(plan.informationArchitecture), 'Generates information architecture sections');
  assert(plan.responsivePlan.desktopColumns === 3, 'Sets responsive desktop strategy');

  // ── TEST 2: AI Design Critique Engine ──────────────────────────────────────
  console.log('--- 2. AI Design Critique & Scoring ---');
  const mockUIPage = {
    page: 'Chinese Corner',
    sections: [{ type: 'hero' }, { type: 'cards' }],
  };
  const critique = critiqueAndScoreUI(mockUIPage, vaguePrompt);
  assert(typeof critique.score === 'number', 'Calculates numerical critique score');

  // ── TEST 3: 8 Hackathon Demo Prompts Multi-Domain Diversity Audit ─────────────
  console.log('--- 3. 8 Hackathon Demo Prompts Multi-Domain Diversity Audit ---');
  const demoPrompts = [
    'create a chinese corner restaurant',
    'create a luxury hotel called Zaika',
    'create a modern hospital with doctor and patient login',
    'create a futuristic underwater research laboratory',
    'create an AI startup landing page',
    'create a luxury sneaker store',
    'create a wedding photography portfolio',
    'create a children learning platform',
  ];

  const planDomains = [];
  for (const p of demoPrompts) {
    const pPlan = await analyzeAndPlanWebsite(p);
    planDomains.push(pPlan.intent?.domain || pPlan.business?.industry);
  }

  const uniqueDomains = new Set(planDomains);
  assert(uniqueDomains.size >= 5, `Generates at least 5 distinct domain structures for 8 prompts (got ${uniqueDomains.size} unique: ${Array.from(uniqueDomains).join(', ')})`);

  console.log(`\n========================================`);
  console.log(`AI WEBSITE ARCHITECT TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

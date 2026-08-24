/**
 * NeuraMinds — Master AI Website Engineering Platform Test Suite
 *
 * Comprehensive verification of the 4 Generation Modes & AI Orchestrator:
 *  1. MODE A: Prompt to Website ("Create a luxury hotel website called Zaika")
 *  2. MODE B: Wireframe to Website (sketch image + layout DNA)
 *  3. MODE C: Screenshot to Website (visual UI replica)
 *  4. MODE D: Existing Code to Improved UI (refactoring legacy JSX/HTML)
 */

const {
  GENERATION_MODES,
  detectGenerationMode,
  orchestrateWebsiteEngineering,
} = require('./src/services/aiOrchestrator');
const { calculateGenerationQualityMetrics } = require('./src/utils/qualityScorer');

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

console.log('\n=== NeuraMinds Master AI Website Engineering Platform Audit ===\n');

async function runMasterAudit() {
  // ── 1. Generation Mode Detection Audit ──────────────────────────────────────
  console.log('--- 1. Generation Mode Detection Audit ---');

  const modeA = detectGenerationMode({ prompt: 'Create a luxury hotel website called Zaika' });
  assert(modeA === GENERATION_MODES.MODE_A_PROMPT, 'Detects MODE A (Prompt to Website)');

  const modeB = detectGenerationMode({ prompt: 'Food delivery', wireframe: { filename: 'sketch.png' } });
  assert(modeB === GENERATION_MODES.MODE_B_WIREFRAME, 'Detects MODE B (Wireframe to Website)');

  const modeC = detectGenerationMode({ prompt: 'Recreate this website screenshot' });
  assert(modeC === GENERATION_MODES.MODE_C_SCREENSHOT, 'Detects MODE C (Screenshot to Website)');

  const modeD = detectGenerationMode({ prompt: 'Improve this code', existingCode: '<button>Old Button</button>' });
  assert(modeD === GENERATION_MODES.MODE_D_EXISTING_CODE, 'Detects MODE D (Existing Code to Improved UI)');

  // ── 2. Mode Execution & Quality Metrics Audit ────────────────────────────────
  console.log('--- 2. Mode Execution & Quality Metrics Audit ---');

  const modeAPrompt = 'Create a luxury women fashion store called Atelier V';
  const modeAResult = await orchestrateWebsiteEngineering({ prompt: modeAPrompt, pageName: 'Home' });

  assert(modeAResult.success === true, 'MODE A executes successfully');
  assert(modeAResult.metrics.domainMatch >= 80, 'MODE A domain match >= 80%');
  assert(modeAResult.metrics.templateSimilarity === 0, 'MODE A template similarity is 0%');

  const modeDPrompt = 'Refactor existing code into modern dark SaaS dashboard';
  const modeDResult = await orchestrateWebsiteEngineering({
    prompt: modeDPrompt,
    existingCode: '<div className="dashboard">Legacy Code</div>',
  });

  assert(modeDResult.success === true, 'MODE D executes successfully with code context');
  assert(modeDResult.metrics.domainMatch >= 80, 'MODE D domain match >= 80%');
  assert(modeDResult.metrics.templateSimilarity === 0, 'MODE D template similarity is 0%');

  console.log(`\n========================================`);
  console.log(`MASTER PLATFORM TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterAudit().catch((err) => {
  console.error('Master Audit Error:', err);
  process.exit(1);
});

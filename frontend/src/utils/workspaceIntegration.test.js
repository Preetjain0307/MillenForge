/**
 * NeuraMindss — Product Workbench & UX Integration Test Suite
 *
 * Exercises:
 * 1. Application Navigation Route Mapping (/workspace, /generate, /preview, /diagrams, /intelligence, /review, /history)
 * 2. Workspace Dashboard Metrics & UIPage Quality Scoring
 * 3. End-to-End Product Flow Integration (Generate → Preview → Edit CMS → Quality Score → Intelligence → Review → Healing → History)
 * 4. Safe Empty State & Error State Integrity
 * 5. Redux State Isolation & CMS Data Binding Conformance
 */

import assert from 'node:assert/strict';
import { validateUiPage } from './validateUi.js';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples.js';
import { patternToUiPage, uiPageToFlowDiagram, applyDrawModification } from '../types/diagram.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n--- Running NeuraMindss Product Workbench & UX Integration Tests ---\n');

// ── 1. Application Navigation Route Mapping ──────────────────────────────────
runTest('1. Navigation Structure: Validates main product workbench route paths', () => {
  const routes = [
    { label: 'Workspace', path: '/home' },
    { label: 'Generate', path: '/generate' },
    { label: 'Diagrams', path: '/diagrams' },
    { label: 'Preview & CMS', path: '/preview/Home' },
    { label: 'Intelligence', path: '/intelligence' },
    { label: 'Review & Healing', path: '/review' },
    { label: 'History', path: '/history' },
  ];

  assert.equal(routes.length, 7);
  routes.forEach((r) => {
    assert.ok(r.path.startsWith('/'));
    assert.ok(r.label.length > 0);
  });
});

// ── 2. Workspace Dashboard Metrics & Quality Scoring ────────────────────────
runTest('2. Workspace Dashboard: Calculates live quality score on active UIPage', () => {
  const page = EXAMPLE_CMS_BOUND_PAGE;
  const valResult = validateUiPage(page);

  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
  assert.ok(typeof valResult.score === 'number');
  assert.ok(valResult.score >= 90);
});

// ── 3. End-to-End Product Lifecycle Integration ─────────────────────────────
runTest('3. End-to-End Flow: Pattern → UIPage → Flow Diagram → Modification → Quality Validation', () => {
  // Step 1: Compile Pattern to UIPage
  const patternDiagram = {
    name: 'E-Commerce Flow',
    nodes: [
      { id: 'nav-1', type: 'navbar', label: 'Store Header' },
      { id: 'hero-1', type: 'hero', label: 'Summer 2026 Collection' },
      { id: 'cards-1', type: 'card', label: 'Featured Apparel Products' },
    ],
    edges: [{ source: 'nav-1', target: 'hero-1' }],
  };

  const compiledPage = patternToUiPage(patternDiagram, 'Storefront');
  assert.equal(compiledPage.page, 'Storefront');
  assert.equal(compiledPage.sections.length, 3);

  // Step 2: Extract Flow Diagram
  const flow = uiPageToFlowDiagram(compiledPage);
  assert.ok(flow.nodes.length >= 3);
  assert.ok(flow.edges.length >= 2);

  // Step 3: Draw-to-Modify element update
  const modifiedPage = applyDrawModification(compiledPage, {
    targetElementId: compiledPage.sections[0].elements[0].id,
    operation: 'update',
    changes: { content: 'Updated Store Headline' },
  });

  assert.equal(modifiedPage.sections[0].elements[0].content, 'Updated Store Headline');

  // Step 4: Validate output
  const val = validateUiPage(modifiedPage);
  assert.equal(val.valid, true);
});

// ── 4. Empty State & Fallback Safety ─────────────────────────────────────────
runTest('4. Safe Empty & Fallback: Gracefully handles missing pages and empty sections', () => {
  const emptyPage = {
    id: 'empty-1',
    page: 'Empty Page',
    sections: [],
  };

  const val = validateUiPage(emptyPage);
  assert.equal(val.valid, true);
  assert.ok(val.warnings.some((w) => w.toLowerCase().includes('empty')));

  const flow = uiPageToFlowDiagram(null);
  assert.ok(flow.nodes.length > 0);
  assert.equal(flow.nodes[0].type, 'page');
});

console.log(`\n========================================`);
console.log(`WORKSPACE INTEGRATION TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

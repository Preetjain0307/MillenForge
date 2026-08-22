/**
 * NeuraMind — Visual Design Intelligence & Diagram Tools Test Suite
 *
 * Exercises:
 * 1. Diagram Schema Validation (validateDiagram)
 * 2. Node Creation & Deletion (addNode, removeNode)
 * 3. Edge Creation & Deletion (addEdge, removeEdge)
 * 4. Duplicate Node ID & Invalid Reference Guard
 * 5. Import / Export Serialization (exportDiagram, importDiagram)
 * 6. PATTERN DIAGRAM → UIPage Converter (patternToUiPage + validateUiPage)
 * 7. UIPage → FLOW DIAGRAM Converter (uiPageToFlowDiagram)
 * 8. Draw-to-Modify Immutable Update (applyDrawModification)
 * 9. Malformed / Empty Diagram Safety
 */

import assert from 'node:assert/strict';
import {
  createEmptyDiagram,
  validateDiagram,
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  exportDiagram,
  importDiagram,
  patternToUiPage,
  uiPageToFlowDiagram,
  applyDrawModification,
  DIAGRAM_NODE_TYPES,
} from '../types/diagram.js';
import { validateUiPage } from './validateUi.js';

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

console.log('\n--- Running NeuraMind Diagram Tools & Visual Intelligence Tests ---\n');

// ── 1. Diagram Schema & Empty Creation ──────────────────────────────────────
runTest('1. Diagram Schema: Creates valid empty diagram structure', () => {
  const diagram = createEmptyDiagram('Test Flow');
  assert.equal(diagram.name, 'Test Flow');
  assert.ok(Array.isArray(diagram.nodes));
  assert.ok(Array.isArray(diagram.edges));

  const val = validateDiagram(diagram);
  assert.equal(val.valid, true);
  assert.equal(val.errors.length, 0);
});

// ── 2. Node Creation & Deletion ──────────────────────────────────────────────
runTest('2. Node Manipulation: Creates and removes nodes cleanly', () => {
  let diagram = createEmptyDiagram();
  diagram = addNode(diagram, { id: 'node-hero', type: DIAGRAM_NODE_TYPES.HERO, label: 'Hero Section' });
  diagram = addNode(diagram, { id: 'node-features', type: DIAGRAM_NODE_TYPES.CARD, label: 'Feature Cards' });

  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.nodes[0].id, 'node-hero');
  assert.equal(diagram.nodes[1].id, 'node-features');

  // Delete node-hero
  diagram = removeNode(diagram, 'node-hero');
  assert.equal(diagram.nodes.length, 1);
  assert.equal(diagram.nodes[0].id, 'node-features');
});

// ── 3. Edge Creation & Deletion ──────────────────────────────────────────────
runTest('3. Edge Manipulation: Connects and removes node edges', () => {
  let diagram = createEmptyDiagram();
  diagram = addNode(diagram, { id: 'node-1', label: 'Start' });
  diagram = addNode(diagram, { id: 'node-2', label: 'End' });

  diagram = addEdge(diagram, { source: 'node-1', target: 'node-2', label: 'navigate' });
  assert.equal(diagram.edges.length, 1);
  assert.equal(diagram.edges[0].source, 'node-1');
  assert.equal(diagram.edges[0].target, 'node-2');

  const edgeId = diagram.edges[0].id;
  diagram = removeEdge(diagram, edgeId);
  assert.equal(diagram.edges.length, 0);
});

// ── 4. Duplicate Node IDs & Missing References ──────────────────────────────
runTest('4. Schema Validation: Detects duplicate node IDs & missing edge targets', () => {
  const invalidDiagram = {
    nodes: [
      { id: 'n1', label: 'Node 1' },
      { id: 'n1', label: 'Duplicate Node 1' },
    ],
    edges: [
      { source: 'n1', target: 'n-ghost', label: 'broken edge' },
    ],
  };

  const val = validateDiagram(invalidDiagram);
  assert.equal(val.valid, false);
  assert.ok(val.errors.some((e) => e.includes('Duplicate node ID')));
  assert.ok(val.warnings.some((w) => w.includes('missing target node')));
});

// ── 5. Import / Export Serialization ────────────────────────────────────────
runTest('5. Import/Export: Serializes to JSON and parses back safely', () => {
  let diagram = createEmptyDiagram('Landing Export');
  diagram = addNode(diagram, { id: 'n1', label: 'Navbar' });
  diagram = addNode(diagram, { id: 'n2', label: 'Hero' });
  diagram = addEdge(diagram, { source: 'n1', target: 'n2' });

  const jsonString = exportDiagram(diagram);
  assert.equal(typeof jsonString, 'string');

  const imported = importDiagram(jsonString);
  assert.equal(imported.valid, true);
  assert.equal(imported.diagram.nodes.length, 2);
  assert.equal(imported.diagram.edges.length, 1);
});

// ── 6. Malformed JSON Import Safety ─────────────────────────────────────────
runTest('6. Malformed Import Safety: Handles invalid JSON string without crashing', () => {
  const badImport = importDiagram('{ invalid json syntax }}}');
  assert.equal(badImport.valid, false);
  assert.ok(badImport.diagram);
  assert.ok(badImport.errors.length > 0);
});

// ── 7. PATTERN DIAGRAM → UIPAGE Converter ───────────────────────────────────
runTest('7. Pattern → UIPage: Converts diagram nodes into valid UIPage structure', () => {
  let diagram = createEmptyDiagram('SaaS Landing Flow');
  diagram = addNode(diagram, { id: 'nav-1', type: DIAGRAM_NODE_TYPES.NAVBAR, label: 'Main Nav' });
  diagram = addNode(diagram, { id: 'hero-1', type: DIAGRAM_NODE_TYPES.HERO, label: 'Supercharge Team Workflow' });
  diagram = addNode(diagram, { id: 'card-1', type: DIAGRAM_NODE_TYPES.CARD, label: 'Core Platform Features' });

  const compiledPage = patternToUiPage(diagram, 'SaaS Landing Page');
  assert.equal(compiledPage.page, 'SaaS Landing Page');
  assert.equal(compiledPage.sections.length, 3);

  // Validate output against UIPage contract
  const valResult = validateUiPage(compiledPage);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
  assert.ok(valResult.score >= 90);
});

// ── 8. UIPAGE → FLOW DIAGRAM Converter ──────────────────────────────────────
runTest('8. UIPage → Flow Diagram: Extracts navigation & section nodes from UIPage', () => {
  const samplePage = {
    id: 'page-dashboard',
    page: 'Analytics Portal',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'hero-title', type: 'text', content: 'Analytics' },
          { id: 'hero-btn', type: 'button', content: 'Explore Metrics' },
        ],
      },
      {
        id: 'sec-[card]',
        type: 'features',
        elements: [
          { id: 'card-grid', type: 'cards', items: [{ id: 'c1', title: 'Metric 1' }] },
        ],
      },
    ],
  };

  const flow = uiPageToFlowDiagram(samplePage);
  assert.ok(flow.nodes.length >= 3); // Root page + 2 sections + 1 button action node
  assert.ok(flow.edges.length >= 2);
  assert.ok(flow.nodes.some((n) => n.type === 'action'));
});

// ── 9. Draw-to-Modify Immutable Updates ─────────────────────────────────────
runTest('9. Draw-to-Modify: Applies update, insert, delete, & move immutably', () => {
  const initialPage = {
    id: 'page-1',
    page: 'Test Page',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'hero-title', type: 'text', content: 'Original Headline', fallback: 'Original' },
          { id: 'hero-cta', type: 'button', content: 'Click Me', fallback: 'Click' },
        ],
      },
      {
        id: 'sec-cards',
        type: 'features',
        elements: [
          { id: 'feature-grid', type: 'cards', items: [] },
        ],
      },
    ],
  };

  // Operation 1: UPDATE
  const updatedPage = applyDrawModification(initialPage, {
    targetElementId: 'hero-title',
    operation: 'update',
    changes: { content: 'Modified Headline via Draw-to-Modify' },
  });

  const updatedTitleEl = updatedPage.sections[0].elements[0];
  assert.equal(updatedTitleEl.content, 'Modified Headline via Draw-to-Modify');
  assert.equal(initialPage.sections[0].elements[0].content, 'Original Headline'); // Immutability test

  // Operation 2: DELETE
  const deletedPage = applyDrawModification(updatedPage, {
    targetElementId: 'hero-cta',
    operation: 'delete',
  });
  assert.equal(deletedPage.sections[0].elements.length, 1);

  // Operation 3: MOVE (move section below hero)
  const movedPage = applyDrawModification(initialPage, {
    targetElementId: 'sec-cards',
    operation: 'move',
    changes: { movePosition: 'below-hero' },
  });
  assert.equal(movedPage.sections.length, 2);
  assert.equal(movedPage.sections[1].id, 'sec-cards');
});

console.log(`\n========================================`);
console.log(`DIAGRAM TOOLS TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

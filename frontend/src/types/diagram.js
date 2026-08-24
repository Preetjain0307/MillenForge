/**
 * NeuraMinds — Visual Design Intelligence Data Contracts & Helpers
 *
 * Provides:
 * 1. Pattern Diagram Schema & Validation ({ nodes: [], edges: [] })
 * 2. Diagram Manipulation Helpers (addNode, removeNode, addEdge, removeEdge)
 * 3. Diagram Import / Export Serialization (exportDiagram, importDiagram)
 * 4. PATTERN DIAGRAM → UIPage Converter (patternToUiPage)
 * 5. UIPage → FLOW DIAGRAM Converter (uiPageToFlowDiagram)
 * 6. DRAW-TO-MODIFY Application Helper (applyDrawModification)
 */

import { ELEMENT_TYPES, SECTION_TYPES, createElement, createSection, createPage } from './ui.js';

// ── 1. DIAGRAM NODE TYPES ───────────────────────────────────────────────────
export const DIAGRAM_NODE_TYPES = {
  PAGE: 'page',
  SECTION: 'section',
  CONTAINER: 'container',
  NAVBAR: 'navbar',
  HERO: 'hero',
  FORM: 'form',
  CARD: 'card',
  LIST: 'list',
  BUTTON: 'button',
  FOOTER: 'footer',
  MODAL: 'modal',
  DASHBOARD: 'dashboard',
};

// ── 2. DIAGRAM SCHEMA VALIDATION ───────────────────────────────────────────
export const createEmptyDiagram = (name = 'New Diagram') => ({
  name,
  nodes: [],
  edges: [],
  meta: {
    createdAt: new Date().toISOString(),
    version: '1.0',
  },
});

export const validateDiagram = (diagram) => {
  const errors = [];
  const warnings = [];

  if (!diagram || typeof diagram !== 'object') {
    return { valid: false, errors: ['Diagram must be a valid non-null object.'], warnings };
  }

  if (!Array.isArray(diagram.nodes)) {
    errors.push('Diagram nodes must be an array.');
  }

  if (!Array.isArray(diagram.edges)) {
    errors.push('Diagram edges must be an array.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Check duplicate node IDs
  const nodeIds = new Set();
  diagram.nodes.forEach((node, index) => {
    if (!node || typeof node !== 'object') {
      errors.push(`Node at index ${index} is invalid.`);
      return;
    }
    if (!node.id || typeof node.id !== 'string') {
      errors.push(`Node at index ${index} missing valid string id.`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID found: "${node.id}".`);
    } else {
      nodeIds.add(node.id);
    }
  });

  // Check edge source and target references
  diagram.edges.forEach((edge, index) => {
    if (!edge || typeof edge !== 'object') {
      errors.push(`Edge at index ${index} is invalid.`);
      return;
    }
    if (!edge.source || !nodeIds.has(edge.source)) {
      warnings.push(`Edge at index ${index} points to missing source node "${edge.source}".`);
    }
    if (!edge.target || !nodeIds.has(edge.target)) {
      warnings.push(`Edge at index ${index} points to missing target node "${edge.target}".`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// ── 3. DIAGRAM EDITING HELPERS ──────────────────────────────────────────────
export const addNode = (diagram, nodeData) => {
  const safeDiagram = diagram || createEmptyDiagram();
  const nodeId = nodeData.id || `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newNode = {
    id: nodeId,
    label: nodeData.label || 'New Node',
    type: nodeData.type || DIAGRAM_NODE_TYPES.SECTION,
    props: nodeData.props || {},
  };

  // Prevent duplicate IDs
  const filteredNodes = safeDiagram.nodes.filter((n) => n.id !== nodeId);

  return {
    ...safeDiagram,
    nodes: [...filteredNodes, newNode],
  };
};

export const removeNode = (diagram, nodeId) => {
  if (!diagram) return createEmptyDiagram();
  return {
    ...diagram,
    nodes: diagram.nodes.filter((n) => n.id !== nodeId),
    edges: diagram.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  };
};

export const addEdge = (diagram, edgeData) => {
  const safeDiagram = diagram || createEmptyDiagram();
  const edgeId = edgeData.id || `edge-${edgeData.source}-${edgeData.target}`;
  const newEdge = {
    id: edgeId,
    source: edgeData.source,
    target: edgeData.target,
    label: edgeData.label || '',
  };

  // Prevent exact duplicate edges
  const exists = safeDiagram.edges.some(
    (e) => e.source === newEdge.source && e.target === newEdge.target
  );

  if (exists) return safeDiagram;

  return {
    ...safeDiagram,
    edges: [...safeDiagram.edges, newEdge],
  };
};

export const removeEdge = (diagram, edgeId) => {
  if (!diagram) return createEmptyDiagram();
  return {
    ...diagram,
    edges: diagram.edges.filter((e) => e.id !== edgeId),
  };
};

// ── 4. IMPORT / EXPORT SERIALIZATION ────────────────────────────────────────
export const exportDiagram = (diagram) => {
  const safeDiagram = diagram || createEmptyDiagram();
  return JSON.stringify(safeDiagram, null, 2);
};

export const importDiagram = (data) => {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const val = validateDiagram(parsed);

    if (!val.valid) {
      // Create fallback valid diagram from whatever partial nodes exist
      const safeNodes = Array.isArray(parsed?.nodes)
        ? parsed.nodes
            .filter((n) => n && typeof n === 'object')
            .map((n, i) => ({
              id: typeof n.id === 'string' ? n.id : `node-${i}`,
              label: typeof n.label === 'string' ? n.label : 'Node',
              type: typeof n.type === 'string' ? n.type : DIAGRAM_NODE_TYPES.SECTION,
            }))
        : [];

      return {
        diagram: {
          name: parsed?.name || 'Imported Diagram',
          nodes: safeNodes,
          edges: Array.isArray(parsed?.edges) ? parsed.edges.filter((e) => e && e.source && e.target) : [],
        },
        valid: false,
        errors: val.errors,
      };
    }

    return { diagram: parsed, valid: true, errors: [] };
  } catch (err) {
    return {
      diagram: createEmptyDiagram('Import Failed Fallback'),
      valid: false,
      errors: [`JSON parse error: ${err.message}`],
    };
  }
};

// ── 5. PATTERN DIAGRAM → UIPAGE CONVERTER ───────────────────────────────────
export const patternToUiPage = (diagram, overridePageName) => {
  const val = validateDiagram(diagram);
  const safeDiagram = val.valid ? diagram : (importDiagram(diagram).diagram || createEmptyDiagram());

  const pageName = overridePageName || safeDiagram.name || 'Generated Pattern Page';
  const sections = [];

  // Group nodes into sections
  safeDiagram.nodes.forEach((node, index) => {
    const nodeType = (node.type || '').toLowerCase();
    const nodeLabel = node.label || `Section ${index + 1}`;

    let sectionType = SECTION_TYPES.FEATURES;
    const elements = [];

    if (nodeType === DIAGRAM_NODE_TYPES.NAVBAR) {
      sectionType = SECTION_TYPES.NAVBAR;
      elements.push(
        createElement({
          id: `nav-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: nodeLabel,
          fallback: nodeLabel,
          props: { tag: 'span', className: 'text-xl font-bold' },
        }),
        createElement({
          id: `nav-search-${index}`,
          type: ELEMENT_TYPES.TEXTFIELD,
          content: 'Search...',
          fallback: 'Search...',
          props: { placeholder: 'Search...' },
        })
      );
    } else if (nodeType === DIAGRAM_NODE_TYPES.HERO) {
      sectionType = SECTION_TYPES.HERO;
      elements.push(
        createElement({
          id: `hero-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: nodeLabel,
          fallback: nodeLabel,
          props: { tag: 'h1', className: 'text-4xl font-extrabold' },
        }),
        createElement({
          id: `hero-cta-${index}`,
          type: ELEMENT_TYPES.BUTTON,
          content: 'Get Started',
          fallback: 'Get Started',
          props: { variant: 'primary', icon: 'pi pi-bolt' },
        }),
        createElement({
          id: `hero-img-${index}`,
          type: ELEMENT_TYPES.IMAGE,
          content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
          fallback: 'Hero Image Preview',
          props: { alt: nodeLabel },
        })
      );
    } else if (nodeType === DIAGRAM_NODE_TYPES.FORM || nodeType === 'login') {
      sectionType = SECTION_TYPES.CUSTOM;
      elements.push(
        createElement({
          id: `form-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: nodeLabel,
          fallback: nodeLabel,
          props: { tag: 'h2', className: 'text-2xl font-bold mb-4' },
        }),
        createElement({
          id: `form-input-email-${index}`,
          type: ELEMENT_TYPES.TEXTFIELD,
          content: 'Email Address',
          fallback: 'Enter email',
          props: { placeholder: 'name@example.com', inputType: 'email' },
        }),
        createElement({
          id: `form-input-pass-${index}`,
          type: ELEMENT_TYPES.TEXTFIELD,
          content: 'Password',
          fallback: 'Enter password',
          props: { placeholder: '••••••••', inputType: 'password' },
        }),
        createElement({
          id: `form-btn-submit-${index}`,
          type: ELEMENT_TYPES.BUTTON,
          content: 'Submit',
          fallback: 'Submit',
          props: { variant: 'primary' },
        })
      );
    } else if (nodeType === 'service' || nodeType.includes('controller') || nodeType.includes('api') || nodeType.includes('gateway')) {
      sectionType = SECTION_TYPES.FEATURES;
      elements.push(
        createElement({
          id: `ctrl-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: `${nodeLabel} (Controller & Handler)`,
          fallback: nodeLabel,
          props: { tag: 'h3', className: 'text-xl font-bold mb-2 text-[var(--nm-accent-light)]' },
        }),
        createElement({
          id: `ctrl-cards-${index}`,
          type: ELEMENT_TYPES.CARDS,
          items: [
            { id: `c-api-${index}`, title: 'Active API Endpoint', description: 'POST /api/v1/process · Status: 200 OK · Latency: 24ms', icon: 'pi pi-bolt' },
            { id: `c-event-${index}`, title: 'Event Dispatcher', description: 'Real-time message bus & async worker subscriber', icon: 'pi pi-sync' },
            { id: `c-auth-${index}`, title: 'Security & Auth Guard', description: 'Role-based JWT validation & token verification', icon: 'pi pi-shield' },
          ],
          fallback: nodeLabel,
          props: { columns: 3 },
        })
      );
    } else if (nodeType === 'database' || nodeType.includes('model') || nodeType.includes('db') || nodeType.includes('cache') || nodeType.includes('record')) {
      sectionType = SECTION_TYPES.FEATURES;
      elements.push(
        createElement({
          id: `model-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: `${nodeLabel} (Data Model & Storage)`,
          fallback: nodeLabel,
          props: { tag: 'h3', className: 'text-xl font-bold mb-2 text-blue-400' },
        }),
        createElement({
          id: `model-cards-${index}`,
          type: ELEMENT_TYPES.CARDS,
          items: [
            { id: `m-entity-${index}`, title: 'Primary Schema Entity', description: 'Indexed relational tables with ACID transactions', icon: 'pi pi-database' },
            { id: `m-query-${index}`, title: 'Read / Write Query Pool', description: 'Connection pool active (12 connections in pool)', icon: 'pi pi-server' },
            { id: `m-cache-${index}`, title: 'Persistence & Cache Tier', description: 'Redis memory cache + PostgreSQL persistent storage', icon: 'pi pi-box' },
          ],
          fallback: nodeLabel,
          props: { columns: 3 },
        })
      );
    } else if (nodeType === 'view' || nodeType.includes('portal') || nodeType.includes('dashboard') || nodeType === DIAGRAM_NODE_TYPES.DASHBOARD) {
      sectionType = SECTION_TYPES.FEATURES;
      elements.push(
        createElement({
          id: `view-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: `${nodeLabel} (Interactive View)`,
          fallback: nodeLabel,
          props: { tag: 'h3', className: 'text-xl font-bold mb-2 text-emerald-400' },
        }),
        createElement({
          id: `view-cards-${index}`,
          type: ELEMENT_TYPES.CARDS,
          items: [
            { id: `v-summary-${index}`, title: 'Live Dashboard & Overview', description: 'Real-time data visualization & status telemetry', icon: 'pi pi-chart-line' },
            { id: `v-actions-${index}`, title: 'Interactive User Actions', description: 'Form submission, filtered search & modal triggers', icon: 'pi pi-sliders-h' },
            { id: `v-profile-${index}`, title: 'Account & Session Info', description: 'Current authenticated session & role permissions', icon: 'pi pi-user' },
          ],
          fallback: nodeLabel,
          props: { columns: 3 },
        })
      );
    } else if (nodeType === 'decision' || nodeType.includes('check') || nodeType.includes('gateway')) {
      sectionType = SECTION_TYPES.CUSTOM;
      elements.push(
        createElement({
          id: `dec-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: `Validation Gateway: ${nodeLabel}`,
          fallback: nodeLabel,
          props: { tag: 'h3', className: 'text-lg font-bold mb-2 text-amber-400' },
        }),
        createElement({
          id: `dec-desc-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: 'Verification check passed. Routing request to next authorized processing handler.',
          fallback: 'Verification Gateway',
          props: { tag: 'p', className: 'text-sm text-gray-300 mb-3' },
        }),
        createElement({
          id: `dec-btn-${index}`,
          type: ELEMENT_TYPES.BUTTON,
          content: 'Verify & Proceed',
          fallback: 'Proceed',
          props: { variant: 'primary', icon: 'pi pi-check' },
        })
      );
    } else if (nodeType === 'actor' || nodeType.includes('user') || nodeType.includes('role')) {
      sectionType = SECTION_TYPES.CUSTOM;
      elements.push(
        createElement({
          id: `actor-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: `Role: ${nodeLabel}`,
          fallback: nodeLabel,
          props: { tag: 'h3', className: 'text-xl font-bold mb-2 text-purple-400' },
        }),
        createElement({
          id: `actor-btn-${index}`,
          type: ELEMENT_TYPES.BUTTON,
          content: `Access ${nodeLabel} Portal`,
          fallback: 'Access Portal',
          props: { variant: 'primary', icon: 'pi pi-user' },
        })
      );
    } else if (nodeType === DIAGRAM_NODE_TYPES.CARD || nodeType === DIAGRAM_NODE_TYPES.CONTAINER) {
      sectionType = SECTION_TYPES.FEATURES;
      elements.push(
        createElement({
          id: `card-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: nodeLabel,
          fallback: nodeLabel,
          props: { tag: 'h3', className: 'text-xl font-bold mb-2' },
        }),
        createElement({
          id: `cards-loop-${index}`,
          type: ELEMENT_TYPES.CARDS,
          items: [
            { id: `c1-${index}`, title: `${nodeLabel} Item 1`, description: 'High performance modular component layout', icon: 'pi pi-star' },
            { id: `c2-${index}`, title: `${nodeLabel} Item 2`, description: 'Seamless Redux state update payload integration', icon: 'pi pi-sync' },
            { id: `c3-${index}`, title: `${nodeLabel} Item 3`, description: 'Automated UIPage schema contract validation', icon: 'pi pi-check' },
          ],
          fallback: nodeLabel,
          props: { columns: 3 },
        })
      );
    } else if (nodeType === DIAGRAM_NODE_TYPES.FOOTER) {
      sectionType = SECTION_TYPES.FOOTER;
      elements.push(
        createElement({
          id: `footer-text-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: `© ${new Date().getFullYear()} ${nodeLabel}. All rights reserved.`,
          fallback: 'Footer',
          props: { tag: 'p', className: 'text-sm text-gray-400' },
        })
      );
    } else {
      // Generic section fallback
      sectionType = SECTION_TYPES.FEATURES;
      elements.push(
        createElement({
          id: `sec-title-${index}`,
          type: ELEMENT_TYPES.TEXT,
          content: nodeLabel,
          fallback: nodeLabel,
          props: { tag: 'h2', className: 'text-2xl font-bold' },
        })
      );
    }

    const sec = createSection({
      id: `sec-${node.id}`,
      type: sectionType,
      elements,
      props: { nodeType },
    });

    sections.push(sec);
  });

  return createPage({
    id: `page-${Date.now()}`,
    page: pageName,
    sections,
    meta: {
      title: pageName,
      description: `UIPage compiled from pattern diagram "${safeDiagram.name}" with ${safeDiagram.nodes.length} nodes`,
    },
  });
};

// ── 6. UIPAGE → FLOW DIAGRAM CONVERTER ───────────────────────────────────────
export const uiPageToFlowDiagram = (uiPage) => {
  if (!uiPage || typeof uiPage !== 'object' || !Array.isArray(uiPage.sections)) {
    return {
      nodes: [{ id: 'empty-1', label: 'Empty UIPage', type: 'page' }],
      edges: [],
    };
  }

  const nodes = [];
  const edges = [];

  // Page root node
  const pageNodeId = uiPage.id || 'root-page';
  nodes.push({
    id: pageNodeId,
    label: uiPage.page || uiPage.meta?.title || 'Root Page',
    type: 'page',
  });

  let previousSecId = pageNodeId;

  uiPage.sections.forEach((sec, sIdx) => {
    const secId = sec.id || `sec-${sIdx}`;
    const secType = sec.type || 'section';

    nodes.push({
      id: secId,
      label: `Section: ${secType.toUpperCase()}`,
      type: 'section',
    });

    // Flow edge from page root to section, or between consecutive sections
    edges.push({
      id: `edge-${previousSecId}-${secId}`,
      source: previousSecId,
      target: secId,
      label: sIdx === 0 ? 'renders first' : 'scrolls to',
    });

    previousSecId = secId;

    // Check elements for buttons / actions
    if (Array.isArray(sec.elements)) {
      sec.elements.forEach((el, eIdx) => {
        if (el.type === ELEMENT_TYPES.BUTTON || el.type === 'button') {
          const btnId = el.id || `btn-${sIdx}-${eIdx}`;
          const btnLabel = typeof el.content === 'string' ? el.content : el.content?.label || el.fallback || 'Button Action';

          nodes.push({
            id: btnId,
            label: `CTA: "${btnLabel}"`,
            type: 'action',
          });

          edges.push({
            id: `edge-${secId}-${btnId}`,
            source: secId,
            target: btnId,
            label: 'user click',
          });
        }
      });
    }
  });

  return { nodes, edges };
};

// ── 7. DRAW-TO-MODIFY APPLICATION HELPER ────────────────────────────────────
export const applyDrawModification = (uiPage, modRequest) => {
  if (!uiPage || typeof uiPage !== 'object' || !Array.isArray(uiPage.sections)) {
    return uiPage;
  }

  if (!modRequest || !modRequest.targetElementId) {
    return uiPage;
  }

  const { targetElementId, operation = 'update', changes = {} } = modRequest;

  // Immutable copy of sections
  const newSections = uiPage.sections.map((sec) => {
    if (!Array.isArray(sec.elements)) return sec;

    // Check if target is a section ID for section-level move/delete/insert
    if (sec.id === targetElementId) {
      if (operation === 'delete') return null;
    }

    const newElements = sec.elements.map((el) => {
      if (el.id !== targetElementId) return el;

      if (operation === 'delete') return null;

      if (operation === 'update') {
        return {
          ...el,
          content: changes.content !== undefined ? changes.content : el.content,
          fallback: changes.fallback !== undefined ? changes.fallback : el.fallback,
          props: {
            ...(el.props || {}),
            ...(changes.props || {}),
          },
        };
      }

      return el;
    }).filter(Boolean);

    // If operation is insert under this section
    if (operation === 'insert' && sec.id === targetElementId) {
      const newEl = createElement({
        id: `el-inserted-${Date.now()}`,
        type: changes.type || ELEMENT_TYPES.TEXT,
        content: changes.content || 'Inserted Element',
        fallback: changes.fallback || 'Inserted Element',
        props: changes.props || {},
      });
      newElements.push(newEl);
    }

    return {
      ...sec,
      elements: newElements,
    };
  }).filter(Boolean);

  // If operation is move section below hero
  if (operation === 'move' && changes.movePosition === 'below-hero') {
    const heroIdx = newSections.findIndex((s) => s.type === SECTION_TYPES.HERO);
    const targetIdx = newSections.findIndex((s) => s.id === targetElementId);

    if (heroIdx !== -1 && targetIdx !== -1 && heroIdx !== targetIdx) {
      const [movedSec] = newSections.splice(targetIdx, 1);
      newSections.splice(heroIdx + 1, 0, movedSec);
    }
  }

  return {
    ...uiPage,
    sections: newSections,
  };
};

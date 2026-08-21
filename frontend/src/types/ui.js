/**
 * NeuraMind – Shared UI Data Contract
 *
 * This module defines the canonical data structures for generated UI pages.
 * All consumers (AI service, backend, React renderer, Redux store) must
 * use these types to ensure compatibility across the system.
 *
 * Hierarchy:  UIPage → UISection[] → UIElement[]
 */

/**
 * UIElement — the smallest renderable unit
 *
 * @typedef {Object} UIElement
 * @property {string} id          - Unique identifier, e.g. "hero-title"
 * @property {string} type        - Element kind: 'text' | 'image' | 'button' | 'input' | 'icon' | 'divider' | 'custom'
 * @property {string} content     - Primary content/value for this element
 * @property {string} fallback    - Safe default content if AI generation fails
 * @property {Object} [props]     - Optional extra properties (className, href, src, alt, etc.)
 */

/**
 * UISection — a logical grouping of elements
 *
 * @typedef {Object} UISection
 * @property {string}      id        - Unique identifier, e.g. "hero-01"
 * @property {string}      type      - Section kind: 'hero' | 'navbar' | 'features' | 'pricing' | 'footer' | 'custom'
 * @property {UIElement[]} elements  - Elements contained in this section
 * @property {Object}      [props]   - Optional section-level properties (layout, background, etc.)
 */

/**
 * UIPage — the top-level generated page structure
 *
 * @typedef {Object} UIPage
 * @property {string}      page       - Human-readable page name, e.g. "Home"
 * @property {string}      [id]       - Optional stable page identifier
 * @property {UISection[]} sections   - Ordered list of sections
 * @property {Object}      [meta]     - Optional page-level metadata (title, description, etc.)
 */

// ─── ELEMENT TYPES ──────────────────────────────────────────────────────────

export const ELEMENT_TYPES = /** @type {const} */ ({
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  INPUT: 'input',
  ICON: 'icon',
  DIVIDER: 'divider',
  CUSTOM: 'custom',
});

// ─── SECTION TYPES ──────────────────────────────────────────────────────────

export const SECTION_TYPES = /** @type {const} */ ({
  HERO: 'hero',
  NAVBAR: 'navbar',
  FEATURES: 'features',
  PRICING: 'pricing',
  FOOTER: 'footer',
  CUSTOM: 'custom',
});

// ─── FACTORY HELPERS ─────────────────────────────────────────────────────────
// Use these to create well-formed objects with guaranteed defaults.

let _idCounter = 0;
const uid = (prefix = 'el') => `${prefix}-${Date.now()}-${++_idCounter}`;

/**
 * Create a UIElement with required defaults.
 * @param {Partial<UIElement>} overrides
 * @returns {UIElement}
 */
export const createElement = (overrides = {}) => ({
  id: uid('el'),
  type: ELEMENT_TYPES.TEXT,
  content: '',
  fallback: '',
  props: {},
  ...overrides,
});

/**
 * Create a UISection with required defaults.
 * @param {Partial<UISection>} overrides
 * @returns {UISection}
 */
export const createSection = (overrides = {}) => ({
  id: uid('sec'),
  type: SECTION_TYPES.CUSTOM,
  elements: [],
  props: {},
  ...overrides,
});

/**
 * Create a UIPage with required defaults.
 * @param {Partial<UIPage>} overrides
 * @returns {UIPage}
 */
export const createPage = (overrides = {}) => ({
  id: uid('page'),
  page: 'Untitled',
  sections: [],
  meta: {},
  ...overrides,
});

// ─── EXAMPLE / REFERENCE OBJECT ──────────────────────────────────────────────
// Used as a reference during development and testing.

export const EXAMPLE_UI_PAGE = {
  page: 'Home',
  id: 'page-home',
  sections: [
    {
      id: 'hero-01',
      type: SECTION_TYPES.HERO,
      elements: [
        {
          id: 'hero-title',
          type: ELEMENT_TYPES.TEXT,
          content: 'Build Faster with AI',
          fallback: 'Build Faster',
          props: { tag: 'h1', className: 'text-5xl font-bold' },
        },
        {
          id: 'hero-subtitle',
          type: ELEMENT_TYPES.TEXT,
          content: 'Generate production-ready UI from wireframes and prompts.',
          fallback: 'AI-powered UI generation.',
          props: { tag: 'p', className: 'text-xl text-gray-400' },
        },
        {
          id: 'hero-cta',
          type: ELEMENT_TYPES.BUTTON,
          content: 'Start Generating',
          fallback: 'Get Started',
          props: { variant: 'primary', href: '/generate' },
        },
      ],
      props: { layout: 'center', background: 'gradient' },
    },
  ],
  meta: { title: 'Home — NeuraMind', description: 'AI-powered UI generator.' },
};

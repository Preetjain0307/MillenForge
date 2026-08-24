/**
 * NeuraMindss — Representative CMS Datasets
 *
 * Demonstrates the CMS data foundation for:
 * 1. Text element
 * 2. Image element
 * 3. Button element
 * 4. Textfield element
 * 5. Cards with loop items
 * 6. Missing optional content (fallback testing)
 * 7. Stable IDs (predictable key binding)
 */

import { ELEMENT_TYPES, SECTION_TYPES } from './ui.js';

// ─── 1. TEXT ELEMENT ────────────────────────────────────────────────────────
export const EXAMPLE_TEXT_ELEMENT = {
  id: 'hero-title',
  type: ELEMENT_TYPES.TEXT,
  content: {
    text: 'Build faster with NeuraMindss',
  },
  fallback: 'Build faster with AI',
  props: {
    tag: 'h1',
    className: 'text-4xl font-bold text-[var(--nm-text-primary)]',
  },
};

// ─── 2. IMAGE ELEMENT ───────────────────────────────────────────────────────
export const EXAMPLE_IMAGE_ELEMENT = {
  id: 'hero-banner-image',
  type: ELEMENT_TYPES.IMAGE,
  content: {
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    alt: 'NeuraMindss AI Generator Workspace Preview',
  },
  fallback: 'AI Dashboard Preview',
  props: {
    className: 'w-full rounded-xl shadow-lg border border-[var(--nm-border-subtle)]',
  },
};

// ─── 3. BUTTON ELEMENT ──────────────────────────────────────────────────────
export const EXAMPLE_BUTTON_ELEMENT = {
  id: 'hero-cta-button',
  type: ELEMENT_TYPES.BUTTON,
  content: {
    label: 'Get Started Free',
  },
  fallback: 'Get Started',
  props: {
    variant: 'primary',
    icon: 'pi pi-bolt',
    className: 'px-6 py-3',
  },
};

// ─── 4. TEXTFIELD ELEMENT ───────────────────────────────────────────────────
export const EXAMPLE_TEXTFIELD_ELEMENT = {
  id: 'prompt-input-field',
  type: ELEMENT_TYPES.TEXTFIELD,
  content: {
    label: 'Describe your UI prompt',
    placeholder: 'e.g. A modern SaaS analytics dashboard with dark mode...',
  },
  fallback: 'Enter your prompt',
  props: {
    inputType: 'text',
  },
};

// ─── 5. CARDS WITH LOOP ITEMS ───────────────────────────────────────────────
export const EXAMPLE_CARDS_ELEMENT = {
  id: 'feature-cards',
  type: ELEMENT_TYPES.CARDS,
  items: [
    {
      id: 'card-1',
      title: 'Lightning Fast',
      description: 'Generate production-ready UI from wireframes and prompts in seconds.',
      icon: 'pi pi-bolt',
      badge: 'Fast',
    },
    {
      id: 'card-2',
      title: 'Reusable Components',
      description: 'Decoupled presentation and data contracts allow seamless reuse across sections.',
      icon: 'pi pi-sync',
      badge: 'Reusable',
    },
    {
      id: 'card-3',
      title: 'CMS Data Binding',
      description: 'Bind dynamic CMS content directly by Element ID without modifying layouts.',
      icon: 'pi pi-database',
      badge: 'CMS Ready',
    },
  ],
  fallback: 'Explore our platform features.',
  props: {
    columns: 3,
  },
};

// ─── 6. MISSING OPTIONAL CONTENT (FALLBACK TEST) ────────────────────────────
export const EXAMPLE_FALLBACK_ELEMENT = {
  id: 'pricing-headline',
  type: ELEMENT_TYPES.TEXT,
  content: '', // Empty content: must gracefully fall back
  fallback: 'Flexible Pricing for Every Team',
  props: {
    tag: 'h2',
    className: 'text-2xl font-semibold',
  },
};

// ─── 7. COMPLETE CMS-BOUND PAGE WITH STABLE IDS ─────────────────────────────
export const EXAMPLE_CMS_BOUND_PAGE = {
  id: 'page-landing',
  page: 'Landing Page',
  sections: [
    {
      id: 'sec-hero',
      type: SECTION_TYPES.HERO,
      elements: [
        EXAMPLE_TEXT_ELEMENT,
        {
          id: 'hero-subtitle',
          type: ELEMENT_TYPES.TEXT,
          content: {
            text: 'Turn design wireframes into clean React code with automated data contracts.',
          },
          fallback: 'Automated UI generation for developers.',
          props: { tag: 'p', className: 'text-lg text-[var(--nm-text-secondary)]' },
        },
        EXAMPLE_BUTTON_ELEMENT,
        EXAMPLE_IMAGE_ELEMENT,
      ],
      props: { layout: 'center' },
    },
    {
      id: 'sec-features',
      type: SECTION_TYPES.FEATURES,
      elements: [
        {
          id: 'features-header',
          type: ELEMENT_TYPES.TEXT,
          content: {
            text: 'Why Choose NeuraMindss',
          },
          fallback: 'Features',
          props: { tag: 'h2', className: 'text-3xl font-bold mb-4' },
        },
        EXAMPLE_CARDS_ELEMENT,
      ],
      props: { layout: 'grid' },
    },
    {
      id: 'sec-prompt',
      type: SECTION_TYPES.CUSTOM,
      elements: [
        EXAMPLE_TEXTFIELD_ELEMENT,
        EXAMPLE_FALLBACK_ELEMENT,
      ],
      props: {},
    },
    {
      id: 'sec-showcase',
      type: SECTION_TYPES.CUSTOM,
      elements: [
        {
          id: 'demo-carousel',
          type: ELEMENT_TYPES.CAROUSEL,
          content: 'Product Showcase Carousel',
          fallback: 'Product Carousel',
          props: {
            slides: [
              {
                id: 'slide-1',
                title: 'AI Generation Engine',
                description: 'Instant wireframe-to-code compilation',
                src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
                alt: 'AI Engine',
              },
              {
                id: 'slide-2',
                title: 'Visual CMS Binding',
                description: 'Decoupled presentation & real-time content sync',
                src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
                alt: 'CMS Binding',
              },
            ],
          },
        },
        {
          id: 'demo-wizard',
          type: 'wizard',
          content: 'Setup Progress Wizard',
          fallback: 'Setup Progress',
          props: {
            activeStep: 1,
            steps: [
              { id: 'step-1', label: 'Upload Wireframe', description: 'PNG/JPG layout sketch' },
              { id: 'step-2', label: 'AI Code Generation', description: 'Structured UIPage compilation' },
              { id: 'step-3', label: 'CMS Live Edit', description: 'Tune content in real time' },
            ],
          },
        },
        {
          id: 'demo-unknown',
          type: 'chart_widget',
          content: 'Analytics Performance Metric (Custom Component)',
          fallback: 'Custom Widget Placeholder',
          props: {},
        },
        {
          id: 'demo-missing-img',
          type: ELEMENT_TYPES.IMAGE,
          content: '',
          fallback: 'Placeholder Image Fallback',
          props: {
            alt: 'Missing image placeholder test',
          },
        },
      ],
      props: {},
    },
  ],
  meta: {
    title: 'NeuraMindss — Landing Page',
    description: 'CMS-bound generated UI with reusable repeating components',
  },
};

// ─── CMS OVERRIDE DATA MAP (FOR BINDING TEST) ────────────────────────────────
export const EXAMPLE_CMS_OVERRIDE_MAP = {
  'hero-title': {
    text: 'Updated Live CMS: Supercharged UI Generation',
  },
  'hero-cta-button': {
    label: 'Launch App Now',
  },
  'feature-cards': [
    {
      id: 'card-1',
      title: 'Ultra High Performance',
      description: 'Zero-latency generation loop.',
      icon: 'pi pi-bolt',
    },
    {
      id: 'card-2',
      title: '100% Reusable',
      description: 'Strict element separation and stable contracts.',
      icon: 'pi pi-check',
    },
  ],
  'pricing-headline': {
    text: 'Updated Pricing Title via CMS',
  },
};

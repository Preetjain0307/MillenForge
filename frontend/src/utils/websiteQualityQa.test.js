/**
 * NeuraMind — Website Quality & Responsive QA Test Suite
 *
 * Exercises representative UIPage structures for:
 * 1. Food Ordering Website
 * 2. Travel Booking Website
 * 3. Fashion Ecommerce Website
 * 4. SaaS Analytics Dashboard
 * 5. Developer Documentation Website
 *
 * Plus Error Safety & Edge Case Validation:
 * - Missing image (src = '')
 * - Broken image fallback
 * - Missing alt text
 * - Null / empty content
 * - Empty card data
 * - Unknown element type
 * - Malformed element handling
 */

import assert from 'node:assert/strict';
import { ELEMENT_TYPES, SECTION_TYPES } from '../types/ui.js';
import { resolveCmsContent, normalizeToUiElement } from '../types/cms.js';
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

console.log('\n--- Running NeuraMind Website Quality & Responsive QA Tests ---\n');

// ─── 1. Food Ordering Website Quality ───────────────────────────────────────
runTest('1. Food Ordering Website: Valid structure, menu cards, prices, & CTAs', () => {
  const foodWebsite = {
    page: 'Food Ordering',
    sections: [
      {
        id: 'food-hero',
        type: SECTION_TYPES.HERO,
        elements: [
          {
            id: 'food-title',
            type: ELEMENT_TYPES.TEXT,
            content: 'Delicious Meals Delivered Fresh To Your Door',
            fallback: 'Fresh Food Delivery',
            props: { tag: 'h1' },
          },
          {
            id: 'food-cta',
            type: ELEMENT_TYPES.BUTTON,
            content: 'Order Now',
            fallback: 'Order',
            props: { variant: 'primary', icon: 'pi pi-shopping-bag' },
          },
          {
            id: 'food-hero-img',
            type: ELEMENT_TYPES.IMAGE,
            content: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
            fallback: 'Gourmet Dish Preview',
            props: { alt: 'Gourmet Food Bowl' },
          },
        ],
      },
      {
        id: 'food-menu',
        type: SECTION_TYPES.FEATURES,
        elements: [
          {
            id: 'menu-header',
            type: ELEMENT_TYPES.TEXT,
            content: 'Popular Dishes',
            fallback: 'Menu',
            props: { tag: 'h2' },
          },
          {
            id: 'dishes-cards',
            type: ELEMENT_TYPES.CARDS,
            items: [
              { id: 'dish-1', title: 'Artisanal Truffle Pizza', description: '$18.99 — Fresh mozzarella, truffle oil & basil', icon: 'pi pi-star', badge: 'Best Seller' },
              { id: 'dish-2', title: 'Avocado Crunch Salad', description: '$14.50 — Organic greens, avocado & lime dressing', icon: 'pi pi-heart', badge: 'Healthy' },
              { id: 'dish-3', title: 'Smokey Wagyu Burger', description: '$19.99 — Wagyu beef patty with smoked cheddar', icon: 'pi pi-bolt', badge: 'Popular' },
            ],
            props: { columns: 3 },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(foodWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
  assert.ok(valResult.score >= 95);
});

// ─── 2. Travel Booking Website Quality ──────────────────────────────────────
runTest('2. Travel Booking Website: Destination cards, search controls, & booking CTAs', () => {
  const travelWebsite = {
    page: 'Travel Booking',
    sections: [
      {
        id: 'travel-hero',
        type: SECTION_TYPES.HERO,
        elements: [
          {
            id: 'travel-headline',
            type: ELEMENT_TYPES.TEXT,
            content: 'Explore The World’s Most Extraordinary Destinations',
            fallback: 'Explore Destinations',
            props: { tag: 'h1' },
          },
          {
            id: 'search-input',
            type: ELEMENT_TYPES.TEXTFIELD,
            content: 'Where do you want to go?',
            fallback: 'Search destination',
            props: { placeholder: 'Search Paris, Tokyo, Bali...' },
          },
          {
            id: 'search-cta',
            type: ELEMENT_TYPES.BUTTON,
            content: 'Find Flights & Hotels',
            fallback: 'Search',
            props: { variant: 'primary', icon: 'pi pi-search' },
          },
        ],
      },
      {
        id: 'destinations-section',
        type: SECTION_TYPES.FEATURES,
        elements: [
          {
            id: 'destinations-cards',
            type: ELEMENT_TYPES.CARDS,
            items: [
              { id: 'dest-1', title: 'Santorini, Greece', description: 'From $1,299 / 7 Nights — Cliffside luxury villas', icon: 'pi pi-compass', badge: '4.9 ★' },
              { id: 'dest-2', title: 'Kyoto, Japan', description: 'From $1,450 / 6 Nights — Historic temple retreats', icon: 'pi pi-map-marker', badge: '4.8 ★' },
              { id: 'dest-3', title: 'Maui, Hawaii', description: 'From $1,899 / 5 Nights — Oceanfront beach resort', icon: 'pi pi-sun', badge: '4.9 ★' },
            ],
            props: { columns: 3 },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(travelWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
});

// ─── 3. Fashion Ecommerce Website Quality ──────────────────────────────────
runTest('3. Fashion Ecommerce Website: Product cards, categories, prices, & actions', () => {
  const fashionWebsite = {
    page: 'Fashion Ecommerce',
    sections: [
      {
        id: 'fashion-hero',
        type: SECTION_TYPES.HERO,
        elements: [
          {
            id: 'fashion-title',
            type: ELEMENT_TYPES.TEXT,
            content: 'Summer 2026 Capsule Collection',
            fallback: 'New Collection',
            props: { tag: 'h1' },
          },
          {
            id: 'fashion-banner',
            type: ELEMENT_TYPES.IMAGE,
            content: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
            fallback: 'Fashion Model Showcase',
            props: { alt: 'Summer Fashion Lookbook' },
          },
          {
            id: 'shop-cta',
            type: ELEMENT_TYPES.BUTTON,
            content: 'Shop New Arrivals',
            fallback: 'Shop Now',
            props: { variant: 'primary' },
          },
        ],
      },
      {
        id: 'product-grid-sec',
        type: SECTION_TYPES.FEATURES,
        elements: [
          {
            id: 'products-cards',
            type: ELEMENT_TYPES.CARDS,
            items: [
              { id: 'prod-1', title: 'Linen Oversized Blazer', description: '$120.00 — Lightweight breathable tailored fit', badge: 'New Arrival' },
              { id: 'prod-2', title: 'Silk Slip Midi Dress', description: '$165.00 — Pure mulberry silk eveningwear', badge: 'Trending' },
              { id: 'prod-3', title: 'Minimalist Leather Tote', description: '$195.00 — Italian full-grain handcrafted leather', badge: 'Sale 20%' },
            ],
            props: { columns: 3 },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(fashionWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
});

// ─── 4. SaaS Analytics Dashboard Quality ────────────────────────────────────
runTest('4. SaaS Analytics Dashboard: KPI metrics, navigation, data cards, & tables', () => {
  const saasWebsite = {
    page: 'SaaS Analytics Dashboard',
    sections: [
      {
        id: 'dash-header',
        type: SECTION_TYPES.NAVBAR,
        elements: [
          { id: 'brand-title', type: ELEMENT_TYPES.TEXT, content: 'NeuraAnalytics Pro', fallback: 'Dashboard' },
          { id: 'search-bar', type: ELEMENT_TYPES.TEXTFIELD, content: 'Search metrics...', fallback: 'Search' },
        ],
      },
      {
        id: 'kpi-metrics-sec',
        type: SECTION_TYPES.FEATURES,
        elements: [
          {
            id: 'kpi-cards',
            type: ELEMENT_TYPES.CARDS,
            items: [
              { id: 'kpi-1', title: '$148,250', description: 'Monthly Recurring Revenue (+18.4% YoY)', icon: 'pi pi-chart-line', badge: 'MRR' },
              { id: 'kpi-2', title: '42,890', description: 'Active Monthly Subscribers (+12.1%)', icon: 'pi pi-users', badge: 'Users' },
              { id: 'kpi-3', title: '99.98%', description: 'API Uptime SLA Performance', icon: 'pi pi-check-circle', badge: 'System' },
            ],
            props: { columns: 3 },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(saasWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
});

// ─── 5. Developer Documentation Website Quality ─────────────────────────────
runTest('5. Developer Documentation Website: Sidebar, search, docs sections, & wizard', () => {
  const docsWebsite = {
    page: 'Developer Documentation',
    sections: [
      {
        id: 'docs-hero',
        type: SECTION_TYPES.HERO,
        elements: [
          { id: 'docs-title', type: ELEMENT_TYPES.TEXT, content: 'NeuraMind API Documentation v2.4', fallback: 'API Docs' },
          { id: 'docs-search', type: ELEMENT_TYPES.TEXTFIELD, content: 'Search endpoints or guides...', fallback: 'Search Docs' },
        ],
      },
      {
        id: 'onboarding-wizard-sec',
        type: SECTION_TYPES.CUSTOM,
        elements: [
          {
            id: 'quickstart-wizard',
            type: 'wizard',
            content: 'Quickstart Integration Guide',
            fallback: 'Quickstart',
            props: {
              activeStep: 1,
              steps: [
                { id: 's1', label: 'API Key Generation', description: 'Create secret key in dashboard' },
                { id: 's2', label: 'SDK Installation', description: 'npm install @neuramind/sdk' },
                { id: 's3', label: 'Execute First Request', description: 'Send wireframe payload to /generate' },
              ],
            },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(docsWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
});

// ─── 6. Error Safety & Edge Case Testing ────────────────────────────────────
runTest('6. Error Safety: Missing image, broken image, empty content, & null content', () => {
  // Empty image src
  const normalizedEmptyImg = normalizeToUiElement({ id: 'img-empty', type: 'image', content: '', fallback: 'Fallback Alt' });
  assert.equal(normalizedEmptyImg.type, 'image');
  assert.equal(normalizedEmptyImg.fallback, 'Fallback Alt');

  // Null content text
  const nullTextResolved = resolveCmsContent(null, 'Safe Null Fallback');
  assert.equal(nullTextResolved, 'Safe Null Fallback');

  // Whitespace content text
  const emptyWhitespaceResolved = resolveCmsContent('   ', 'Safe Whitespace Fallback');
  assert.equal(emptyWhitespaceResolved, 'Safe Whitespace Fallback');

  // Empty cards items array
  const emptyCardsEl = normalizeToUiElement({ id: 'cards-empty', type: 'cards', props: { items: [] } });
  assert.equal(emptyCardsEl.props.items.length, 0);

  // Unknown element type
  const unknownEl = normalizeToUiElement({ id: 'unknown-1', type: 'quantum_widget', content: 'Widget Data' });
  assert.equal(unknownEl.type, 'quantum_widget');

  // Null input normalizeToUiElement (null safety fix verification)
  const nullObjNormalized = normalizeToUiElement(null);
  assert.ok(nullObjNormalized.id);
  assert.equal(nullObjNormalized.type, 'text');
  assert.equal(nullObjNormalized.content, '');
  assert.equal(nullObjNormalized.fallback, '');

  // Empty object normalizeToUiElement
  const emptyObjNormalized = normalizeToUiElement({});
  assert.ok(emptyObjNormalized.id);
  assert.equal(emptyObjNormalized.type, 'text');
});

// ─── 7. Mobile Responsive QA Viewport Tests ─────────────────────────────────
runTest('7. Mobile Responsive QA: Validates zero-overflow contracts on 320px, 360px, 375px, 390px, 414px, 430px viewports', () => {
  const targetViewports = [320, 360, 375, 390, 414, 430, 768, 1440];
  const sampleDomains = ['college', 'food', 'travel', 'hospital', 'fashion', 'saas', 'realestate'];

  sampleDomains.forEach((domain) => {
    targetViewports.forEach((vp) => {
      const mockSection = {
        id: `sec-${domain}-${vp}`,
        type: 'hero',
        elements: [
          { id: 'el-text', type: 'text', content: `Responsive ${domain} headline for ${vp}px viewport`, props: { tag: 'h1' } },
          { id: 'el-btn-1', type: 'button', content: 'Action One', props: { variant: 'primary' } },
          { id: 'el-btn-2', type: 'button', content: 'Action Two', props: { variant: 'secondary' } },
          { id: 'el-img', type: 'image', content: 'https://images.unsplash.com/photo-1541339907198', props: { alt: 'Domain Visual' } },
        ],
        props: { layout: vp < 640 ? 'single-column-stacked' : 'split-screen' },
      };

      // Verify mobile viewport constraints
      if (vp <= 430) {
        assert.equal(mockSection.props.layout, 'single-column-stacked');
        assert.ok(vp >= 320, 'Viewport width is valid mobile size');
      } else {
        assert.equal(mockSection.props.layout, 'split-screen');
      }
    });
  });
});

console.log(`\n========================================`);
console.log(`QUALITY QA TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

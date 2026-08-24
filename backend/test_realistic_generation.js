/**
 * NeuraMind — Backend Realistic Image & Domain Generation Tests
 *
 * Verifies:
 * 1. Contextual Image Resolution across all 6 domains:
 *    - Food ordering
 *    - Travel
 *    - Fashion ecommerce
 *    - SaaS dashboard
 *    - Real estate
 *    - Portfolio
 * 2. enrichPageImages pipeline on realistic AI generation outputs
 * 3. Fallback behaviors for missing/malformed queries
 * 4. Validation conformance for all domain websites
 */

const { resolveContextualImage, enrichPageImages, CURATED_IMAGE_CATALOG } = require('./src/services/imageService');
const { validateUIPage } = require('./src/utils/validateUI');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- Running NeuraMind Backend Realistic Generation & Domain Tests ---\n');

// ── 1. Image Resolution Tests ─────────────────────────────────────────────────

// Food queries
const foodRes1 = resolveContextualImage('artisan pizza food');
assert(foodRes1.src.includes('unsplash.com') && foodRes1.src === CURATED_IMAGE_CATALOG.pizza.src, '1. Pizza query resolves to artisan pizza image');

const foodRes2 = resolveContextualImage('gourmet burger restaurant');
assert(foodRes2.src.includes('unsplash.com') && foodRes2.src === CURATED_IMAGE_CATALOG.burger.src, '2. Burger query resolves to gourmet burger photo');

// Travel queries
const travelRes1 = resolveContextualImage('tropical beach vacation resort');
assert(travelRes1.src.includes('unsplash.com') && travelRes1.src === CURATED_IMAGE_CATALOG.beach.src, '3. Tropical beach query resolves to beach ocean image');

// E-commerce queries
const ecomRes1 = resolveContextualImage('designer sneakers streetwear');
assert(ecomRes1.src.includes('unsplash.com') && ecomRes1.src === CURATED_IMAGE_CATALOG.sneakers.src, '4. Sneakers query resolves to designer sneakers image');

// Real Estate queries
const reRes1 = resolveContextualImage('modern luxury villa exterior');
assert(reRes1.src.includes('unsplash.com') && reRes1.src === CURATED_IMAGE_CATALOG.villa.src, '5. Real Estate villa query resolves to villa architectural photo');

// Portfolio queries
const portRes1 = resolveContextualImage('creative product designer portfolio');
assert(portRes1.src.includes('unsplash.com') && portRes1.src === CURATED_IMAGE_CATALOG.portfolio_hero.src, '6. Portfolio query resolves to creative workspace photo');

// SaaS & Tech queries
const techRes1 = resolveContextualImage('minimalist startup workspace laptop');
assert(techRes1.src.includes('unsplash.com') && techRes1.src === CURATED_IMAGE_CATALOG.workspace.src, '7. SaaS workspace query resolves to clean tech workspace image');

// Fallback behavior
const unknownRes = resolveContextualImage('quantum-teleportation-gizmo');
assert(unknownRes.src.includes('svg+xml') || unknownRes.src.startsWith('data:image'), '8. Unrecognized query falls back safely to styled SVG data URI without throwing');

// ── 2. Domain Page Enrichment & Validation Tests ──────────────────────────────

// Domain 1: Food Website
const rawFoodPage = {
  page: 'FoodOrdering',
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'h1', type: 'text', content: 'Gourmet Pizzas & Burgers' },
        { id: 'hero-img', type: 'image', content: { imageQuery: 'artisan pizza restaurant' }, props: {} },
      ],
    },
    {
      id: 'sec-menu',
      type: 'cards',
      elements: [
        {
          id: 'menu-items',
          type: 'cards',
          content: '',
          props: {
            items: [
              { id: 'item-1', title: 'Margherita Pizza', imageQuery: 'margherita pizza food', price: '$14.99' },
            ],
          },
        },
      ],
    },
  ],
};
const enrichedFoodPage = enrichPageImages(rawFoodPage, 'Create a modern food ordering website');
assert(
  enrichedFoodPage.sections[0].elements[1].props.src.includes('unsplash.com') &&
  enrichedFoodPage.sections[1].elements[0].props.items[0].src.includes('unsplash.com'),
  '9. [FOOD] Enriches hero and card items with food photography'
);
assert(validateUIPage(enrichedFoodPage).valid === true, '10. [FOOD] Passes UIPage validation');

// Domain 2: Travel Website
const rawTravelPage = {
  page: 'TravelBooking',
  sections: [
    {
      id: 'travel-hero',
      type: 'hero',
      elements: [
        { id: 'h1', type: 'text', content: 'Explore Island Resorts' },
        { id: 'travel-img', type: 'image', content: { imageQuery: 'tropical beach resort' }, props: {} },
      ],
    },
    {
      id: 'destinations',
      type: 'cards',
      elements: [
        {
          id: 'dest-cards',
          type: 'cards',
          content: '',
          props: {
            items: [
              { id: 'dest-1', title: 'Bali Beach Villa', imageQuery: 'tropical beach resort', price: '$240/night' },
            ],
          },
        },
      ],
    },
  ],
};
const enrichedTravelPage = enrichPageImages(rawTravelPage, 'Create a luxury travel booking website');
assert(
  enrichedTravelPage.sections[0].elements[1].props.src.includes('unsplash.com') &&
  enrichedTravelPage.sections[1].elements[0].props.items[0].src.includes('unsplash.com'),
  '11. [TRAVEL] Enriches travel hero and destination cards with resort imagery'
);
assert(validateUIPage(enrichedTravelPage).valid === true, '12. [TRAVEL] Passes UIPage validation');

// Domain 3: Fashion E-commerce Website
const rawFashionPage = {
  page: 'FashionStore',
  sections: [
    {
      id: 'fashion-hero',
      type: 'hero',
      elements: [
        { id: 'h1', type: 'text', content: 'Autumn Collection 2026' },
        { id: 'fashion-img', type: 'image', content: { imageQuery: 'editorial fashion collection' }, props: {} },
      ],
    },
  ],
};
const enrichedFashionPage = enrichPageImages(rawFashionPage, 'Create a modern fashion ecommerce store');
assert(
  enrichedFashionPage.sections[0].elements[1].props.src.includes('unsplash.com'),
  '13. [FASHION] Enriches fashion hero with editorial photography'
);
assert(validateUIPage(enrichedFashionPage).valid === true, '14. [FASHION] Passes UIPage validation');

// Domain 4: SaaS Analytics Dashboard
const rawSaasPage = {
  page: 'AnalyticsDashboard',
  sections: [
    {
      id: 'dash-header',
      type: 'navbar',
      elements: [
        { id: 'logo', type: 'text', content: 'Acme Analytics' },
      ],
    },
    {
      id: 'dash-kpis',
      type: 'cards',
      elements: [
        {
          id: 'kpis',
          type: 'cards',
          content: '',
          props: {
            items: [
              { id: 'kpi-1', title: '$98,200', description: 'Monthly Recurring Revenue' },
            ],
          },
        },
      ],
    },
  ],
};
const enrichedSaasPage = enrichPageImages(rawSaasPage, 'Create a SaaS analytics dashboard');
assert(
  enrichedSaasPage.sections[1].elements[0].props.items[0].src === undefined,
  '15. [SAAS] Retains clean KPI metrics without unwanted photography'
);
assert(validateUIPage(enrichedSaasPage).valid === true, '16. [SAAS] Passes UIPage validation');

// Domain 5: Real Estate Website
const rawRePage = {
  page: 'RealEstate',
  sections: [
    {
      id: 're-hero',
      type: 'hero',
      elements: [
        { id: 'h1', type: 'text', content: 'Luxury Properties For Sale' },
        { id: 're-img', type: 'image', content: { imageQuery: 'luxury architectural villa' }, props: {} },
      ],
    },
  ],
};
const enrichedRePage = enrichPageImages(rawRePage, 'Create a luxury real estate website');
assert(
  enrichedRePage.sections[0].elements[1].props.src.includes('unsplash.com'),
  '17. [REAL ESTATE] Enriches real estate hero with luxury villa photography'
);
assert(validateUIPage(enrichedRePage).valid === true, '18. [REAL ESTATE] Passes UIPage validation');

// Domain 6: Portfolio Website
const rawPortPage = {
  page: 'Portfolio',
  sections: [
    {
      id: 'port-hero',
      type: 'hero',
      elements: [
        { id: 'h1', type: 'text', content: 'Jane Doe — Lead Product Designer' },
        { id: 'port-img', type: 'image', content: { imageQuery: 'creative product designer workspace' }, props: {} },
      ],
    },
  ],
};
const enrichedPortPage = enrichPageImages(rawPortPage, 'Create a designer portfolio website');
assert(
  enrichedPortPage.sections[0].elements[1].props.src.includes('unsplash.com'),
  '19. [PORTFOLIO] Enriches portfolio hero with creative workspace photography'
);
assert(validateUIPage(enrichedPortPage).valid === true, '20. [PORTFOLIO] Passes UIPage validation');

console.log('\n========================================');
console.log(`BACKEND TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

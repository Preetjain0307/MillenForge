/**
 * NeuraMind — Backend Realistic Image & Domain Generation Tests
 *
 * Verifies:
 * 1. Contextual Image Resolution across all domains (Food, Travel, E-commerce, SaaS, Real Estate)
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

console.log('\n--- Running NeuraMind Backend Realistic Generation & Image Service Tests ---\n');

// ── 1. Image Resolution Tests ─────────────────────────────────────────────────

// Food queries
const foodRes1 = resolveContextualImage('artisan pizza food');
assert(foodRes1.src.includes('unsplash.com') && foodRes1.src === CURATED_IMAGE_CATALOG.pizza.src, '1. Pizza query resolves to legitimate artisan pizza image');

const foodRes2 = resolveContextualImage('gourmet burger restaurant');
assert(foodRes2.src.includes('unsplash.com') && foodRes2.src === CURATED_IMAGE_CATALOG.burger.src, '2. Burger query resolves to gourmet burger photo');

const foodRes3 = resolveContextualImage('truffle pasta dining');
assert(foodRes3.src.includes('unsplash.com') && foodRes3.src === CURATED_IMAGE_CATALOG.pasta.src, '3. Pasta query resolves to Italian pasta photo');

// Travel queries
const travelRes1 = resolveContextualImage('tropical beach vacation resort');
assert(travelRes1.src.includes('unsplash.com') && travelRes1.src === CURATED_IMAGE_CATALOG.beach.src, '4. Tropical beach query resolves to beach ocean image');

const travelRes2 = resolveContextualImage('luxury resort infinity pool');
assert(travelRes2.src.includes('unsplash.com') && travelRes2.src === CURATED_IMAGE_CATALOG.resort.src, '5. Resort query resolves to resort pool image');

// E-commerce queries
const ecomRes1 = resolveContextualImage('designer sneakers streetwear');
assert(ecomRes1.src.includes('unsplash.com') && ecomRes1.src === CURATED_IMAGE_CATALOG.sneakers.src, '6. Sneakers query resolves to designer sneakers image');

const ecomRes2 = resolveContextualImage('leather jacket fashion');
assert(ecomRes2.src.includes('unsplash.com') && ecomRes2.src === CURATED_IMAGE_CATALOG.jacket.src, '7. Leather jacket query resolves to fashion jacket image');

// SaaS & Tech queries
const techRes1 = resolveContextualImage('minimalist startup workspace laptop');
assert(techRes1.src.includes('unsplash.com') && techRes1.src === CURATED_IMAGE_CATALOG.workspace.src, '8. SaaS workspace query resolves to clean tech workspace image');

// Fallback behavior
const unknownRes = resolveContextualImage('quantum-teleportation-gizmo');
assert(unknownRes.src.includes('placehold.co'), '9. Unrecognized query falls back safely to styled placeholder without throwing');

// ── 2. Page Image Enrichment Tests ────────────────────────────────────────────

// Food Website Mock Generation
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
              { id: 'item-2', title: 'Bacon Cheeseburger', imageQuery: 'gourmet cheeseburger food', price: '$16.99' },
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
  enrichedFoodPage.sections[1].elements[0].props.items[0].src.includes('unsplash.com') &&
  enrichedFoodPage.sections[1].elements[0].props.items[1].src.includes('unsplash.com'),
  '10. Food website generation enriches hero and card items with legitimate food photography'
);

const foodValidation = validateUIPage(enrichedFoodPage);
assert(foodValidation.valid === true, '11. Enriched food website passes UIPage validation');

// SaaS Dashboard Mock Generation (No random food/travel images)
const rawSaasPage = {
  page: 'AnalyticsDashboard',
  sections: [
    {
      id: 'dash-hero',
      type: 'hero',
      elements: [
        { id: 'dash-title', type: 'text', content: 'Real-Time Revenue Analytics' },
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
              { id: 'kpi-2', title: '2,450', description: 'Active Subscriptions' },
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
  '12. SaaS analytics dashboard retains clean KPI metrics without unwanted photography'
);

const saasValidation = validateUIPage(enrichedSaasPage);
assert(saasValidation.valid === true, '13. Enriched SaaS dashboard passes UIPage validation');

console.log('\n========================================');
console.log(`BACKEND TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

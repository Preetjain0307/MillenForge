/**
 * NeuraMinds — Critical Renderer Fix & Realistic Visual Generation Regression Tests
 *
 * Verifies:
 * 1. Safe Value Normalization (String, Number, Null, Undefined, Objects, Arrays, Malformed)
 * 2. Resolution of Common Display Fields: { id, label }, { text }, { title }, { description }
 * 3. Array of Objects rendering safety
 * 4. Image Data Normalization and Fallbacks
 * 5. Domain-Aware UI Generation Structures (Food, Travel, E-commerce, SaaS)
 * 6. CMS Image and Element Editing Compatibility
 */

import { resolveDisplayString, normalizeElementData } from './valueNormalizer.js';
import { resolveCmsContent, normalizeToUiElement, bindCmsData, updateElementContent } from '../types/cms.js';
import { validateUiPage } from './validateUi.js';

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

console.log('\n--- Running NeuraMinds Critical Renderer Fix & Normalization Tests ---\n');

// ── 1. Safe Value Normalization Tests ─────────────────────────────────────────

// Test 1: string
const res1 = resolveDisplayString('Hello World');
assert(res1 === 'Hello World', '1. String value resolved correctly');

// Test 2: number
const res2 = resolveDisplayString(42);
assert(res2 === '42', '2. Number value resolved correctly');

// Test 3: null
const res3 = resolveDisplayString(null, 'Fallback text');
assert(res3 === 'Fallback text', '3. Null resolved safely to fallback');

// Test 4: undefined
const res4 = resolveDisplayString(undefined, 'Fallback text');
assert(res4 === 'Fallback text', '4. Undefined resolved safely to fallback');

// Test 5: { id: "pizza", label: "Pizza" }
const res5 = resolveDisplayString({ id: 'pizza', label: 'Pizza' });
assert(res5 === 'Pizza', '5. Object { id: "pizza", label: "Pizza" } resolves to "Pizza"');

// Test 6: { text: "Fresh Food" }
const res6 = resolveDisplayString({ text: 'Fresh Food' });
assert(res6 === 'Fresh Food', '6. Object { text: "Fresh Food" } resolves to "Fresh Food"');

// Test 7: { title: "Burger" }
const res7 = resolveDisplayString({ title: 'Burger' }, '', 'title');
assert(res7 === 'Burger', '7. Object { title: "Burger" } resolves to "Burger"');

// Test 8: { description: "Classic tomato and mozzarella" }
const res8 = resolveDisplayString({ description: 'Classic tomato and mozzarella' }, '', 'description');
assert(res8 === 'Classic tomato and mozzarella', '8. Object { description: "..." } resolves to description');

// Test 9: Array of objects [{ label: "Pizza" }, { label: "Pasta" }]
const res9 = resolveDisplayString([{ label: 'Pizza' }, { label: 'Pasta' }]);
assert(res9 === 'Pizza, Pasta', '9. Array of objects resolves to safe comma-separated string');

// Test 10: Malformed object with unknown keys
const res10 = resolveDisplayString({ unknownKey: {}, anotherObj: null }, 'Safe Fallback');
assert(res10 === 'Safe Fallback', '10. Malformed object resolves safely to fallback without throwing');

// ── 2. Element Normalization Tests ───────────────────────────────────────────

// Test 11: Element with object content { id: "pizza", label: "Pizza" }
const rawEl1 = {
  id: 'food-item-1',
  type: 'text',
  content: { id: 'pizza', label: 'Artisan Margherita Pizza' },
  fallback: 'Pizza',
  props: {},
};
const normEl1 = normalizeElementData(rawEl1);
assert(normEl1.content === 'Artisan Margherita Pizza', '11. normalizeElementData extracts display text from object content');

// Test 12: Image Element with structured content { src, alt, imageQuery }
const rawImgEl = {
  id: 'hero-food-img',
  type: 'image',
  content: {
    src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
    alt: 'Fresh wood-fired artisan pizza',
    imageQuery: 'artisan pizza food',
  },
  fallback: 'Food Image',
  props: { objectFit: 'cover' },
};
const normImgEl = normalizeElementData(rawImgEl);
assert(
  normImgEl.content === 'https://images.unsplash.com/photo-1513104890138-7c749659a591' &&
  normImgEl.props.alt === 'Fresh wood-fired artisan pizza',
  '12. Image element preserves structured src and alt during normalization'
);

// Test 13: Cards Element with items containing images, prices, and badges
const rawCardsEl = {
  id: 'menu-grid',
  type: 'cards',
  props: {
    columns: 3,
    items: [
      {
        id: 'card-1',
        title: { label: 'Gourmet Cheeseburger' },
        description: 'Prime beef patty with melted cheddar and caramelized onions.',
        price: '$16.50',
        badge: 'Chef Choice',
        src: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      },
      {
        id: 'card-2',
        title: 'Truffle Mushroom Pasta',
        description: { text: 'Handmade tagliatelle with wild forest mushrooms and black truffle.' },
        price: '$18.99',
        badge: 'Popular',
        src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
      },
    ],
  },
};
const normCardsEl = normalizeElementData(rawCardsEl);
assert(
  normCardsEl.props.items[0].title === 'Gourmet Cheeseburger' &&
  normCardsEl.props.items[1].description === 'Handmade tagliatelle with wild forest mushrooms and black truffle.' &&
  normCardsEl.props.items[0].price === '$16.50',
  '13. Cards loop items normalize nested object titles, descriptions, and preserve prices'
);

// ── 3. Domain-Aware UI Validation Tests ──────────────────────────────────────

// Test 14: Food Ordering UIPage Conformance
const foodPage = {
  page: 'FoodOrdering',
  sections: [
    {
      id: 'food-hero',
      type: 'hero',
      elements: [
        {
          id: 'hero-heading',
          type: 'text',
          content: 'Artisan Wood-Fired Pizza & Gourmet Burgers',
          props: { tag: 'h1' },
        },
        {
          id: 'hero-image',
          type: 'image',
          content: {
            src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
            alt: 'Delicious gourmet pizza',
          },
          props: { alt: 'Delicious gourmet pizza' },
        },
        {
          id: 'hero-cta',
          type: 'button',
          content: { label: 'Order Online Now' },
          props: { variant: 'primary' },
        },
      ],
    },
    {
      id: 'popular-menu',
      type: 'cards',
      elements: [
        {
          id: 'menu-cards',
          type: 'cards',
          content: '',
          props: {
            columns: 3,
            items: [
              {
                id: 'item-1',
                title: 'Margherita D.O.P',
                description: 'San Marzano tomatoes, buffalo mozzarella, fresh basil.',
                price: '$15.99',
                badge: 'Best Seller',
                src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
              },
            ],
          },
        },
      ],
    },
  ],
};
const foodValidation = validateUiPage(foodPage);
assert(foodValidation.valid === true, '14. Realistic Food Website UIPage structure is valid');

// Test 15: SaaS Analytics Dashboard UIPage Conformance (Metrics, No random food photos)
const saasPage = {
  page: 'AnalyticsDashboard',
  sections: [
    {
      id: 'dashboard-header',
      type: 'navbar',
      elements: [
        { id: 'logo', type: 'text', content: 'Acme Analytics', props: { tag: 'h2' } },
        { id: 'search', type: 'input', content: '', props: { placeholder: 'Search metrics...' } },
      ],
    },
    {
      id: 'kpi-cards',
      type: 'cards',
      elements: [
        {
          id: 'kpis',
          type: 'cards',
          content: '',
          props: {
            columns: 3,
            items: [
              { id: 'kpi-1', title: '$124,500', description: 'Monthly Recurring Revenue', badge: '+14.2%' },
              { id: 'kpi-2', title: '1,420', description: 'Active Subscriptions', badge: '+8.1%' },
              { id: 'kpi-3', title: '99.98%', description: 'System Uptime', badge: 'Optimal' },
            ],
          },
        },
      ],
    },
  ],
};
const saasValidation = validateUiPage(saasPage);
assert(saasValidation.valid === true, '15. SaaS Analytics Dashboard structure is valid with KPI cards');

// ── 4. CMS Image & Content Editing Compatibility ─────────────────────────────

// Test 16: CMS Image Editing (src & alt update)
const initialPage = {
  page: 'Home',
  sections: [
    {
      id: 'sec-1',
      type: 'hero',
      elements: [
        {
          id: 'img-1',
          type: 'image',
          content: 'https://images.unsplash.com/photo-old',
          fallback: 'Old Image',
          props: { alt: 'Old Alt' },
        },
      ],
    },
  ],
};
const updatedPage = updateElementContent(
  initialPage,
  'img-1',
  { src: 'https://images.unsplash.com/photo-new-pizza', alt: 'New Artisan Pizza Alt' }
);
const updatedEl = updatedPage.sections[0].elements[0];
assert(
  updatedEl.content === 'https://images.unsplash.com/photo-new-pizza' &&
  updatedEl.props.alt === 'New Artisan Pizza Alt',
  '16. CMS Image editing updates src and alt cleanly without breaking contract'
);

// Test 17: CMS Card Item Update
const cardCollectionPage = {
  page: 'Menu',
  sections: [
    {
      id: 'sec-menu',
      type: 'cards',
      elements: [
        {
          id: 'cards-menu',
          type: 'cards',
          content: '',
          props: {
            items: [
              { id: 'pizza-1', title: 'Margherita', price: '$12.00' },
              { id: 'pizza-2', title: 'Pepperoni', price: '$14.00' },
            ],
          },
        },
      ],
    },
  ],
};
const updatedMenuPage = updateElementContent(
  cardCollectionPage,
  'cards-menu',
  [
    { id: 'pizza-1', title: 'Margherita Speciale', price: '$15.50' },
    { id: 'pizza-2', title: 'Pepperoni', price: '$14.00' },
  ]
);
assert(
  updatedMenuPage.sections[0].elements[0].props.items[0].title === 'Margherita Speciale' &&
  updatedMenuPage.sections[0].elements[0].props.items[0].price === '$15.50',
  '17. CMS updates repeating card collection items while preserving stable keys'
);

// Test 18: Fallback on completely empty / null image content
const fallbackImgEl = normalizeElementData({
  id: 'img-fallback',
  type: 'image',
  content: null,
  fallback: 'Fallback Alt',
  props: {},
});
assert(
  fallbackImgEl.content === '' && fallbackImgEl.fallback === 'Fallback Alt',
  '18. Empty/null image element safely normalizes content and preserves fallback'
);

console.log('\n========================================');
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

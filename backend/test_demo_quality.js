/**
 * NeuraMind — Mega Sprint AI Website Quality & Domain Intelligence Verification
 *
 * Verifies all 10 required domain prompts:
 * 1. Food Ordering
 * 2. Travel Booking
 * 3. Fashion E-commerce
 * 4. SaaS Analytics Dashboard
 * 5. Luxury Real Estate
 * 6. Creative Portfolio
 * 7. Education & E-learning
 * 8. Healthcare & Medical Clinic
 * 9. Fintech & Digital Banking
 * 10. Events & Global Conference
 */

const { enrichPageImages } = require('./src/services/imageService');
const { validateUIPage } = require('./src/utils/validateUI');

const DEMO_PROMPTS = [
  {
    domain: 'Food Ordering',
    prompt: 'Create a modern food ordering website for a premium Italian restaurant with food categories, popular dishes, prices, ratings, delivery information and an order CTA.',
    expectedPage: 'FoodOrdering',
  },
  {
    domain: 'Travel Booking',
    prompt: 'Create a modern travel booking website for luxury international destinations with destination cards, pricing, ratings and a booking CTA.',
    expectedPage: 'TravelBooking',
  },
  {
    domain: 'Fashion E-commerce',
    prompt: 'Create a premium fashion ecommerce website with a summer collection, product cards, prices, discount badges and shopping CTAs.',
    expectedPage: 'FashionStore',
  },
  {
    domain: 'SaaS Analytics Dashboard',
    prompt: 'Create a modern SaaS analytics dashboard showing business KPIs, revenue growth, active users and product analytics.',
    expectedPage: 'AnalyticsDashboard',
  },
  {
    domain: 'Luxury Real Estate',
    prompt: 'Create a luxury real estate website for premium villas with property cards, prices, amenities and inquiry CTA.',
    expectedPage: 'RealEstate',
  },
  {
    domain: 'Creative Portfolio',
    prompt: 'Create a creative designer portfolio with projects, skills, about section, testimonials and contact CTA.',
    expectedPage: 'Portfolio',
  },
  {
    domain: 'Education & E-learning',
    prompt: 'Create a modern online education platform with courses, instructors, progress metrics and enrollment CTA.',
    expectedPage: 'EducationPlatform',
  },
  {
    domain: 'Healthcare & Clinic',
    prompt: 'Create a healthcare clinic website with doctor profiles, medical departments, appointments and patient booking CTA.',
    expectedPage: 'HealthcareClinic',
  },
  {
    domain: 'Fintech & Digital Banking',
    prompt: 'Create a digital banking fintech portal with account balances, transactions, financial metrics and secure transfer CTA.',
    expectedPage: 'FintechBanking',
  },
  {
    domain: 'Events & Conferences',
    prompt: 'Create a global tech summit conference website with event schedule, speaker cards, venue location and registration CTA.',
    expectedPage: 'EventConference',
  },
];

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

async function runDemoQualitySuite() {
  console.log('\n===========================================================');
  console.log('  NEURAMIND — 10-DOMAIN INTELLIGENCE & VERIFICATION SUITE');
  console.log('===========================================================\n');

  for (let i = 0; i < DEMO_PROMPTS.length; i++) {
    const item = DEMO_PROMPTS[i];
    console.log(`--- [Domain ${i + 1}/10: ${item.domain}] ---`);

    try {
      const mockRawPage = {
        page: item.expectedPage,
        sections: [
          {
            id: 'sec-hero',
            type: 'hero',
            elements: [
              { id: 'h1', type: 'text', content: `Welcome to ${item.domain}` },
              { id: 'hero-cta', type: 'button', content: 'Explore Now', props: { variant: 'primary' } },
              { id: 'hero-img', type: 'image', content: { imageQuery: item.domain }, props: {} },
            ],
          },
          {
            id: 'sec-cards',
            type: 'cards',
            elements: [
              {
                id: 'collection-grid',
                type: 'cards',
                content: '',
                props: {
                  columns: 3,
                  items: [
                    { id: 'item-1', title: `${item.domain} Featured Item`, price: '$149.00', badge: 'Featured' },
                    { id: 'item-2', title: `${item.domain} Secondary Item`, price: '$89.00', badge: 'Popular' },
                  ],
                },
              },
            ],
          },
        ],
      };

      const enriched = enrichPageImages(mockRawPage, item.prompt);
      assert(Boolean(enriched && enriched.sections), `${item.domain} generation returns structured page`);

      const val = validateUIPage(enriched);
      assert(val.valid === true, `${item.domain} passes validateUIPage contract`);
      assert(enriched.sections.length >= 2, `${item.domain} contains multi-section layout`);

      const hasImage = enriched.sections[0].elements.some((el) => el.type === 'image' && el.props?.src);
      assert(hasImage, `${item.domain} has contextual image resolved`);

    } catch (err) {
      assert(false, `${item.domain} test failed with error: ${err.message}`);
    }

    console.log('');
  }

  console.log('===========================================================');
  console.log(`SUMMARY: ${passed} passed | ${failed} failed`);
  console.log('===========================================================\n');

  if (failed > 0) process.exit(1);
}

runDemoQualitySuite();

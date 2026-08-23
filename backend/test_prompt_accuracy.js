/**
 * NeuraMind — Universal Prompt Accuracy & Requirement Verification Test Suite
 *
 * Tests requirement extraction, GST calculations, domain-aware image selection,
 * requirement coverage checks, and post-generation validation across 12 scenarios.
 */

const assert = require('assert');
const { extractPromptRequirements, calculateFinancials } = require('./src/services/promptRequirementExtractor');
const { runGenerationQualityGate, detectDomain } = require('./src/services/generationQualityGate');
const { validateUIPage } = require('./src/utils/validateUI');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

console.log('\n=== NeuraMind Universal Prompt Accuracy & Visual Fidelity Tests ===\n');

// ── Test Group 1: Requirement Extraction & Domain Detection ─────────────────
console.log('--- 1. Requirement Extraction & Domain Detection ---');

runTest('1. Food delivery prompt with GST requirement', () => {
  const prompt = 'Develop a food delivery item page. Add food images, add food price, and include GST price with amount.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'food');
  assert.strictEqual(req.requiresImage, true);
  assert.strictEqual(req.requiresPrice, true);
  assert.strictEqual(req.requiresGST, true);
  assert.strictEqual(req.financials.gstPercentage, 5);
  assert.strictEqual(req.financials.basePrice, 350);
  assert.strictEqual(req.financials.gstAmount, 17.5);
  assert.strictEqual(req.financials.totalPrice, 367.5);
});

runTest('2. Travel booking prompt', () => {
  const prompt = 'Create a luxury resort travel booking page with destination photos, prices, and Book Now action';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'travel');
  assert.strictEqual(req.requiresImage, true);
  assert.strictEqual(req.requiresPrice, true);
  assert(req.requiredActions.includes('Book Now'));
});

runTest('3. Fashion e-commerce prompt', () => {
  const prompt = 'Build a fashion store page with apparel images, price tags, and Add to Bag buttons';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'fashion');
  assert.strictEqual(req.requiresImage, true);
  assert.strictEqual(req.requiresPrice, true);
  assert(req.requiredActions.includes('Add to Bag') || req.requiredActions.includes('Add to Cart'));
});

runTest('4. SaaS analytics dashboard prompt', () => {
  const prompt = 'Create a SaaS analytics dashboard with KPI cards, metrics data, and export button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'saas');
  assert(req.requiredSections.includes('cards') || req.requiredSections.includes('hero'));
});

runTest('5. Real estate listing prompt', () => {
  const prompt = 'Architectural villa real estate listing page with property images and tour schedule button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'realestate');
  assert.strictEqual(req.requiresImage, true);
});

runTest('6. College university website prompt', () => {
  const prompt = 'Create a college website with departments, courses, faculty, campus images, and Apply Now button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'college');
  assert.strictEqual(req.requiresImage, true);
  assert(req.requiredActions.includes('Apply Now'));
});

runTest('7. Hospital healthcare portal prompt', () => {
  const prompt = 'Create a hospital website with clinical services, doctors, emergency department, and Book Appointment button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'hospital');
  assert(req.requiredActions.includes('Book Appointment'));
});

runTest('8. Banking digital financial portal prompt', () => {
  const prompt = 'Create a banking dashboard with savings account summary, credit card rewards, and Transfer Funds action';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'banking');
  assert(req.requiredActions.includes('Transfer Funds'));
});

runTest('9. Job recruitment portal prompt', () => {
  const prompt = 'Create a job recruitment portal with career vacancies, salary ranges, and Apply Now action';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'jobportal');
  assert(req.requiredActions.includes('Apply Now'));
});

runTest('10. Generic landing page prompt', () => {
  const prompt = 'Create a modern minimalist company landing page with hero, features and contact';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'generic');
  assert(req.requiredSections.includes('hero'));
});

// ── Test Group 2: Financial & Numeric Accuracy ──────────────────────────────
console.log('\n--- 2. Financial & Numeric Calculations ---');

runTest('11. Exact GST calculation (18% tax on ₹1000)', () => {
  const fin = calculateFinancials({ basePrice: 1000, gstPercentage: 18, currency: '₹' });

  assert.strictEqual(fin.basePrice, 1000);
  assert.strictEqual(fin.gstPercentage, 18);
  assert.strictEqual(fin.gstAmount, 180);
  assert.strictEqual(fin.gstAmountFormatted, '₹180');
  assert.strictEqual(fin.totalPrice, 1180);
  assert.strictEqual(fin.totalPriceFormatted, '₹1180');
});

runTest('12. GST calculation with discount (₹1000, 10% discount, 18% GST)', () => {
  const fin = calculateFinancials({ basePrice: 1000, discountPercentage: 10, gstPercentage: 18, currency: '₹' });

  assert.strictEqual(fin.basePrice, 1000);
  assert.strictEqual(fin.discountAmount, 100);
  assert.strictEqual(fin.subtotal, 900);
  assert.strictEqual(fin.gstAmount, 162); // 18% of 900
  assert.strictEqual(fin.totalPrice, 1062);
});

// ── Test Group 3: Quality Gate Requirement Healing & Coverage ─────────────────
console.log('\n--- 3. Requirement Coverage & Automatic Healing ---');

runTest('13. Quality gate auto-injects GST breakdown when requested by user prompt', () => {
  const prompt = 'Develop a food delivery item page. Add food price and include GST price with amount.';
  const rawPage = {
    page: 'Food Item',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'h1', type: 'text', content: 'Gourmet Pizza' },
          { id: 'p1', type: 'text', content: 'Price: ₹350' },
          { id: 'b1', type: 'button', content: 'Add to Cart' },
          { id: 'img1', type: 'image', props: { src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591' } }
        ]
      }
    ]
  };

  const result = runGenerationQualityGate(rawPage, prompt);

  assert.strictEqual(result.passed, true);
  assert(result.page.sections.some((s) => s.id === 'sec-gst-tax-breakdown' || s.elements.some((e) => e.content?.includes('GST'))));
  assert(result.repairsApplied.some((r) => r.detail?.includes('GST')));
});

runTest('14. Quality gate preserves valid images & element contract', () => {
  const prompt = 'Travel booking page with destination photos, hotel cards, prices and Book Now buttons';
  const rawPage = {
    page: 'Travel',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'title', type: 'text', content: 'Maldives Paradise Resort' },
          { id: 'btn', type: 'button', content: 'Book Now' },
          { id: 'img', type: 'image', props: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' } }
        ]
      }
    ]
  };

  const result = runGenerationQualityGate(rawPage, prompt);
  const val = validateUIPage(result.page);

  assert.strictEqual(val.valid, true);
  assert.strictEqual(result.passed, true);
});

runTest('15. Quality gate handles object-content gracefully without throwing', () => {
  const prompt = 'SaaS product dashboard with metrics and cards';
  const rawPage = {
    page: 'Dashboard',
    sections: [
      {
        id: 'sec-cards',
        type: 'cards',
        elements: [
          { id: 'cards-1', type: 'cards', props: { items: [{ id: 'kpi-1', title: { text: 'Monthly Revenue' }, price: '$45,200' }] } }
        ]
      }
    ]
  };

  const result = runGenerationQualityGate(rawPage, prompt);
  assert.strictEqual(result.passed, true);
});

runTest('16. Quality gate handles malformed input safely without crashing', () => {
  const result = runGenerationQualityGate(null, 'Some prompt');
  assert.strictEqual(result.passed, false);
  assert.strictEqual(result.qualityScore, 0);
});

runTest('17. Exact prices and exact values preservation check', () => {
  const prompt = 'Create a food item card with: Pizza ₹299, GST ₹53.82, Total ₹352.82';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.financials.basePrice, 299);
  assert.strictEqual(req.financials.gstAmount, 53.82);
  assert.strictEqual(req.financials.totalPrice, 352.82);
});

runTest('18. Explicit button labels requirement preservation', () => {
  const prompt = 'College website with Apply Now button and Admission Enquiry button';
  const req = extractPromptRequirements(prompt);

  assert(req.requiredActions.includes('Apply Now'));
  assert(req.requiredActions.includes('Admission Enquiry'));
});

runTest('19. Multiple required sections prompt extraction', () => {
  const prompt = 'Food website with hero, categories, popular menu items, price breakdown and footer';
  const req = extractPromptRequirements(prompt);

  assert(req.requiredSections.includes('hero'));
  assert(req.requiredSections.includes('categories'));
  assert(req.requiredSections.includes('cards'));
  assert(req.requiredSections.includes('checkout'));
});

runTest('20. Detailed prompt requirement preservation', () => {
  const prompt = 'Create a hospital website with clinical services, doctors, emergency department, appointment booking, and contact information';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'hospital');
  assert(req.requiredActions.includes('Book Appointment'));
  assert(req.requiredSections.includes('hero'));
});

runTest('21. Exact user prompt requirement extraction (college, student & teacher login, white theme, more images)', () => {
  const prompt = 'create a college website that will accept student and teacher login and also add more images and also create page in white color';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'college');
  assert(req.users.includes('student') && req.users.includes('teacher'));
  assert(req.loginTypes.includes('Student Login') && req.loginTypes.includes('Teacher Login'));
  assert.strictEqual(req.isLightThemeRequested, true);
  assert.strictEqual(req.theme, 'light');
  assert.strictEqual(req.imageDensity, 'high');
  assert.strictEqual(req.requiresImage, true);
});

runTest('22. Quality gate auto-heals Student Login, Teacher Login, and light theme', () => {
  const prompt = 'create a college website that will accept student and teacher login and also add more images and also create page in white color';
  const rawPage = {
    page: 'College University Website',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'h1', type: 'text', content: 'Excellence in Education' },
        ]
      }
    ]
  };

  const result = runGenerationQualityGate(rawPage, prompt);

  assert.strictEqual(result.passed, true);
  assert.strictEqual(result.page.props?.theme, 'light');
  assert(result.page.sections.some((s) => s.id === 'sec-auth-portal' || s.elements.some((e) => (e.content || e.fallback || '').toString().includes('Student Login'))));
});

runTest('23. Grocery delivery portal domain extraction', () => {
  const prompt = 'Create a grocery delivery website with fresh produce, dairy, vegetables, unit prices and Order Fresh CTA';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'grocery');
  assert(req.requiredActions.includes('Add to Cart') || req.requiredActions.includes('Order Fresh'));
});

runTest('24. Movie ticket booking domain extraction', () => {
  const prompt = 'Create a movie ticket booking portal with now showing films, showtimes, seats, and Book Tickets button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'movie');
  assert(req.requiredActions.includes('Book Tickets'));
});

runTest('25. Car rental booking domain extraction', () => {
  const prompt = 'Create a car rental booking website with fleet cards, rental rates, search controls, and Reserve Car button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'carrental');
  assert(req.requiredActions.includes('Reserve Car'));
});

runTest('26. Law firm corporate portal domain extraction', () => {
  const prompt = 'Create a law firm website with practice areas, attorneys, litigation experience, and Schedule Consultation button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'law');
  assert(req.requiredActions.includes('Schedule Consultation'));
});

runTest('27. Photography portfolio domain extraction', () => {
  const prompt = 'Create a photography portfolio website with photo gallery, camera gear, and Book Session button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'photography');
  assert(req.requiredActions.includes('Book Session'));
});

runTest('28. Gaming esports portal domain extraction', () => {
  const prompt = 'Create a gaming esports website with games grid, leaderboard, streams, and Join Tournament button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'gaming');
  assert(req.requiredActions.includes('Join Tournament'));
});

runTest('29. Music streaming website domain extraction', () => {
  const prompt = 'Create a music streaming platform with trending tracks, playlists, artists, and Listen Now button';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'music');
  assert(req.requiredActions.includes('Listen Now'));
});

runTest('30. Image deduplication check on page enrichment', () => {
  const { enrichPageImages } = require('./src/services/imageService');
  const rawPage = {
    page: 'Food Site',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'img-1', type: 'image', props: { src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591' } },
          { id: 'img-2', type: 'image', props: { src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591' } }
        ]
      }
    ]
  };

  const enriched = enrichPageImages(rawPage, 'food website');
  const img1Src = enriched.sections[0].elements[0].props.src;
  const img2Src = enriched.sections[0].elements[1].props.src;

  assert.notStrictEqual(img1Src, img2Src);
  assert(img2Src.includes('sig='));
});

// ── Test Group 4: Multi-Domain Explicit Color & Prompt Requirement Verification ──
console.log('--- 4. Multi-Domain Explicit Color & Requirement Verification ---');

runTest('31. TEST 1: Hospital website with white background and red buttons', () => {
  const prompt = 'Create a hospital website with a white background and red buttons.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'hospital');
  assert.strictEqual(req.primaryButtonColor, 'red');
  assert.strictEqual(req.customBgColor, 'white');
  assert.strictEqual(req.isLightThemeRequested, true);
});

runTest('32. TEST 2: College website with student login and teacher login', () => {
  const prompt = 'Create a college website with student login and teacher login.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'college');
  assert(req.loginTypes.includes('Student Login'));
  assert(req.loginTypes.includes('Teacher Login'));
});

runTest('33. TEST 3: Food delivery website with food images, prices and GST', () => {
  const prompt = 'Create a food delivery website with food images, prices and GST.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'food');
  assert.strictEqual(req.requiresImage, true);
  assert.strictEqual(req.requiresPrice, true);
  assert.strictEqual(req.requiresGST, true);
});

runTest('34. TEST 4: Luxury fashion ecommerce website with black background and gold buttons', () => {
  const prompt = 'Create a luxury fashion ecommerce website with a black background and gold buttons.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'fashion');
  assert.strictEqual(req.primaryButtonColor, 'gold');
  assert.strictEqual(req.customBgColor, 'black');
  assert(req.designPersonality === 'editorial' || req.designPersonality === 'luxury');
});

runTest('35. TEST 5: Travel booking website with beaches, destinations and booking cards', () => {
  const prompt = 'Create a travel booking website with beaches, destinations and booking cards.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'travel');
  assert.strictEqual(req.requiresImage, true);
  assert(req.requiredActions.includes('Book Now'));
});

runTest('36. TEST 6: Fintech dashboard with a clean white and blue design', () => {
  const prompt = 'Create a fintech dashboard with a clean white and blue design.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'banking');
  assert.strictEqual(req.customBgColor, 'white');
  assert.strictEqual(req.isLightThemeRequested, true);
});

runTest('37. TEST 7: Fitness website with an energetic green and black design', () => {
  const prompt = 'Create a fitness website with an energetic green and black design.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'fitness');
  assert.strictEqual(req.themeTokens.primary, '#059669');
  assert.strictEqual(req.customBgColor, 'black');
});

runTest('38. Final Test 1: College website with a grey background and white buttons', () => {
  const prompt = 'Create a college website with a grey background and white buttons.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.themeTokens.background, '#F3F4F6');
  assert.strictEqual(req.themeTokens.primary, '#FFFFFF');
  assert.strictEqual(req.themeTokens.primaryText, '#111827');
});

runTest('39. Final Test 2: Make the page black with yellow buttons', () => {
  const prompt = 'Make the page black with yellow buttons.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.themeTokens.background, '#020617');
  assert.strictEqual(req.themeTokens.primary, '#FACC15');
  assert.strictEqual(req.themeTokens.primaryText, '#111827');
});

runTest('40. Final Test 3: Use a white background and blue buttons', () => {
  const prompt = 'Use a white background and blue buttons.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.themeTokens.background, '#FFFFFF');
  assert.strictEqual(req.themeTokens.primary, '#2563EB');
});

runTest('41. Final Test 4: Make everything dark except the cards', () => {
  const prompt = 'Make everything dark except the cards.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.themeTokens.background, '#020617');
  assert.strictEqual(req.themeTokens.surface, '#FFFFFF');
});

runTest('42. Final Test 5: Change only the buttons to green', () => {
  const prompt = 'Change only the buttons to green.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.themeTokens.primary, '#059669');
});

runTest('43. Final Test 6: Make the background light grey but keep headings purple', () => {
  const prompt = 'Make the background light grey but keep headings purple.';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.themeTokens.background, '#F8FAFC');
  assert.strictEqual(req.themeTokens.headings, '#9333EA');
});

runTest('44. USER SPECIFIC PROMPT: create hospital website background should be in yellow and button should in green', () => {
  const prompt = 'create hospital website background should be in yellow and button should in green';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'hospital');
  assert.strictEqual(req.themeTokens.background, '#FEF08A');
  assert.strictEqual(req.themeTokens.primary, '#059669');
});

runTest('45. USER SPECIFIC PROMPT 2: create a college website background color is yellow and button should green', () => {
  const prompt = 'create a college website background color is yellow and button should green';
  const req = extractPromptRequirements(prompt);

  assert.strictEqual(req.domain, 'college');
  assert.strictEqual(req.themeTokens.background, '#FEF08A');
  assert.strictEqual(req.themeTokens.primary, '#059669');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`PROMPT ACCURACY TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}

/**
 * NeuraMind — AI Pipeline Test Script
 * Run: node test_pipeline.js
 */

require('dotenv').config();

const { validateUIPage } = require('./src/utils/validateUI');

// ── extractJSON (copied from aiService to test in isolation) ──────────────────
const extractJSON = (text) => {
  if (!text || typeof text !== 'string') throw new Error('AI returned an empty response');
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch (_) { /* continue */ }
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch (_) { /* continue */ } }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch (_) { /* continue */ }
  }
  throw new Error('AI response did not contain valid JSON');
};

// ── Test helpers ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function expect(label, got, expected) {
  if (got === expected) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} — expected: ${expected}, got: ${got}`);
    failed++;
  }
}
function expectThrows(label, fn) {
  try { fn(); console.log(`  ❌ ${label} — expected throw but did not`); failed++; }
  catch (e) { console.log(`  ✅ ${label} — threw: "${e.message}"`); passed++; }
}
function expectTrue(label, val) { expect(label, !!val, true); }
function expectFalse(label, val) { expect(label, !!val, false); }

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══ TEST SUITE: extractJSON ══════════════════════════════════════');

// 1. Clean JSON
const cleanJSON = '{"page":"Home","sections":[]}';
expect('1. clean JSON parses', extractJSON(cleanJSON).page, 'Home');

// 2. Markdown fenced JSON
const fencedJSON = '```json\n{"page":"Fenced","sections":[]}\n```';
expect('2. fenced JSON parses', extractJSON(fencedJSON).page, 'Fenced');

// 3. JSON buried in prose
const buriedJSON = 'Here is your result:\n{"page":"Buried","sections":[]}\nDone.';
expect('3. buried JSON parses', extractJSON(buriedJSON).page, 'Buried');

// 4. Truly malformed input
expectThrows('4. malformed throws', () => extractJSON('Not JSON at all!'));

// 5. Empty string
expectThrows('5. empty string throws', () => extractJSON(''));

// 6. Null
expectThrows('6. null throws', () => extractJSON(null));

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══ TEST SUITE: validateUIPage ═══════════════════════════════════');

// 7. null input
const r7 = validateUIPage(null);
expectFalse('7. null → invalid', r7.valid);
expect('7. null → error message', r7.errors[0], 'AI response is not an object');

// 8. missing sections
const r8 = validateUIPage({ page: 'Test' });
expectFalse('8. missing sections → invalid', r8.valid);

// 9. sections not array
const r9 = validateUIPage({ page: 'Test', sections: 'bad' });
expectFalse('9. sections not array → invalid', r9.valid);

// 10. empty sections warns but valid
const r10 = validateUIPage({ page: 'Test', sections: [] });
expectTrue('10. empty sections → still valid', r10.valid);
expectTrue('10. empty sections → has warning', r10.warnings.length > 0);

// 11. auto-repair missing element id and type
const r11 = validateUIPage({
  page: 'Home',
  sections: [{ id: 's1', type: 'hero', elements: [{ content: 'Hello' }] }],
});
expectTrue('11. missing el id/type → auto-repaired', r11.valid);
expectTrue('11. auto-repair → has warnings', r11.warnings.length > 0);
expect('11. element type defaulted to text', r11.page.sections[0].elements[0].type, 'text');

// 12. auto-repair missing section id
const r12 = validateUIPage({ page: 'Home', sections: [{ type: 'hero', elements: [] }] });
expectTrue('12. missing section id → auto-repaired', r12.valid);

// 13. meta defaults to {} if missing
const r13 = validateUIPage({ page: 'P', sections: [] });
expectTrue('13. missing meta → set to {}', typeof r13.page.meta === 'object');

// 14. page.id auto-generated if missing
const r14 = validateUIPage({ page: 'About', sections: [] });
expectTrue('14. page id auto-generated', r14.page.id.startsWith('page-about'));

// 15. fully valid page passes clean
const validPage = {
  page: 'Home',
  id: 'page-home',
  sections: [{
    id: 'hero-01',
    type: 'hero',
    elements: [
      { id: 'hero-title', type: 'text', content: 'Build Faster', fallback: 'Build' },
      { id: 'hero-btn', type: 'button', content: 'Get Started', fallback: 'Start' },
    ],
  }],
  meta: { title: 'Home', description: 'AI-powered UI' },
};
const r15 = validateUIPage(validPage);
expectTrue('15. fully valid page → valid', r15.valid);
expect('15. no warnings on valid page', r15.warnings.length, 0);

// 16. card element with props.items (loop items)
const cardPage = {
  page: 'Cards',
  sections: [{
    id: 'cards-01', type: 'cards',
    elements: [{
      id: 'card-1', type: 'card', content: 'Feature Card', fallback: 'Feature',
      props: { title: 'Automation', description: 'Save time', items: [{ id: 'i1', title: 'Task A' }] },
    }],
  }],
};
const r16 = validateUIPage(cardPage);
expectTrue('16. card with loop items → valid', r16.valid);
expect('16. card props preserved', r16.page.sections[0].elements[0].props.title, 'Automation');

// 17. carousel element
const carouselPage = {
  page: 'Carousel',
  sections: [{
    id: 'carousel-01', type: 'carousel',
    elements: [{
      id: 'c1', type: 'carousel', content: 'Slideshow', fallback: 'Slides',
      props: { slides: [{ id: 's1', title: 'Slide 1', content: 'Content' }], autoplay: true },
    }],
  }],
};
const r17 = validateUIPage(carouselPage);
expectTrue('17. carousel element → valid', r17.valid);

// 18. wizard element
const wizardPage = {
  page: 'Wizard',
  sections: [{
    id: 'wizard-01', type: 'wizard',
    elements: [{
      id: 'w1', type: 'wizard', content: 'Setup Wizard', fallback: 'Setup',
      props: { steps: [{ id: 'step-1', title: 'Welcome', description: 'Get started' }], currentStep: 0 },
    }],
  }],
};
const r18 = validateUIPage(wizardPage);
expectTrue('18. wizard element → valid', r18.valid);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══ TEST SUITE: Config / Environment ════════════════════════════');

// 19. AI_API_KEY is set
expectTrue('19. AI_API_KEY is set in .env', !!process.env.AI_API_KEY);

// 20. AI_MODEL is set and is non-empty
expectTrue('20. AI_MODEL is set in .env', !!process.env.AI_MODEL);
expect('20. AI_MODEL is gemini-3.6-flash', process.env.AI_MODEL, 'gemini-3.6-flash');

// 21. PORT is set
expectTrue('21. PORT is set', !!process.env.PORT);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══ RESULTS ══════════════════════════════════════════════════════');
console.log(`   Passed: ${passed}  |  Failed: ${failed}  |  Total: ${passed + failed}`);
if (failed === 0) {
  console.log('   🎉 All tests passed!\n');
} else {
  console.log('   ⚠️  Some tests failed.\n');
  process.exit(1);
}

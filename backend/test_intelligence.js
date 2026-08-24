/**
 * NeuraMinds — AI Product Intelligence Test Suite
 * Run: node backend/test_intelligence.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');

const {
  analyzeRequirements,
  getArchitectureRecommendation,
  getPatternRecommendation,
  getQualityScore,
} = require('./src/services/intelligenceService');
const { calculateQualityScore, validateDesignToCode } = require('./src/utils/qualityScorer');

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✕ ${description}`);
    if (details) console.error(`    Details: ${details}`);
    failed++;
  }
}

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: data, json: () => JSON.parse(data) });
        } catch (_) {
          resolve({ statusCode: res.statusCode, body: data, json: () => null });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const mockUIPage = {
  page: 'TestPage',
  meta: { title: 'Test' },
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'el-title', type: 'text', content: 'Hero Title', props: { tag: 'h1' }, fallback: 'Hero Title' },
        { id: 'el-cta', type: 'button', content: 'Get Started', props: { variant: 'primary' }, fallback: 'Get Started' },
        { id: 'el-img', type: 'image', props: { src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591', alt: 'Food Hero' }, fallback: 'Food' },
      ],
    },
    {
      id: 'sec-features',
      type: 'cards',
      elements: [
        { id: 'el-cards', type: 'cards', props: { items: [{ title: 'Feature 1', description: 'Desc' }] }, fallback: 'Features' },
      ],
    },
    {
      id: 'sec-footer',
      type: 'footer',
      elements: [
        { id: 'el-footer', type: 'text', content: 'Footer Text', fallback: 'Footer' },
      ],
    },
  ],
};

async function runTests() {
  console.log('\n--- Running NeuraMinds AI Product Intelligence Test Suite ---\n');

  // 1. Requirement Gap Detection
  console.log('── 1. Requirement Gap Detection ────────────────────────────────');
  const reqRes = await analyzeRequirements({ prompt: 'Create a food ordering app', uiPage: mockUIPage });
  assert('analyzeRequirements returns object with summary', typeof reqRes.summary === 'string');
  assert('analyzeRequirements identifies missing requirements array', Array.isArray(reqRes.missingRequirements));
  assert('analyzeRequirements includes priorities array', Array.isArray(reqRes.priorities));
  assert('analyzeRequirements includes assumptions & questions', Array.isArray(reqRes.assumptions) && Array.isArray(reqRes.recommendedQuestions));

  // 2. Frontend Architecture Recommendation
  console.log('\n── 2. Frontend Architecture Recommendation ─────────────────────');
  const archRes = await getArchitectureRecommendation({ prompt: 'Create SaaS dashboard', uiPage: mockUIPage });
  assert('getArchitectureRecommendation returns feature-based or component-based', archRes.architecture === 'feature-based' || archRes.architecture === 'component-based');
  assert('Recommends state management as Redux Toolkit', archRes.stateManagement.includes('Redux Toolkit'));
  assert('Provides recommended folder structure', Array.isArray(archRes.recommendedStructure) && archRes.recommendedStructure.length > 0);

  // 3. MVC/MVVM Pattern Recommendation
  console.log('\n── 3. MVC / MVVM Pattern Recommendation ────────────────────────');
  const patternRes = await getPatternRecommendation({ prompt: 'Create analytics dashboard', uiPage: mockUIPage });
  assert('getPatternRecommendation returns recommendedPattern', patternRes.recommendedPattern === 'MVVM' || patternRes.recommendedPattern === 'MVC');
  assert('Pattern recommendation includes confidence score', typeof patternRes.confidence === 'number');
  assert('Includes layer responsibilities', Array.isArray(patternRes.layers) && patternRes.layers.length > 0);

  // 4. UI Quality Score
  console.log('\n── 4. UI Quality Score & 10 Categories ─────────────────────────');
  const qualityRes = calculateQualityScore(mockUIPage, 'Create a food ordering app');
  assert('Quality score returns numeric score between 0 and 100', qualityRes.score >= 0 && qualityRes.score <= 100);
  assert('Quality score returns valid letter grade', ['A', 'B', 'C', 'D', 'F'].includes(qualityRes.grade));
  assert('Returns 10 weighted categories', qualityRes.categories.length === 10);
  assert('Returns issues & recommendations arrays', Array.isArray(qualityRes.issues) && Array.isArray(qualityRes.recommendations));

  // 5. Design-to-Code Validation
  console.log('\n── 5. Design-to-Code Semantic Validation ───────────────────────');
  const designRes = validateDesignToCode('Create a food ordering app with hero and CTA button', mockUIPage);
  assert('validateDesignToCode returns matchScore', typeof designRes.matchScore === 'number');
  assert('Returns missingSections array', Array.isArray(designRes.missingSections));
  assert('Returns semanticFindings array', Array.isArray(designRes.semanticFindings));

  // 6. Safe Error Handling
  console.log('\n── 6. Null & Malformed Safety ──────────────────────────────────');
  const nullQuality = calculateQualityScore(null);
  assert('Null UIPage scores 0 with Grade F without crashing', nullQuality.score === 0 && nullQuality.grade === 'F');
  const nullDesign = validateDesignToCode('', null);
  assert('Null UIPage design validation handles safely without throwing', nullDesign.matchScore === 0);

  // 7. Express API Endpoints Verification
  console.log('\n── 7. Express API Endpoints (localhost:5000) ───────────────────');
  try {
    const payload = JSON.stringify({ prompt: 'Food delivery website', uiPage: mockUIPage });

    const reqResApi = await httpRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/analyze-requirements',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      payload
    );
    assert('POST /api/analyze-requirements returns HTTP 200', reqResApi.statusCode === 200);
    assert('API response contains success flag & data', reqResApi.json()?.success === true);

    const fullApi = await httpRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/product-intelligence',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      payload
    );
    assert('POST /api/product-intelligence returns HTTP 200', fullApi.statusCode === 200);
    assert('Unified endpoint returns requirements, architecture, pattern, & quality', !!fullApi.json()?.data?.requirements && !!fullApi.json()?.data?.quality);
  } catch (err) {
    assert('API endpoints executed (Note: server must be running)', false, err.message);
  }

  console.log('\n========================================');
  console.log(`INTELLIGENCE TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

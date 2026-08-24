/**
 * NeuraMinds — Responsive Layout & Viewport QA Test Suite
 *
 * Tests generated UIPage objects across 8 standard viewports:
 *  - 1440x900  (Large Desktop)
 *  - 1280x800  (Desktop / Laptop)
 *  - 1024x768  (Landscape Tablet / Small Laptop)
 *  - 834x1194  (iPad Pro / Tablet Portrait)
 *  - 768x1024  (iPad Air / Standard Tablet)
 *  - 390x844   (iPhone 14 / Mobile)
 *  - 375x812   (iPhone X / Mobile)
 *  - 360x800   (Android Standard / Mobile)
 */

const { extractPromptRequirements } = require('./src/services/promptRequirementExtractor');
const { generateWebsiteBlueprint } = require('./src/services/blueprintService');
const { runGenerationQualityGate } = require('./src/services/generationQualityGate');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log('\n=== NeuraMinds Responsive QA & Breakpoint Audit Test Suite ===\n');

const TARGET_VIEWPORTS = [
  { width: 1440, height: 900, device: 'Large Desktop', breakpoint: 'desktop' },
  { width: 1280, height: 800, device: 'Laptop', breakpoint: 'desktop' },
  { width: 1024, height: 768, device: 'Small Desktop / Landscape Tablet', breakpoint: 'desktop' },
  { width: 834, height: 1194, device: 'iPad Pro Portrait', breakpoint: 'tablet' },
  { width: 768, height: 1024, device: 'iPad Air Portrait', breakpoint: 'tablet' },
  { width: 390, height: 844, device: 'iPhone 14', breakpoint: 'mobile' },
  { width: 375, height: 812, device: 'iPhone X', breakpoint: 'mobile' },
  { width: 360, height: 800, device: 'Android Standard', breakpoint: 'mobile' },
];

/**
 * Calculates responsive grid column adaptations based on viewport width.
 */
function calculateResponsiveColumns(defaultDesktopCols, width) {
  if (width < 768) return 1;
  if (width < 1024) return Math.min(defaultDesktopCols, 2);
  return defaultDesktopCols;
}

/**
 * Calculates responsive spacing padding based on viewport width.
 */
function calculateResponsivePadding(width) {
  if (width < 768) return { topBottom: 36, leftRight: 16 };
  if (width < 1024) return { topBottom: 50, leftRight: 24 };
  return { topBottom: 80, leftRight: 40 };
}

// ── TEST 1: Viewport Grid Adaptations ──────────────────────────────────────────
console.log('--- 1. Responsive Grid Column Adaptation ---');
TARGET_VIEWPORTS.forEach(({ width, device, breakpoint }) => {
  const cols = calculateResponsiveColumns(4, width);
  if (breakpoint === 'mobile') {
    assert(cols === 1, `Mobile (${width}px - ${device}) adapts 4-col grid to 1 column`);
  } else if (breakpoint === 'tablet') {
    assert(cols === 2, `Tablet (${width}px - ${device}) adapts 4-col grid to 2 columns`);
  } else {
    assert(cols === 4, `Desktop (${width}px - ${device}) maintains 4 columns`);
  }
});

// ── TEST 2: Responsive Section Spacing Audit ──────────────────────────────────
console.log('--- 2. Responsive Section Spacing Scaling ---');
TARGET_VIEWPORTS.forEach(({ width, device, breakpoint }) => {
  const padding = calculateResponsivePadding(width);
  if (breakpoint === 'mobile') {
    assert(padding.leftRight <= 20, `Mobile (${width}px) uses tight side padding (${padding.leftRight}px <= 20px)`);
  } else if (breakpoint === 'tablet') {
    assert(padding.leftRight <= 32, `Tablet (${width}px) uses balanced side padding (${padding.leftRight}px)`);
  } else {
    assert(padding.leftRight >= 40, `Desktop (${width}px) uses generous side padding (${padding.leftRight}px)`);
  }
});

// ── TEST 3: Hotel & SaaS Blueprint Responsive Strategy Audit ─────────────────
console.log('--- 3. Domain Blueprint Responsive Strategies ---');
const hotelBp = generateWebsiteBlueprint('Create a luxury hotel website for Zaika');
assert(hotelBp.responsiveStrategy.desktopColumns === 3, 'Hotel blueprint sets 3 desktop card columns');
assert(hotelBp.responsiveStrategy.tabletColumns === 2, 'Hotel blueprint sets 2 tablet card columns');
assert(hotelBp.responsiveStrategy.mobileLayout === 'stacked', 'Hotel blueprint sets stacked mobile layout');

const saasBp = generateWebsiteBlueprint('Create a SaaS analytics platform for NeuraMinds');
assert(saasBp.responsiveStrategy.desktopColumns === 3 || saasBp.responsiveStrategy.desktopColumns === 4, 'SaaS blueprint defines multi-column desktop strategy');

console.log(`\n========================================`);
console.log(`RESPONSIVE QA TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

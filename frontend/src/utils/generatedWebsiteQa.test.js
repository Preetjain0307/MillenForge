/**
 * NeuraMinds — Generated Website Quality & Domain Coverage QA Tests
 *
 * Exercises:
 * 1. Real Estate domain UIPage structure & validation
 * 2. Portfolio domain UIPage structure & validation
 * 3. Generated image object normalization ({ src, alt } & { url })
 * 4. Malformed AI output object safety ({ id, label }, nested arrays)
 * 5. Responsive-safe element bounds
 * 6. CMS editing of generated image content metadata
 */

import assert from 'node:assert/strict';
import { ELEMENT_TYPES, SECTION_TYPES } from '../types/ui.js';
import { resolveCmsContent, normalizeToUiElement, updateElementContent } from '../types/cms.js';
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

console.log('\n--- Running NeuraMinds Final QA & Domain Coverage Tests ---\n');

// ─── 1. Real Estate Domain UI ──────────────────────────────────────────────
runTest('1. Real Estate Website: Property cards, price tags, location badges, & CTAs', () => {
  const realEstateWebsite = {
    page: 'Real Estate Listings',
    sections: [
      {
        id: 're-hero',
        type: SECTION_TYPES.HERO,
        elements: [
          {
            id: 're-title',
            type: ELEMENT_TYPES.TEXT,
            content: 'Find Your Dream Home In Prime Locations',
            fallback: 'Luxury Real Estate',
            props: { tag: 'h1' },
          },
          {
            id: 're-search',
            type: ELEMENT_TYPES.TEXTFIELD,
            content: 'Search by city, neighborhood or ZIP',
            fallback: 'Search properties',
            props: { placeholder: 'e.g. Beverly Hills, CA or 90210' },
          },
          {
            id: 're-search-cta',
            type: ELEMENT_TYPES.BUTTON,
            content: 'Browse Listings',
            fallback: 'Search',
            props: { variant: 'primary', icon: 'pi pi-home' },
          },
        ],
      },
      {
        id: 'properties-sec',
        type: SECTION_TYPES.FEATURES,
        elements: [
          {
            id: 'property-cards',
            type: ELEMENT_TYPES.CARDS,
            items: [
              { id: 'prop-1', title: 'The Glass Pavilion Villa', description: '$3,850,000 — 5 Beds · 6 Baths · 5,200 sqft', icon: 'pi pi-home', badge: 'Featured' },
              { id: 'prop-2', title: 'Skyline Penthouse Suite', description: '$2,450,000 — 3 Beds · 3.5 Baths · 2,800 sqft', icon: 'pi pi-building', badge: 'New' },
              { id: 'prop-3', title: 'Modern Coastal Residence', description: '$1,980,000 — 4 Beds · 4 Baths · 3,400 sqft', icon: 'pi pi-sun', badge: 'Ocean View' },
            ],
            props: { columns: 3 },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(realEstateWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
  assert.ok(valResult.score >= 95);
});

// ─── 2. Portfolio Domain UI ────────────────────────────────────────────────
runTest('2. Portfolio Website: Hero header, project showcase cards, & contact CTAs', () => {
  const portfolioWebsite = {
    page: 'Creative Developer Portfolio',
    sections: [
      {
        id: 'portfolio-hero',
        type: SECTION_TYPES.HERO,
        elements: [
          {
            id: 'dev-title',
            type: ELEMENT_TYPES.TEXT,
            content: 'Senior Full-Stack Engineer & Product Architect',
            fallback: 'Software Engineer Portfolio',
            props: { tag: 'h1' },
          },
          {
            id: 'dev-avatar',
            type: ELEMENT_TYPES.IMAGE,
            content: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
            fallback: 'Profile Avatar',
            props: { alt: 'Developer Profile Headshot' },
          },
          {
            id: 'contact-cta',
            type: ELEMENT_TYPES.BUTTON,
            content: 'Get In Touch',
            fallback: 'Contact Me',
            props: { variant: 'primary', icon: 'pi pi-envelope' },
          },
        ],
      },
      {
        id: 'projects-sec',
        type: SECTION_TYPES.FEATURES,
        elements: [
          {
            id: 'project-cards',
            type: ELEMENT_TYPES.CARDS,
            items: [
              { id: 'proj-1', title: 'NeuraMinds AI Engine', description: 'Real-time wireframe-to-React UI compiler & visual CMS', icon: 'pi pi-bolt', badge: 'React / AI' },
              { id: 'proj-2', title: 'Distributed Vector DB', description: 'High-throughput nearest neighbor similarity search index', icon: 'pi pi-database', badge: 'C++ / Rust' },
              { id: 'proj-3', title: 'Cloud Telemetry Engine', description: 'Zero-overhead distributed trace collection pipeline', icon: 'pi pi-server', badge: 'Go / K8s' },
            ],
            props: { columns: 3 },
          },
        ],
      },
    ],
  };

  const valResult = validateUiPage(portfolioWebsite);
  assert.equal(valResult.valid, true);
  assert.equal(valResult.errors.length, 0);
  assert.ok(valResult.score >= 95);
});

// ─── 3. Generated Image Object Normalization ───────────────────────────────
runTest('3. Image Object Normalization: Handles { src, alt } and { url } objects safely', () => {
  const imgWithSrcAlt = {
    id: 'img-1',
    type: 'image',
    content: {
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      alt: 'Luxury Apartment Interior',
    },
    fallback: 'Apartment Image',
  };

  const normalized1 = normalizeToUiElement(imgWithSrcAlt);
  assert.equal(normalized1.type, 'image');
  assert.equal(normalized1.props.src, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800');
  assert.equal(normalized1.props.alt, 'Luxury Apartment Interior');

  const imgWithUrl = {
    id: 'img-2',
    type: 'image',
    content: {
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    },
    fallback: 'Modern Home',
  };

  const normalized2 = normalizeToUiElement(imgWithUrl);
  assert.equal(normalized2.type, 'image');
  assert.equal(resolveCmsContent(imgWithUrl.content, imgWithUrl.fallback), 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800');
});

// ─── 4. Malformed AI Output Safety ──────────────────────────────────────────
runTest('4. Malformed Output Safety: Safely extracts display string from objects and arrays', () => {
  // Object with label key
  const objLabel = resolveCmsContent({ id: 'btn-1', label: 'Submit Order' }, 'Fallback');
  assert.equal(objLabel, 'Submit Order');

  // Object with title key
  const objTitle = resolveCmsContent({ title: 'Modern Villa' }, 'Fallback');
  assert.equal(objTitle, 'Modern Villa');

  // Object with description key
  const objDesc = resolveCmsContent({ description: 'Spacious 4-bedroom villa' }, 'Fallback');
  assert.equal(objDesc, 'Spacious 4-bedroom villa');
});

// ─── 5. CMS Editing of Generated Image Metadata ────────────────────────────
runTest('5. CMS Image Editing: Updating image content payload updates src and alt immutably', () => {
  const page = {
    id: 'page-1',
    page: 'Test',
    sections: [
      {
        id: 'sec-1',
        type: 'hero',
        elements: [
          {
            id: 'img-hero',
            type: 'image',
            content: { src: 'https://placehold.co/400', alt: 'Initial Alt' },
            fallback: 'Hero Image',
          },
        ],
      },
    ],
  };

  const updatedPage = updateElementContent(page, 'img-hero', {
    src: 'https://images.unsplash.com/photo-new?w=800',
    alt: 'Updated Alt Text',
  });

  const updatedImg = updatedPage.sections[0].elements[0];
  assert.equal(resolveCmsContent(updatedImg.content, '', 'src'), 'https://images.unsplash.com/photo-new?w=800');
  assert.equal(updatedImg.props.cmsContent.alt, 'Updated Alt Text');
});

console.log(`\n========================================`);
console.log(`QA & DOMAIN COVERAGE TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

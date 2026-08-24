/**
 * NeuraMinds — UI Quality Scorer & Design-to-Code Validator
 *
 * Deterministic scoring engine for generated UIPage structures.
 * Measures 10 quality categories and semantic design intent matching.
 */

const calculateQualityScore = (uiPage, prompt = '', wireframeMeta = null) => {
  if (!uiPage || typeof uiPage !== 'object' || !Array.isArray(uiPage.sections)) {
    return {
      score: 0,
      grade: 'F',
      categories: [],
      issues: ['Invalid or empty UIPage structure.'],
      recommendations: ['Regenerate page with a valid prompt.'],
    };
  }

  const sections = uiPage.sections;
  const allElements = sections.flatMap((s) => s.elements || []);
  const promptLower = String(prompt).toLowerCase();

  // 1. Structure Score (0-10)
  const sectionCount = sections.length;
  let structureScore = sectionCount >= 3 && sectionCount <= 7 ? 10 : sectionCount > 0 ? 6 : 2;

  // 2. Consistency Score (0-10)
  const hasNavbar = sections.some((s) => s.type === 'navbar' || s.id?.includes('nav') || s.id?.includes('header'));
  const hasHero = sections.some((s) => s.type === 'hero' || s.id?.includes('hero'));
  const hasFooter = sections.some((s) => s.type === 'footer' || s.id?.includes('footer'));
  let consistencyScore = (hasNavbar ? 3 : 0) + (hasHero ? 4 : 0) + (hasFooter ? 3 : 0);
  if (consistencyScore === 0) consistencyScore = 5;

  // 3. Responsiveness Score (0-10)
  const responsivePropsCount = allElements.filter(
    (el) => el.props?.className?.includes('sm:') || el.props?.className?.includes('md:') || el.props?.className?.includes('lg:') || el.props?.columns
  ).length;
  let responsivenessScore = responsivePropsCount > 3 ? 10 : responsivePropsCount > 0 ? 7 : 5;

  // 4. Accessibility Score (0-10)
  const imagesWithAlt = allElements.filter(
    (el) => el.type === 'image' && (el.props?.alt || el.content?.alt || el.fallback)
  ).length;
  const totalImages = allElements.filter((el) => el.type === 'image').length;
  let accessibilityScore = totalImages === 0 ? 9 : Math.round((imagesWithAlt / totalImages) * 10);

  // 5. Content Completeness Score (0-10)
  const elementsWithContent = allElements.filter(
    (el) => el.content && String(el.content).trim().length > 0
  ).length;
  let contentScore = allElements.length === 0 ? 0 : Math.round((elementsWithContent / allElements.length) * 10);

  // 6. Interaction Completeness Score (0-10)
  const buttonsAndInputs = allElements.filter(
    (el) => el.type === 'button' || el.type === 'input' || el.type === 'textfield' || el.type === 'link'
  ).length;
  let interactionScore = buttonsAndInputs >= 3 ? 10 : buttonsAndInputs >= 1 ? 7 : 4;

  // 7. Visual Hierarchy Score (0-10)
  const headings = allElements.filter(
    (el) => el.type === 'text' && (el.props?.tag === 'h1' || el.props?.tag === 'h2' || el.props?.tag === 'h3')
  ).length;
  let hierarchyScore = headings >= 2 ? 10 : headings === 1 ? 7 : 4;

  // 8. Image Quality Score (0-10)
  const validImages = allElements.filter(
    (el) => el.type === 'image' && (el.props?.src || el.content?.src) && !String(el.props?.src).includes('placehold.co')
  ).length;
  let imageQualityScore = totalImages === 0 ? 8 : Math.round((validImages / totalImages) * 10);

  // 9. Fallback Safety & Generic Stub Penalty Score (0-10)
  const elementsWithFallback = allElements.filter((el) => el.fallback && String(el.fallback).trim().length > 0).length;
  let fallbackScore = allElements.length === 0 ? 10 : Math.round((elementsWithFallback / allElements.length) * 10);

  // Deduct points if generic "Welcome to Home" stubs exist on domain-specific prompts
  const hasGenericStubs = allElements.some((el) => {
    const txt = (el.content || el.fallback || '').toString().toLowerCase();
    return txt.includes('welcome to home') || txt.includes('discover modern solutions');
  });
  if (hasGenericStubs && (promptLower.includes('college') || promptLower.includes('food') || promptLower.includes('hospital') || promptLower.includes('bank'))) {
    fallbackScore = Math.max(0, fallbackScore - 5);
  }

  // 10. CMS Compatibility & Image Uniqueness Score (0-10)
  const uniqueIds = new Set(allElements.map((el) => el.id));
  const imageUrls = allElements.filter((el) => el.type === 'image' && (el.props?.src || el.content?.src)).map((el) => el.props?.src || el.content?.src);
  const uniqueImagesCount = new Set(imageUrls).size;
  const imageUniquenessPass = imageUrls.length === 0 || uniqueImagesCount === imageUrls.length;

  let cmsScore = (uniqueIds.size === allElements.length ? 5 : 2) + (imageUniquenessPass ? 5 : 2);

  const totalPoints =
    structureScore +
    consistencyScore +
    responsivenessScore +
    accessibilityScore +
    contentScore +
    interactionScore +
    hierarchyScore +
    imageQualityScore +
    fallbackScore +
    cmsScore;

  const score = Math.min(100, Math.max(0, totalPoints));

  let grade = 'A';
  if (score < 60) grade = 'F';
  else if (score < 70) grade = 'D';
  else if (score < 80) grade = 'C';
  else if (score < 90) grade = 'B';

  const categories = [
    { name: 'Structure & Layout', score: structureScore * 10, weight: '10%' },
    { name: 'Structural Consistency', score: consistencyScore * 10, weight: '10%' },
    { name: 'Responsiveness Intent', score: responsivenessScore * 10, weight: '10%' },
    { name: 'Accessibility & Alt Text', score: accessibilityScore * 10, weight: '10%' },
    { name: 'Content Completeness', score: contentScore * 10, weight: '10%' },
    { name: 'Interaction & CTAs', score: interactionScore * 10, weight: '10%' },
    { name: 'Visual Hierarchy', score: hierarchyScore * 10, weight: '10%' },
    { name: 'Image & Asset Quality', score: imageQualityScore * 10, weight: '10%' },
    { name: 'Fallback Safety', score: fallbackScore * 10, weight: '10%' },
    { name: 'CMS Binding Readiness', score: cmsScore * 10, weight: '10%' },
  ];

  const issues = [];
  const recommendations = [];

  if (!hasHero) {
    issues.push('Page lacks a distinct hero section.');
    recommendations.push('Add a prominent hero section with headline and primary CTA.');
  }
  if (interactionScore < 7) {
    issues.push('Low count of interactive elements (buttons/inputs).');
    recommendations.push('Include explicit CTAs and input fields for user engagement.');
  }
  if (accessibilityScore < 8) {
    issues.push('Some images are missing descriptive alt text.');
    recommendations.push('Ensure all image elements include descriptive alt properties.');
  }
  if (responsivenessScore < 7) {
    issues.push('Limited responsive break-point utilities detected.');
    recommendations.push('Use flex/grid responsive utilities (sm:, md:, lg:) for mobile compatibility.');
  }

  return {
    score,
    grade,
    categories,
    issues: issues.length > 0 ? issues : ['No critical quality defects detected.'],
    recommendations: recommendations.length > 0 ? recommendations : ['Page meets high production quality standards.'],
  };
};

const validateDesignToCode = (prompt = '', uiPage = null, wireframeMeta = null) => {
  if (!uiPage || !Array.isArray(uiPage.sections)) {
    return {
      matchScore: 0,
      missingSections: ['Hero', 'Features', 'Footer'],
      missingCTAs: ['Primary Action'],
      missingImages: ['Hero Visual'],
      elementMismatchCount: 0,
      semanticFindings: ['UIPage structure is invalid or absent.'],
    };
  }

  const promptLower = String(prompt).toLowerCase();
  const sections = uiPage.sections;
  const allElements = sections.flatMap((s) => s.elements || []);

  const expectedFeatures = [];
  const missingSections = [];
  const missingCTAs = [];
  const missingImages = [];
  const semanticFindings = [];

  // Check CTA requirement
  const hasCTA = allElements.some((el) => el.type === 'button' || el.type === 'link');
  if (!hasCTA) {
    missingCTAs.push('Primary Call to Action Button');
    semanticFindings.push('Design prompt implied actionable intent, but no CTA button was found in output.');
  }

  // Check Hero requirement
  const hasHero = sections.some((s) => s.type === 'hero' || s.id?.includes('hero'));
  if (promptLower.includes('hero') && !hasHero) {
    missingSections.push('Hero Section');
    semanticFindings.push('Prompt explicitly requested a Hero section, but it was omitted.');
  }

  // Check Feature Cards requirement
  const hasCards = sections.some((s) => s.type === 'cards' || s.type === 'features') || allElements.some((el) => el.type === 'card' || el.type === 'cards');
  if ((promptLower.includes('card') || promptLower.includes('feature')) && !hasCards) {
    missingSections.push('Feature Cards Grid');
    semanticFindings.push('Prompt requested feature cards, but no card collection element was found.');
  }

  // Check Images requirement
  const hasImages = allElements.some((el) => el.type === 'image' || el.props?.src || el.props?.items?.some((i) => i.src || i.image));
  if ((promptLower.includes('image') || promptLower.includes('visual') || promptLower.includes('hero')) && !hasImages) {
    missingImages.push('Hero / Feature Visual Asset');
    semanticFindings.push('Design intent suggested visual content, but image elements were missing.');
  }

  let matchPoints = 100;
  matchPoints -= missingSections.length * 15;
  matchPoints -= missingCTAs.length * 15;
  matchPoints -= missingImages.length * 10;
  const matchScore = Math.max(30, Math.min(100, matchPoints));

  if (semanticFindings.length === 0) {
    semanticFindings.push('Generated UIPage structure faithfully captures all design requirements.');
  }

  return {
    matchScore,
    missingSections,
    missingCTAs,
    missingImages,
    elementMismatchCount: missingSections.length + missingCTAs.length + missingImages.length,
    semanticFindings,
  };
};

module.exports = {
  calculateQualityScore,
  validateDesignToCode,
};

/**
 * NeuraMinds — Brand Identity & Emotional Direction Generator
 *
 * Generates bespoke brand identity, emotional direction, visual metaphor,
 * typography philosophy, and color palette based on prompt and domain intent.
 */

const { extractPromptRequirements } = require('./promptRequirementExtractor');

/**
 * Generate a complete BrandIdentity specification.
 *
 * @param {string} prompt
 * @returns {object} BrandIdentity
 */
const generateBrandIdentity = (prompt = '') => {
  const p = String(prompt).toLowerCase().trim();
  const reqSpec = extractPromptRequirements(prompt);
  const domain = reqSpec.domain;

  // Extract explicit or inferred brand name
  const brandMatch = prompt.match(/(?:named as|named|called|brand|hotel|restaurant|store|company)\s+([a-zA-Z0-9\s'-]+?)(?:\s+and|\s+with|\s+for|\s+website|\s+page|$)/i);
  let brandName = brandMatch ? brandMatch[1].trim().toUpperCase() : 'NEXUS';
  if (p.includes('zaika')) brandName = 'ZAIKA';
  else if (p.includes('ember')) brandName = 'EMBER';
  else if (p.includes('lumina')) brandName = 'LUMINA';
  else if (p.includes('velvet')) brandName = 'VELVET';
  else if (p.includes('apex')) brandName = 'APEX';
  else if (domain === 'hotel') brandName = 'ZAIKA HOTEL';
  else if (domain === 'food') brandName = 'EMBER & OAK';
  else if (domain === 'travel') brandName = 'SOLIS ESCAPES';
  else if (domain === 'fashion') brandName = 'ATELIER V';
  else if (domain === 'saas') brandName = 'SYNAPSE AI';
  else if (domain === 'hospital') brandName = 'SANCTUARY HEALTH';
  else if (domain === 'college') brandName = 'VERITAS ACADEMY';

  // Emotional direction selection
  let emotionalDirection = ['LUXURY', 'EDITORIAL', 'CINEMATIC'];
  if (domain === 'saas' || domain === 'banking') emotionalDirection = ['TECHNICAL', 'TRUSTED', 'PREMIUM'];
  else if (domain === 'gaming') emotionalDirection = ['FUTURISTIC', 'BOLD', 'ENERGETIC'];
  else if (domain === 'hospital') emotionalDirection = ['CALM', 'TRUSTED', 'WARM'];
  else if (domain === 'travel') emotionalDirection = ['CINEMATIC', 'ASPIRATIONAL', 'LUXURY'];
  else if (domain === 'fashion') emotionalDirection = ['EDITORIAL', 'MINIMAL', 'LUXURY'];

  // Visual fingerprint
  const designFingerprint = `fp_${domain}_${Date.now().toString(36)}`;

  return {
    brandName,
    tagline: reqSpec.headline || `Elevating ${domain.toUpperCase()} Through Craft & Innovation`,
    emotionalDirection,
    personality: ['Craftsmanship', 'Sophisticated', 'Memorable', 'Distinctive'],
    visualMetaphor: domain === 'food' ? 'Fire + Artisanal Craft' : 'Precision + Flow',
    colorPhilosophy: reqSpec.colorSpec ? `${reqSpec.colorSpec.background} canvas with ${reqSpec.colorSpec.buttonBackground} focal accents` : 'Rich high-contrast canvas with vibrant domain accents',
    typographyPhilosophy: 'High-contrast editorial display pairing with neutral geometric body font',
    imagePhilosophy: 'Cinematic high-resolution photography with strategic focal overlays',
    shapeLanguage: { radius: '16px', border: '1px solid rgba(255,255,255,0.08)' },
    interactionPhilosophy: 'Subtle elevation, glowing borders, and smooth state transitions',
    spacingMode: domain === 'food' || domain === 'travel' || domain === 'fashion' ? 'dramatic' : 'balanced',
    heroComposition: domain === 'food' ? 'FULL_BLEED_CINEMATIC' : (domain === 'travel' ? 'EDITORIAL_SPLIT' : 'ASYMMETRIC_IMAGE'),
    designFingerprint,
  };
};

module.exports = {
  generateBrandIdentity,
};

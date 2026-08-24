/**
 * NeuraMinds — Website Blueprint Service
 *
 * Generates an architectural WebsiteBlueprint before UIPage generation.
 * Reason about product, audience, brand, visual storytelling, information hierarchy,
 * content strategy, asset strategy, interaction strategy, and responsive layout.
 */

const { extractPromptRequirements } = require('./promptRequirementExtractor');

/**
 * Generate a complete WebsiteBlueprint object from a user prompt.
 *
 * @param {string} prompt
 * @param {string} [pageName='Home']
 * @returns {object} WebsiteBlueprint
 */
const generateWebsiteBlueprint = (prompt = '', pageName = 'Home') => {
  const p = String(prompt).toLowerCase().trim();
  const domainInfo = extractPromptRequirements(prompt);
  const domain = domainInfo.domain;

  const blueprintMap = {
    food: {
      product: { domain: 'food', name: 'Gourmet Dining & Delivery', description: 'Award-winning culinary experience with fast modern ordering.' },
      audience: { primary: 'Food enthusiasts, urban professionals & families', intent: 'Discover dishes and order fresh food' },
      goal: { primaryConversion: 'Place Food Order', visualStory: 'Appetite-triggering visual hero to signature menu discovery' },
      brand: { personality: ['Warm', 'Appetizing', 'Energetic', 'Premium'], mood: ['Vibrant', 'Inviting', 'Delicious'], visualLanguage: 'High-contrast food photography with warm crimson and gold accents', styleSeed: 'food-editorial-v2' },
      visualDirection: { heroComposition: 'EDITORIAL_HERO', sectionLayouts: ['NAVBAR', 'EDITORIAL_HERO', 'CATEGORY_GRID', 'PRODUCT_GRID', 'BENTO_GRID', 'STATS_BAR', 'TESTIMONIALS', 'FOOTER'], spacingDensity: 'generous', typographyMood: 'display-serif' },
      navigation: { items: [{ label: 'Menu', target: '#menu' }, { label: 'Signature Dishes', target: '#dishes' }, { label: 'Offers', target: '#offers' }, { label: 'Reviews', target: '#reviews' }, { label: 'Order Now', target: '#order', isPrimary: true }] },
      sections: [
        { purpose: 'Brand Introduction & Hero Statement', userGoal: 'Immediate appetite trigger & ordering CTA', visualRole: 'Hero image showcase', contentRole: 'Headlines, badges & primary CTA', layoutPattern: 'EDITORIAL_HERO', importance: 10, sectionType: 'hero' },
        { purpose: 'Category Navigation', userGoal: 'Filter menu by preference', visualRole: 'Interactive category chips', contentRole: 'Category tags', layoutPattern: 'FILTER_BAR', importance: 8, sectionType: 'categories' },
        { purpose: 'Signature Dishes Showcase', userGoal: 'Browse dishes with prices & ratings', visualRole: 'High-res dish cards', contentRole: 'Dishes, prices, ratings & Add to Cart CTA', layoutPattern: 'EDITORIAL_GRID', importance: 9, sectionType: 'cards' },
        { purpose: 'Culinary Excellence Pillars', userGoal: 'Build trust & highlight quality ingredients', visualRole: 'Bento feature cards', contentRole: 'Quality promises & chef credentials', layoutPattern: 'BENTO_GRID', importance: 7, sectionType: 'features' },
        { purpose: 'Social Proof & Metrics', userGoal: 'Validate restaurant popularity', visualRole: 'Stat numbers & customer ratings', contentRole: 'Metrics & reviews', layoutPattern: 'STATS_BAR', importance: 8, sectionType: 'testimonials' },
        { purpose: 'Grand Ordering CTA & Footer', userGoal: 'Final conversion & navigation', visualRole: 'Brand footer', contentRole: 'Footer links & ordering CTA', layoutPattern: 'FOOTER', importance: 9, sectionType: 'footer' },
      ],
      contentStrategy: { tone: 'warm & sensory', keyCopy: 'Handcrafted with organic ingredients', callToAction: 'Order Fresh Now' },
      assetStrategy: { heroQuery: 'cinematic gourmet restaurant food dish', cardQueryPattern: 'gourmet food photo', density: 'high' },
      interactionStrategy: { hoverStyle: 'lift-and-glow', modalSupport: true, cartSupport: true },
      responsiveStrategy: { desktopColumns: 3, tabletColumns: 2, mobileLayout: 'stacked' },
    },
    hotel: {
      product: { domain: 'hotel', name: 'Zaika Boutique Hotel & Suites', description: 'Refined luxury accommodations, private wellness spa, and fine dining.' },
      audience: { primary: 'Discerning travelers, luxury vacationers & business executives', intent: 'Explore luxury suites & reserve hotel stay' },
      goal: { primaryConversion: 'Book Your Stay', visualStory: 'High-end hospitality experience from suite selection to dining' },
      brand: { personality: ['Sophisticated', 'Warm', 'Attentive', 'Luxurious'], mood: ['Serene', 'Opulent', 'Refined'], visualLanguage: 'Warm ivory canvas with charcoal typography and gold accents', styleSeed: 'hotel-luxury-v1' },
      visualDirection: { heroComposition: 'FULL_BLEED_HERO', sectionLayouts: ['NAVBAR', 'FULL_BLEED_HERO', 'PRODUCT_GRID', 'BENTO_GRID', 'STATS_BAR', 'TESTIMONIALS', 'FOOTER'], spacingDensity: 'luxurious', typographyMood: 'editorial-serif' },
      navigation: { items: [{ label: 'Rooms', target: '#rooms' }, { label: 'Suites', target: '#suites' }, { label: 'Dining', target: '#dining' }, { label: 'Amenities', target: '#amenities' }, { label: 'Book Stay', target: '#book', isPrimary: true }] },
      sections: [
        { purpose: 'Boutique Hotel Hero', userGoal: 'Immediate impression of luxury stay & booking CTA', visualRole: 'Full-bleed luxury suite photography', contentRole: 'Headlines, subheadings & Book Your Stay CTA', layoutPattern: 'FULL_BLEED_HERO', importance: 10, sectionType: 'hero' },
        { purpose: 'Featured Rooms & Luxury Suites', userGoal: 'Explore rooms with rates and amenities', visualRole: 'Suite photography cards', contentRole: 'Suites, prices, amenities & Book CTA', layoutPattern: 'EDITORIAL_GRID', importance: 9, sectionType: 'cards' },
        { purpose: 'Hotel Amenities & Fine Dining', userGoal: 'Discover spa, dining, pool & concierge services', visualRole: 'Bento highlight grid', contentRole: 'Amenities & dining details', layoutPattern: 'BENTO_GRID', importance: 8, sectionType: 'features' },
        { purpose: 'Guest Reviews & Trust Metrics', userGoal: 'Review feedback from verified hotel guests', visualRole: 'Guest quote cards', contentRole: 'Testimonials & star ratings', layoutPattern: 'TESTIMONIAL_CAROUSEL', importance: 8, sectionType: 'testimonials' },
        { purpose: 'Hotel Location & Footer', userGoal: 'View address, nearby attractions & footer links', visualRole: 'Footer layout', contentRole: 'Address, phone, social & legal', layoutPattern: 'FOOTER', importance: 9, sectionType: 'footer' },
      ],
      contentStrategy: { tone: 'warm & sophisticated', keyCopy: 'A refined stay designed around you', callToAction: 'Book Your Stay' },
      assetStrategy: { heroQuery: 'luxury hotel suite interior', cardQueryPattern: 'luxury hotel room suite bed', density: 'high' },
      interactionStrategy: { hoverStyle: 'lift-and-glow', modalSupport: true, cartSupport: false },
      responsiveStrategy: { desktopColumns: 3, tabletColumns: 2, mobileLayout: 'stacked' },
    },
    travel: {
      product: { domain: 'travel', name: 'Luxe Resort & Escapes', description: 'Curated luxury travel experiences and boutique hotel bookings.' },
      audience: { primary: 'Premium travelers & adventure seekers', intent: 'Explore destinations & book stays' },
      goal: { primaryConversion: 'Reserve Experience', visualStory: 'Cinematic photography-first destination story' },
      brand: { personality: ['Aspirational', 'Cinematic', 'Elegant', 'Calm'], mood: ['Serene', 'Luxe', 'Expansive'], visualLanguage: 'Full-bleed ocean photography with gold typography', styleSeed: 'travel-cinematic-v2' },
      visualDirection: { heroComposition: 'FULL_BLEED_HERO', sectionLayouts: ['NAVBAR', 'FULL_BLEED_HERO', 'PRODUCT_GRID', 'BENTO_GRID', 'STATS_BAR', 'TESTIMONIALS', 'FOOTER'], spacingDensity: 'luxurious', typographyMood: 'editorial-serif' },
      navigation: { items: [{ label: 'Destinations', target: '#destinations' }, { label: 'Villas', target: '#villas' }, { label: 'Experiences', target: '#experiences' }, { label: 'Deals', target: '#deals' }, { label: 'Book Stay', target: '#book', isPrimary: true }] },
      sections: [
        { purpose: 'Immersive Destination Hero', userGoal: 'Evoke wanderlust & present booking search', visualRole: 'Full-bleed luxury resort photography', contentRole: 'Headline & search bar', layoutPattern: 'FULL_BLEED_HERO', importance: 10, sectionType: 'hero' },
        { purpose: 'Featured Destinations', userGoal: 'Select location and view pricing', visualRole: 'Destination photography cards', contentRole: 'Locations, rates & ratings', layoutPattern: 'EDITORIAL_GRID', importance: 9, sectionType: 'cards' },
        { purpose: 'Resort Amenities & Experiences', userGoal: 'Discover unique activities', visualRole: 'Bento highlight grid', contentRole: 'Experience stories', layoutPattern: 'BENTO_GRID', importance: 8, sectionType: 'features' },
        { purpose: 'Traveler Ratings & Trust Metrics', userGoal: 'Review feedback from verified guests', visualRole: 'Guest quote cards', contentRole: 'Testimonials & star ratings', layoutPattern: 'TESTIMONIAL_CAROUSEL', importance: 8, sectionType: 'testimonials' },
        { purpose: 'Reservation Footer', userGoal: 'Complete reservation', visualRole: 'Footer layout', contentRole: 'Footer navigation', layoutPattern: 'FOOTER', importance: 9, sectionType: 'footer' },
      ],
      contentStrategy: { tone: 'cinematic & evocative', keyCopy: 'Unforgettable escapes in world-class destinations', callToAction: 'Reserve Your Escape' },
      assetStrategy: { heroQuery: 'luxury resort tropical villa ocean landscape', cardQueryPattern: 'travel destination hotel resort', density: 'high' },
      interactionStrategy: { hoverStyle: 'zoom-overlay', modalSupport: true, cartSupport: false },
      responsiveStrategy: { desktopColumns: 3, tabletColumns: 2, mobileLayout: 'stacked' },
    },
    fashion: {
      product: { domain: 'fashion', name: 'Contemporary Atelier', description: 'High-end designer apparel and seasonal runway collections.' },
      audience: { primary: 'Fashion-forward trendsetters', intent: 'Browse collections & purchase' },
      goal: { primaryConversion: 'Explore Collection', visualStory: 'Editorial lookbook showcasing signature silhouettes' },
      brand: { personality: ['Editorial', 'Minimal', 'Sophisticated', 'Bold'], mood: ['High-contrast', 'Chic'], visualLanguage: 'Monochrome imagery with rose gold highlights', styleSeed: 'fashion-editorial-v2' },
      visualDirection: { heroComposition: 'ASYMMETRIC_HERO', sectionLayouts: ['NAVBAR', 'ASYMMETRIC_HERO', 'PRODUCT_GRID', 'BENTO_GRID', 'TESTIMONIALS', 'FOOTER'], spacingDensity: 'editorial', typographyMood: 'sans-display' },
      navigation: { items: [{ label: 'New Arrivals', target: '#new' }, { label: 'Collections', target: '#collections' }, { label: 'Women', target: '#women' }, { label: 'Men', target: '#men' }, { label: 'Shop Now', target: '#shop', isPrimary: true }] },
      sections: [
        { purpose: 'Seasonal Collection Hero', userGoal: 'Visual intrigue & instant collection access', visualRole: 'High-fashion editorial photography', contentRole: 'Collection title & CTA', layoutPattern: 'ASYMMETRIC_HERO', importance: 10, sectionType: 'hero' },
        { purpose: 'Product Catalog', userGoal: 'View items, prices & sizes', visualRole: 'Product cards', contentRole: 'Product names, prices & Add to Bag', layoutPattern: 'EDITORIAL_GRID', importance: 9, sectionType: 'cards' },
        { purpose: 'Atelier Craftsmanship Story', userGoal: 'Understand brand heritage', visualRole: 'Story images', contentRole: 'Craftsmanship details', layoutPattern: 'BENTO_GRID', importance: 7, sectionType: 'features' },
        { purpose: 'Footer & Newsletter', userGoal: 'Newsletter subscription', visualRole: 'Footer container', contentRole: 'Links & email form', layoutPattern: 'FOOTER', importance: 8, sectionType: 'footer' },
      ],
      contentStrategy: { tone: 'editorial & refined', keyCopy: 'Sculpted silhouettes for modern elegance', callToAction: 'Discover Collection' },
      assetStrategy: { heroQuery: 'high fashion model editorial clothing runway', cardQueryPattern: 'fashion apparel model outfit', density: 'high' },
      interactionStrategy: { hoverStyle: 'subtle-scale', modalSupport: true, cartSupport: true },
      responsiveStrategy: { desktopColumns: 3, tabletColumns: 2, mobileLayout: 'stacked' },
    },
    saas: {
      product: { domain: 'saas', name: 'Cloud Intelligence Platform', description: 'Next-generation analytics, automated workflows, and data orchestration.' },
      audience: { primary: 'Engineering leaders & product managers', intent: 'Evaluate features & start trial' },
      goal: { primaryConversion: 'Start Free Trial', visualStory: 'Hero statement to dashboard interactive preview to feature depth' },
      brand: { personality: ['Trustworthy', 'Sophisticated', 'Modern', 'High-tech'], mood: ['Clean', 'Data-driven'], visualLanguage: 'Obsidian dark canvas with cyan glowing borders', styleSeed: 'saas-modern-v2' },
      visualDirection: { heroComposition: 'SPLIT_HERO', sectionLayouts: ['NAVBAR', 'SPLIT_HERO', 'LOGOCLOUD', 'BENTO_GRID', 'PRODUCT_GRID', 'PRICING', 'FAQ', 'FOOTER'], spacingDensity: 'balanced', typographyMood: 'inter-sans' },
      navigation: { items: [{ label: 'Product', target: '#product' }, { label: 'Solutions', target: '#solutions' }, { label: 'Pricing', target: '#pricing' }, { label: 'Docs', target: '#docs' }, { label: 'Start Free Trial', target: '#signup', isPrimary: true }] },
      sections: [
        { purpose: 'Product Proposition Hero', userGoal: 'Understand core value & start trial', visualRole: 'Dashboard mockup visual', contentRole: 'Headline, key metrics & trial CTA', layoutPattern: 'SPLIT_HERO', importance: 10, sectionType: 'hero' },
        { purpose: 'Social Proof Logo Cloud', userGoal: 'Verify customer trust', visualRole: 'Brand logos', contentRole: 'Logo grid', layoutPattern: 'LOGOCLOUD', importance: 8, sectionType: 'logocloud' },
        { purpose: 'Core Capabilities Grid', userGoal: 'Explore feature set', visualRole: 'Bento feature cards', contentRole: 'Feature titles & descriptions', layoutPattern: 'BENTO_GRID', importance: 9, sectionType: 'features' },
        { purpose: 'Transparent Pricing Tiers', userGoal: 'Compare plans', visualRole: 'Pricing cards', contentRole: 'Plan prices & feature lists', layoutPattern: 'PRICING', importance: 9, sectionType: 'pricing' },
        { purpose: 'FAQ & Conversion Footer', userGoal: 'Resolve objections & sign up', visualRole: 'FAQ accordion & CTA', contentRole: 'Questions & final CTA', layoutPattern: 'FOOTER', importance: 9, sectionType: 'footer' },
      ],
      contentStrategy: { tone: 'authoritative & clear', keyCopy: 'Empower your engineering team with sub-millisecond data analytics', callToAction: 'Start Free 14-Day Trial' },
      assetStrategy: { heroQuery: 'modern tech analytics dashboard interface chart', cardQueryPattern: 'cloud data software interface UI', density: 'standard' },
      interactionStrategy: { hoverStyle: 'glow-border', modalSupport: true, cartSupport: false },
      responsiveStrategy: { desktopColumns: 3, tabletColumns: 2, mobileLayout: 'stacked' },
    },
  };

  const defaultBlueprint = {
    product: { domain, name: `${pageName} Experience`, description: `Tailored digital experience designed for ${domain}.` },
    audience: { primary: 'General users & professionals', intent: 'Explore services and take action' },
    goal: { primaryConversion: 'Get Started', visualStory: 'Engaging hero leading to structured key highlights and actions' },
    brand: { personality: ['Modern', 'Clean', 'Professional'], mood: ['Focused', 'Accessible'], visualLanguage: 'Balanced layout with vibrant accent branding', styleSeed: `${domain}-v2` },
    visualDirection: { heroComposition: 'CENTERED_HERO', sectionLayouts: ['NAVBAR', 'CENTERED_HERO', 'EDITORIAL_GRID', 'BENTO_GRID', 'TESTIMONIALS', 'FOOTER'], spacingDensity: 'balanced', typographyMood: 'modern-sans' },
    navigation: { items: [{ label: 'Features', target: '#features' }, { label: 'About', target: '#about' }, { label: 'Reviews', target: '#reviews' }, { label: 'Contact', target: '#contact' }, { label: 'Get Started', target: '#start', isPrimary: true }] },
    sections: [
      { purpose: 'Hero Statement', userGoal: 'Understand platform intent', visualRole: 'Hero media', contentRole: 'Headline & primary action', layoutPattern: 'CENTERED_HERO', importance: 10, sectionType: 'hero' },
      { purpose: 'Key Offerings', userGoal: 'Browse items or services', visualRole: 'Card grid', contentRole: 'Item cards', layoutPattern: 'EDITORIAL_GRID', importance: 9, sectionType: 'cards' },
      { purpose: 'Value Pillars', userGoal: 'Discover benefits', visualRole: 'Feature icons', contentRole: 'Descriptions', layoutPattern: 'BENTO_GRID', importance: 8, sectionType: 'features' },
      { purpose: 'Footer CTA', userGoal: 'Final interaction', visualRole: 'Footer', contentRole: 'Links & CTA', layoutPattern: 'FOOTER', importance: 9, sectionType: 'footer' },
    ],
    contentStrategy: { tone: 'professional & engaging', keyCopy: 'Empowering seamless digital interactions', callToAction: 'Get Started Now' },
    assetStrategy: { heroQuery: `${domain} professional showcase photo`, cardQueryPattern: `${domain} item photo`, density: 'standard' },
    interactionStrategy: { hoverStyle: 'lift', modalSupport: true, cartSupport: false },
    responsiveStrategy: { desktopColumns: 3, tabletColumns: 2, mobileLayout: 'stacked' },
  };

  return blueprintMap[domain] || defaultBlueprint;
};

module.exports = {
  generateWebsiteBlueprint,
};

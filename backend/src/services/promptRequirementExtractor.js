/**
 * NeuraMinds — Prompt Requirement Extraction & Financial Calculation Engine
 *
 * Converts arbitrary user prompts into an internal, structured Requirement Specification:
 *   1. Domain Detection (food, travel, fashion, saas, realestate, portfolio, education, healthcare, finance, docs, auth, generic)
 *   2. Page Type Identification (landing, detail, checkout, dashboard, booking, pricing, etc.)
 *   3. Required Sections Extraction (hero, categories, menu, popular items, checkout, features, pricing, footer)
 *   4. Required Elements (image, text, button, input, cards, list, badge, divider, link)
 *   5. Required Data Fields (price, GST, GST %, GST amount, discount, total, rating, location, date, email, etc.)
 *   6. Required Actions (Add to Cart, Buy Now, Book Now, Search, Checkout, Login, Sign Up)
 *   7. Required Financial Calculations (Price + GST % = GST Amount -> Total)
 */

// ── Domain Keywords & Rules ──────────────────────────────────────────────────
const DOMAIN_PATTERNS = [
  {
    domain: 'grocery',
    keywords: ['grocery', 'supermarket', 'produce', 'vegetables', 'dairy', 'milk', 'farm fresh', 'organic store'],
    defaultPageType: 'grocery delivery portal',
    defaultActions: ['Add to Cart', 'Order Fresh', 'View Aisles'],
    defaultSections: ['hero', 'categories', 'fresh-produce', 'checkout', 'footer'],
  },
  {
    domain: 'movie',
    keywords: ['movie', 'cinema', 'film', 'popcorn', 'multiplex', 'theater', 'showtimes', 'seats', 'ticket booking', 'box office'],
    defaultPageType: 'movie ticket booking portal',
    defaultActions: ['Book Tickets', 'View Showtimes', 'Watch Trailer'],
    defaultSections: ['hero', 'now-showing', 'coming-soon', 'showtimes', 'footer'],
  },
  {
    domain: 'carrental',
    keywords: ['car rental', 'rent a car', 'vehicle rental', 'sedan rental', 'suv rental', 'auto hire'],
    defaultPageType: 'car rental booking page',
    defaultActions: ['Reserve Car', 'Select Dates', 'View Fleet'],
    defaultSections: ['hero', 'fleet-cards', 'search-controls', 'pricing', 'footer'],
  },
  {
    domain: 'law',
    keywords: ['law', 'legal', 'attorney', 'lawyer', 'litigation', 'law firm', 'counsel', 'legal defense'],
    defaultPageType: 'law firm corporate portal',
    defaultActions: ['Schedule Consultation', 'Our Practice Areas', 'Contact Attorney'],
    defaultSections: ['hero', 'practice-areas', 'attorneys', 'consultation', 'footer'],
  },
  {
    domain: 'photography',
    keywords: ['photography', 'photo studio', 'camera', 'portrait', 'photographer', 'shutter', 'photo gallery'],
    defaultPageType: 'photography showcase portfolio',
    defaultActions: ['Book Session', 'View Gallery', 'Contact Photographer'],
    defaultSections: ['hero', 'gallery', 'services', 'about', 'footer'],
  },
  {
    domain: 'gaming',
    keywords: ['gaming', 'esports', 'twitch', 'streamer', 'playstation', 'xbox', 'nintendo', 'gamer'],
    defaultPageType: 'gaming esports portal',
    defaultActions: ['Play Now', 'Join Tournament', 'Watch Stream'],
    defaultSections: ['hero', 'games-grid', 'leaderboard', 'streams', 'footer'],
  },
  {
    domain: 'music',
    keywords: ['music', 'song', 'album', 'track', 'artist', 'audio', 'band', 'soundstream', 'playlist', 'spotify'],
    defaultPageType: 'music streaming platform',
    defaultActions: ['Listen Now', 'Play Track', 'Subscribe VIP'],
    defaultSections: ['hero', 'trending-tracks', 'featured-artists', 'playlists', 'footer'],
  },
  {
    domain: 'hospital',
    keywords: ['hospital', 'medical', 'clinic', 'doctor', 'healthcare', 'patient', 'appointment', 'emergency', 'surgery', 'wellness', 'pharmacy', 'dental', 'clinical'],
    defaultPageType: 'hospital healthcare portal',
    defaultActions: ['Book Appointment', 'Find Doctor', 'Emergency Contact', 'View Departments'],
    defaultSections: ['hero', 'services', 'doctors', 'departments', 'appointment', 'contact', 'footer'],
  },
  {
    domain: 'college',
    keywords: ['college', 'university', 'campus', 'academic', 'admissions', 'faculty', 'student portal', 'institute', 'degree program', 'curriculum'],
    defaultPageType: 'college university website',
    defaultActions: ['Apply Now', 'View Courses', 'Admission Enquiry', 'Student Portal'],
    defaultSections: ['hero', 'departments', 'courses', 'faculty', 'campus', 'admissions', 'footer'],
  },
  {
    domain: 'banking',
    keywords: ['bank', 'banking', 'fintech', 'wallet', 'transfer', 'balance', 'account summary', 'credit card', 'mortgage', 'deposit', 'financial dashboard'],
    defaultPageType: 'banking financial portal',
    defaultActions: ['Transfer Funds', 'Pay Bill', 'View Account', 'Apply for Card'],
    defaultSections: ['hero', 'accounts', 'transfer', 'recent-transactions', 'footer'],
  },
  {
    domain: 'realestate',
    keywords: ['real estate', 'property', 'house', 'apartment', 'listing', 'mortgage', 'architectural villa', 'home for sale', 'realty', 'estate'],
    defaultPageType: 'property listing page',
    defaultActions: ['Inquire Now', 'Schedule Tour', 'Contact Agent'],
    defaultSections: ['hero', 'listings', 'features', 'agent-contact', 'footer'],
  },
  {
    domain: 'food',
    keywords: ['food', 'pizza', 'restaurant', 'burger', 'cafe', 'dining', 'sushi', 'menu', 'meal', 'lunch', 'dinner', 'chef', 'cuisine', 'takeaway', 'delivery', 'dish', 'recipe', 'bakery'],
    defaultPageType: 'food delivery item page',
    defaultActions: ['Order Online', 'Add to Cart', 'View Menu'],
    defaultSections: ['hero', 'categories', 'cards', 'checkout', 'footer'],
  },
  {
    domain: 'travel',
    keywords: ['travel', 'hotel', 'resort', 'tour', 'vacation', 'holiday', 'flight', 'destination', 'trip', 'hospitality', 'cabin'],
    defaultPageType: 'travel booking page',
    defaultActions: ['Book Now', 'Explore Destination', 'Check Availability'],
    defaultSections: ['hero', 'destinations', 'hotel-cards', 'search', 'footer'],
  },
  {
    domain: 'fashion',
    keywords: ['fashion', 'ecommerce', 'e-commerce', 'store', 'shop', 'clothing', 'apparel', 'wear', 'sneakers', 'accessories', 'boutique', 'collection', 'dress', 'outfit'],
    defaultPageType: 'fashion store page',
    defaultActions: ['Add to Bag', 'Buy Now', 'Explore Collection'],
    defaultSections: ['hero', 'collections', 'product-cards', 'footer'],
  },
  {
    domain: 'saas',
    keywords: ['saas', 'dashboard', 'analytics', 'software', 'crm', 'erp', 'monitoring', 'metrics', 'data', 'api', 'integration', 'admin'],
    defaultPageType: 'saas product dashboard',
    defaultActions: ['Start Free Trial', 'View Demo', 'Export Report'],
    defaultSections: ['hero', 'kpis', 'charts', 'activity', 'footer'],
  },
  {
    domain: 'jobportal',
    keywords: ['job', 'career', 'hiring', 'recruitment', 'vacancy', 'resume', 'applicant', 'job portal', 'employment'],
    defaultPageType: 'job recruitment portal',
    defaultActions: ['Apply Now', 'Upload Resume', 'Search Jobs'],
    defaultSections: ['hero', 'job-search', 'featured-jobs', 'companies', 'footer'],
  },
  {
    domain: 'fitness',
    keywords: ['fitness', 'gym', 'workout', 'trainer', 'exercise', 'bodybuilding', 'nutrition', 'crossfit', 'membership'],
    defaultPageType: 'fitness gym website',
    defaultActions: ['Join Now', 'Book Class', 'Free Trial Pass'],
    defaultSections: ['hero', 'classes', 'trainers', 'pricing', 'footer'],
  },
  {
    domain: 'news',
    keywords: ['news', 'magazine', 'journal', 'article', 'breaking news', 'editorial', 'newspaper', 'media'],
    defaultPageType: 'news media portal',
    defaultActions: ['Read Full Story', 'Subscribe', 'View Headlines'],
    defaultSections: ['hero', 'breaking-news', 'categories', 'latest-articles', 'footer'],
  },
  {
    domain: 'portfolio',
    keywords: ['portfolio', 'creative', 'designer', 'artist', 'photographer', 'showcase', 'projects', 'work', 'freelance', 'resume'],
    defaultPageType: 'creative portfolio page',
    defaultActions: ['View Project', 'Hire Me', 'Get in Touch'],
    defaultSections: ['hero', 'about', 'skills', 'projects', 'contact', 'footer'],
  },
  {
    domain: 'education',
    keywords: ['education', 'course', 'learn', 'school', 'academy', 'class', 'tutor', 'degree', 'training', 'lms'],
    defaultPageType: 'course learning portal',
    defaultActions: ['Enroll Now', 'Start Learning', 'Download Syllabus'],
    defaultSections: ['hero', 'courses', 'curriculum', 'instructors', 'footer'],
  },
  {
    domain: 'salon',
    keywords: ['salon', 'spa', 'massage', 'haircut', 'beauty', 'skincare', 'hair salon', 'manicure', 'pedicure', 'barber'],
    defaultPageType: 'salon spa booking page',
    defaultActions: ['Book Appointment', 'View Services', 'Special Packages'],
    defaultSections: ['hero', 'services-cards', 'packages', 'reviews', 'footer'],
  },
  {
    domain: 'dentist',
    keywords: ['dentist', 'dental', 'teeth', 'orthodontics', 'oral care', 'dental clinic'],
    defaultPageType: 'dental clinic website',
    defaultActions: ['Book Checkup', 'Our Treatments', 'Emergency Dental'],
    defaultSections: ['hero', 'treatments', 'dentists', 'testimonials', 'footer'],
  },
  {
    domain: 'logistics',
    keywords: ['logistics', 'courier', 'shipping', 'freight', 'cargo', 'tracking', 'transportation'],
    defaultPageType: 'logistics courier portal',
    defaultActions: ['Track Package', 'Get Quote', 'Our Fleet'],
    defaultSections: ['hero', 'tracker', 'services', 'network', 'footer'],
  },
  {
    domain: 'podcast',
    keywords: ['podcast', 'episode', 'listen', 'audio show', 'host', 'interview', 'spotify podcast'],
    defaultPageType: 'podcast audio stream page',
    defaultActions: ['Listen to Latest', 'All Episodes', 'Subscribe on Spotify'],
    defaultSections: ['hero', 'latest-episodes', 'hosts', 'subscribe', 'footer'],
  },
  {
    domain: 'consultancy',
    keywords: ['consulting', 'consultancy', 'advisory', 'strategy', 'business audit', 'corporate strategy'],
    defaultPageType: 'business consulting corporate page',
    defaultActions: ['Schedule Discovery Call', 'Our Practice', 'Client Results'],
    defaultSections: ['hero', 'services', 'case-studies', 'consultants', 'footer'],
  },
  {
    domain: 'crypto',
    keywords: ['crypto', 'web3', 'token', 'blockchain', 'wallet', 'swap', 'defi', 'nft'],
    defaultPageType: 'crypto web3 exchange portal',
    defaultActions: ['Connect Wallet', 'Swap Tokens', 'Explore Ecosystem'],
    defaultSections: ['hero', 'token-stats', 'features', 'roadmap', 'footer'],
  },
  {
    domain: 'auth',
    keywords: ['login', 'signup', 'sign up', 'sign in', 'register', 'authentication', 'onboarding', 'create account'],
    defaultPageType: 'authentication sign up page',
    defaultActions: ['Sign Up', 'Log In', 'Continue with Email'],
    defaultSections: ['auth-form', 'footer'],
  },
];

// ── Financial Calculation Helper ──────────────────────────────────────────────
/**
 * Calculate accurate financial breakdown (Price, GST, Subtotal, Discount, Total).
 * Handles Indian GST / VAT / standard sales tax rules deterministically.
 */
const calculateFinancials = ({
  basePrice = 500,
  gstPercentage = null,
  discountPercentage = null,
  currency = '₹',
}) => {
  const price = Number(basePrice) > 0 ? Number(basePrice) : 500;

  let discountAmount = 0;
  if (discountPercentage !== null && Number(discountPercentage) > 0) {
    discountAmount = Math.round((price * Number(discountPercentage)) / 100 * 100) / 100;
  }

  const subtotal = Math.round((price - discountAmount) * 100) / 100;
  const effectiveGstPct = gstPercentage !== null ? Number(gstPercentage) : 5;
  const gstAmount = Math.round((subtotal * effectiveGstPct) / 100 * 100) / 100;
  const totalPrice = Math.round((subtotal + gstAmount) * 100) / 100;

  return {
    currency,
    basePrice: price,
    basePriceFormatted: `${currency}${price}`,
    gstPercentage: effectiveGstPct,
    gstAmount,
    gstAmountFormatted: `${currency}${gstAmount}`,
    discountPercentage: discountPercentage || 0,
    discountAmount,
    discountAmountFormatted: `${currency}${discountAmount}`,
    subtotal,
    subtotalFormatted: `${currency}${subtotal}`,
    totalPrice,
    totalPriceFormatted: `${currency}${totalPrice}`,
  };
};

// ── Requirement Specification Extraction ──────────────────────────────────────
/**
 * Parse an arbitrary user prompt into a structured Requirement Specification.
 *
 * @param {string} prompt - Raw prompt string from user
 * @returns {object} Structured Requirement Specification
 */
const extractPromptRequirements = (prompt = '') => {
  const p = String(prompt).toLowerCase().trim();

  // 1. Domain Detection
  let matchedDomainPattern = DOMAIN_PATTERNS.find((item) =>
    item.keywords.some((kw) => p.includes(kw))
  );

  if (!matchedDomainPattern) {
    matchedDomainPattern = {
      domain: 'generic',
      defaultPageType: 'landing page',
      defaultActions: ['Explore Now', 'Get Started'],
    };
  }

  const domain = matchedDomainPattern.domain;

  // 2. Page Type Identification
  let pageType = matchedDomainPattern.defaultPageType;
  if (p.includes('detail') || p.includes('item page') || p.includes('product page')) {
    pageType = `${domain} item detail page`;
  } else if (p.includes('checkout') || p.includes('cart')) {
    pageType = `${domain} checkout page`;
  } else if (p.includes('dashboard') || p.includes('admin')) {
    pageType = `${domain} dashboard`;
  } else if (p.includes('booking') || p.includes('reservation')) {
    pageType = `${domain} booking page`;
  } else if (p.includes('pricing') || p.includes('plans')) {
    pageType = `${domain} pricing page`;
  } else if (p.includes('landing')) {
    pageType = `${domain} landing page`;
  }

  // 3. Required Sections Extraction
  const requiredSections = new Set();
  requiredSections.add('hero'); // Always start with hero/header

  if (p.includes('categories') || p.includes('category')) requiredSections.add('categories');
  if (p.includes('popular') || p.includes('menu') || p.includes('items') || p.includes('products') || p.includes('cards') || domain === 'food' || domain === 'fashion' || domain === 'travel') {
    requiredSections.add('cards');
  }
  if (p.includes('checkout') || p.includes('gst') || p.includes('price breakdown') || p.includes('cart') || p.includes('summary')) {
    requiredSections.add('checkout');
  }
  if (p.includes('pricing') || p.includes('plans')) requiredSections.add('pricing');
  if (p.includes('features') || p.includes('services')) requiredSections.add('features');
  if (p.includes('footer') || p.includes('contact')) requiredSections.add('footer');

  // 4. Required Elements & Data Requirements
  const isNoImageRequested = p.includes('no images') || p.includes('no image') || p.includes('without image') || p.includes('without images') || p.includes('text only');
  const requiresImage = !isNoImageRequested && (
    p.includes('image') ||
    p.includes('photo') ||
    p.includes('picture') ||
    p.includes('visual') ||
    p.includes('banner') ||
    ['food', 'travel', 'fashion', 'realestate', 'portfolio', 'college', 'hospital', 'salon', 'dentist'].includes(domain)
  );

  const imageDensity = (p.includes('more images') || p.includes('lots of images') || p.includes('photo gallery')) ? 'high' : 'standard';

  const isNoPriceRequested = p.includes('no price') || p.includes('no pricing') || p.includes('without price') || p.includes('free site');
  const requiresPrice = !isNoPriceRequested && (
    p.includes('price') ||
    p.includes('cost') ||
    p.includes('amount') ||
    p.includes('rate') ||
    p.includes('gst') ||
    p.includes('total') ||
    ['food', 'fashion', 'travel', 'realestate', 'salon'].includes(domain)
  );

  const requiresGST = p.includes('gst') || p.includes('tax');

  // Extract explicit item card count requirement (e.g. "5 food cards", "4 departments", "3 plans")
  let requestedCardCount = null;
  const countMatch = p.match(/(\d+)\s*(?:cards?|items?|products?|departments?|plans?|options?|categories?|services?|doctors?|rooms?)/i);
  if (countMatch) {
    requestedCardCount = Math.min(Math.max(Number(countMatch[1]), 1), 12);
  }

  // 5. Visual Theme Detection (White / Light theme vs Dark theme vs Domain theme)
  const isLightThemeRequested =
    p.includes('white color') ||
    p.includes('white page') ||
    p.includes('white theme') ||
    p.includes('light theme') ||
    p.includes('white background') ||
    p.includes('light background') ||
    p.includes('clean light');

  let theme = isLightThemeRequested ? 'light' : 'dark';
  if (!isLightThemeRequested) {
    if (['food', 'grocery'].includes(domain)) theme = 'food';
    else if (['hospital', 'healthcare', 'dentist'].includes(domain)) theme = 'healthcare';
    else if (['banking', 'finance', 'crypto'].includes(domain)) theme = 'finance';
    else if (['fashion', 'salon'].includes(domain)) theme = 'fashion';
    else if (['realestate'].includes(domain)) theme = 'luxury';
    else if (['college', 'education'].includes(domain)) theme = 'light';
  }

  // 6. User Roles & Authentication Login Detection
  const users = [];
  if (p.includes('student')) users.push('student');
  if (p.includes('teacher') || p.includes('faculty')) users.push('teacher');
  if (p.includes('doctor')) users.push('doctor');
  if (p.includes('patient')) users.push('patient');
  if (p.includes('admin')) users.push('admin');
  if (p.includes('vendor') || p.includes('partner') || p.includes('seller')) users.push('partner');

  const requiresAuth = p.includes('login') || p.includes('signup') || p.includes('auth') || p.includes('sign in') || users.length > 0;
  const loginTypes = [];
  if (users.includes('student')) loginTypes.push('Student Login');
  if (users.includes('teacher')) loginTypes.push('Teacher Login');
  if (users.includes('doctor')) loginTypes.push('Doctor Login');
  if (users.includes('patient')) loginTypes.push('Patient Login');
  if (users.includes('admin')) loginTypes.push('Admin Portal');
  if (users.includes('partner')) loginTypes.push('Partner Login');
  if (loginTypes.length === 0 && requiresAuth) loginTypes.push('User Login');

  // Extract explicit Base Price from prompt (e.g. "$500", "₹500", "500 rs", "pizza ₹299", "€49")
  let basePrice = domain === 'food' ? 350 : domain === 'fashion' ? 1200 : domain === 'travel' ? 4500 : 500;
  const priceMatch = p.match(/(?:₹|\$|€|£|¥|rs\.?|price\s*of?)\s*(\d+(?:\.\d+)?)/i) || p.match(/(?:pizza|burger|item|product)\s*(?:₹|\$|€|£|¥|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    basePrice = Number(priceMatch[1]);
  }

  // Extract explicit GST % or explicit GST Amount from prompt (e.g. "GST 5%", "18% GST", "GST ₹53.82")
  let gstPercentage = null;
  const gstPctMatch = p.match(/(?:gst|tax)\s*(?:of|is|@)?\s*(\d+)%/i) || p.match(/(\d+)%\s*(?:gst|tax)/i);
  const gstAmountMatch = p.match(/gst\s*(?:amount|is|:|=|₹|\$|€|£|¥)?\s*(?:₹|\$|€|£|¥)?\s*(\d+(?:\.\d+)?)/i);

  if (gstPctMatch) {
    gstPercentage = Number(gstPctMatch[1]);
  } else if (gstAmountMatch && basePrice > 0) {
    const explicitGstAmount = Number(gstAmountMatch[1]);
    gstPercentage = Math.round((explicitGstAmount / basePrice) * 100 * 100) / 100;
  } else if (requiresGST) {
    gstPercentage = domain === 'food' ? 5 : 18; // standard defaults
  }

  // Calculate financials with multi-currency support
  const currency = p.includes('$') ? '$' : p.includes('€') ? '€' : p.includes('£') ? '£' : p.includes('¥') ? '¥' : '₹';
  const financials = (requiresPrice || requiresGST)
    ? calculateFinancials({ basePrice, gstPercentage, currency })
    : null;

  // 7. Actions Extraction
  const requiredActions = [...matchedDomainPattern.defaultActions];
  if (p.includes('add to cart') || p.includes('add to bag')) requiredActions.push('Add to Cart');
  if (p.includes('buy now')) requiredActions.push('Buy Now');
  if (p.includes('book now')) requiredActions.push('Book Now');
  if (p.includes('search')) requiredActions.push('Search');
  if (p.includes('checkout')) requiredActions.push('Proceed to Checkout');
  loginTypes.forEach((lt) => requiredActions.push(lt));

  // 8. Explicit User Requirements Checklist
  const checklist = [];
  if (requiresImage) checklist.push({ id: 'req-image', label: `${domain} photo visuals (${imageDensity})`, type: 'image' });
  if (isLightThemeRequested) checklist.push({ id: 'req-theme', label: 'Clean White/Light Visual Theme', type: 'theme' });
  if (loginTypes.length > 0) checklist.push({ id: 'req-login', label: `Login Portals: ${loginTypes.join(', ')}`, type: 'auth' });
  if (requiresPrice) checklist.push({ id: 'req-price', label: 'Item price display', type: 'price' });
  if (requiresGST) {
    checklist.push({ id: 'req-gst-pct', label: `GST Percentage (${financials?.gstPercentage}%)`, type: 'gst' });
    checklist.push({ id: 'req-gst-amt', label: `GST Amount (${financials?.gstAmountFormatted})`, type: 'gst' });
    checklist.push({ id: 'req-total', label: `Final Total Amount (${financials?.totalPriceFormatted})`, type: 'total' });
  }

  // Determine design personality & hero pattern based on domain & style keywords
  let designPersonality = 'modern';
  let heroPattern = 'split';

  if (p.includes('minimal')) designPersonality = 'minimal';
  else if (p.includes('luxury') || p.includes('estate') || domain === 'realestate') designPersonality = 'luxury';
  else if (p.includes('fun') || p.includes('playful') || domain === 'food') designPersonality = 'energetic';
  else if (domain === 'college' || domain === 'education') designPersonality = 'prestigious';
  else if (domain === 'travel') designPersonality = 'cinematic';
  else if (domain === 'hospital' || domain === 'law') designPersonality = 'trustworthy';
  else if (domain === 'fashion' || domain === 'photography') designPersonality = 'editorial';
  else if (domain === 'saas' || domain === 'banking') designPersonality = 'technical';
  else if (domain === 'gaming' || domain === 'fitness') designPersonality = 'bold';

  if (domain === 'food' || domain === 'travel' || domain === 'realestate') heroPattern = 'search';
  else if (domain === 'college' || domain === 'fashion' || domain === 'photography') heroPattern = 'editorial';
  else if (domain === 'saas' || domain === 'banking') heroPattern = 'dashboard';
  else if (domain === 'travel') heroPattern = 'full-bleed';

  // Extract explicit Button & Background Color Requirements
  const colorSpec = extractColorSpec(prompt);
  const themeTokens = buildThemeTokens(colorSpec, domain, theme);

  let primaryButtonColor = colorSpec.buttonBackground || null;
  if (!primaryButtonColor) {
    if (p.includes('red button') || p.includes('red buttons') || p.includes('button in red') || p.includes('buttons in red') || p.includes('red theme')) primaryButtonColor = 'red';
    else if (p.includes('gold button') || p.includes('gold buttons') || p.includes('buttons in gold') || p.includes('gold theme')) primaryButtonColor = 'gold';
    else if (p.includes('blue button') || p.includes('blue buttons') || p.includes('blue design')) primaryButtonColor = 'blue';
    else if (p.includes('green button') || p.includes('green buttons') || p.includes('green design')) primaryButtonColor = 'green';
  }

  let customBgColor = colorSpec.background || null;
  if (primaryButtonColor) checklist.push({ id: 'req-btn-color', label: `Primary Button Color: ${primaryButtonColor}`, type: 'color' });
  if (customBgColor) checklist.push({ id: 'req-bg-color', label: `Background Canvas: ${customBgColor}`, type: 'color' });

  // 9. Exact User Instruction Extraction (Brand Name, Headline, Items, Interactive Components)
  let explicitBrand = null;
  const brandMatch = prompt.match(/(?:for|named|called|brand)\s+["'“]([^"'“”]+)["'”]/i) ||
                     prompt.match(/(?:website|page|portal|app)\s+for\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:with|that|having|featuring|,|\.|$))/);
  if (brandMatch) {
    explicitBrand = brandMatch[1].trim();
  }

  let explicitHeadline = null;
  const headlineMatch = prompt.match(/(?:title|headline|heading)\s+["'“]([^"'“”]+)["'”]/i) ||
                        prompt.match(/(?:titled|headed)\s+["'“]([^"'“”]+)["'”]/i);
  if (headlineMatch) {
    explicitHeadline = headlineMatch[1].trim();
  }

  // Explicit Section Demands
  if (p.includes('faq') || p.includes('frequently asked') || p.includes('questions') || p.includes('accordion')) requiredSections.add('faq');
  if (p.includes('contact form') || p.includes('contact us') || p.includes('inquiry form') || p.includes('get in touch')) requiredSections.add('contact');
  if (p.includes('testimonial') || p.includes('review') || p.includes('feedback') || p.includes('client stories')) requiredSections.add('testimonials');
  if (p.includes('pricing') || p.includes('plans') || p.includes('tiers') || p.includes('subscription')) requiredSections.add('pricing');
  if (p.includes('team') || p.includes('faculty') || p.includes('staff') || p.includes('instructors') || p.includes('doctors')) requiredSections.add('team');
  if (p.includes('gallery') || p.includes('photos') || p.includes('portfolio') || p.includes('showcase')) requiredSections.add('gallery');

  // Interactive Features Detection
  const interactiveFeatures = [];
  if (p.includes('search') || p.includes('filter')) interactiveFeatures.push('search');
  if (p.includes('faq') || p.includes('accordion')) interactiveFeatures.push('accordion');
  if (p.includes('contact form') || p.includes('inquiry')) interactiveFeatures.push('contactForm');
  if (p.includes('pricing') || p.includes('toggle') || p.includes('tabs')) interactiveFeatures.push('pricingToggle');
  if (p.includes('book') || p.includes('appointment') || p.includes('reserve')) interactiveFeatures.push('bookingModal');
  if (requiresAuth || loginTypes.length > 0) interactiveFeatures.push('loginModal');
  if (domain === 'food' || domain === 'fashion' || domain === 'grocery' || p.includes('cart')) interactiveFeatures.push('cart');

  if (explicitBrand) checklist.push({ id: 'req-brand', label: `Brand Name: "${explicitBrand}"`, type: 'brand' });
  if (explicitHeadline) checklist.push({ id: 'req-headline', label: `Hero Headline: "${explicitHeadline}"`, type: 'headline' });
  if (interactiveFeatures.length > 0) checklist.push({ id: 'req-interactive', label: `Interactive Features: ${interactiveFeatures.join(', ')}`, type: 'interactive' });

  return {
    domain,
    pageType: matchedDomainPattern.defaultPageType,
    rawPrompt: prompt,
    explicitBrand,
    explicitHeadline,
    interactiveFeatures,
    designPersonality,
    heroPattern,
    primaryButtonColor,
    customBgColor,
    colorSpec,
    themeTokens,
    requiredSections: Array.from(requiredSections),
    requiresImage,
    imageDensity,
    requiresPrice,
    requiresGST,
    theme,
    isLightThemeRequested: isLightThemeRequested || customBgColor === 'white' || colorSpec.background === 'grey' || colorSpec.background === 'light grey',
    users,
    requiresAuth,
    loginTypes,
    requestedCardCount,
    financials,
    requiredActions: Array.from(new Set(requiredActions)),
    checklist,
  };
};

// ── Color Name Map & Resolver Engine ──────────────────────────────────────────
const NAMED_COLOR_MAP = {
  'white': '#FFFFFF',
  'off-white': '#F8FAFC',
  'cream': '#FDFBF7',
  'beige': '#F5F5DC',
  'light grey': '#F3F4F6',
  'light gray': '#F3F4F6',
  'grey': '#6B7280',
  'gray': '#6B7280',
  'dark grey': '#374151',
  'dark gray': '#374151',
  'slate': '#0F172A',
  'zinc': '#18181B',
  'black': '#020617',
  'dark': '#0F172A',
  'red': '#DC2626',
  'crimson': '#BE123C',
  'rose': '#E11D48',
  'light red': '#F87171',
  'dark red': '#991B1B',
  'blue': '#2563EB',
  'sky': '#0284C7',
  'dark blue': '#1E3A8A',
  'light blue': '#60A5FA',
  'navy': '#0F172A',
  'indigo': '#4F46E5',
  'green': '#059669',
  'emerald': '#10B981',
  'teal': '#0D9488',
  'cyan': '#0891B2',
  'pastel green': '#A7F3D0',
  'light green': '#34D399',
  'dark green': '#065F46',
  'yellow': '#FACC15',
  'amber': '#D97706',
  'gold': '#F59E0B',
  'orange': '#EA580C',
  'purple': '#9333EA',
  'violet': '#7C3AED',
  'lavender': '#E9D5FF',
  'pink': '#EC4899',
  'maroon': '#9F1239',
};

const resolveColorToHex = (rawColor, fallbackHex = '#6366F1') => {
  if (!rawColor) return fallbackHex;
  const str = String(rawColor).trim().toLowerCase();

  if (/^#([0-9a-f]{3}){1,2}$/i.test(str)) return str;
  if (/^(rgb|hsl)a?\(/i.test(str)) return str;
  if (NAMED_COLOR_MAP[str]) return NAMED_COLOR_MAP[str];

  for (const [name, hex] of Object.entries(NAMED_COLOR_MAP)) {
    if (str.includes(name)) return hex;
  }

  return fallbackHex;
};

const extractColorSpec = (prompt = '') => {
  const p = String(prompt).toLowerCase();

  let background = null;
  let buttonBackground = null;
  let buttonText = null;
  let surface = null;
  let headings = null;
  let text = null;
  let border = null;
  let accent = null;

  // Specific multi-color combination shortcuts
  if (p.includes('green and black') || p.includes('black and green')) {
    background = 'black';
    buttonBackground = 'green';
  } else if (p.includes('white and blue') || p.includes('blue and white')) {
    background = 'white';
    buttonBackground = 'blue';
  }

  if (p.includes('except the cards') || p.includes('cards white')) {
    surface = 'white';
  }

  // List of recognized color terms
  const colorTerms = 'yellow|gold|green|emerald|teal|cyan|red|crimson|rose|blue|sky|indigo|purple|violet|white|black|slate|zinc|grey|gray|light grey|light gray|dark grey|dark gray|navy|orange|amber|pink|lavender|cream|beige|maroon|off-white';

  // Direct Hex Color Code Extraction (e.g. "#1e293b", "#ff007f")
  const hexBgMatch = p.match(/(?:background|bg|canvas|page)\s*(?:color|colors|theme)?\s*(?:should\s*)?(?:be\s*)?(?:in\s*|to\s*|is\s*|=|:)?\s*(#[0-9a-f]{3,6})/i);
  if (hexBgMatch) {
    background = hexBgMatch[1];
  }
  const hexBtnMatch = p.match(/(?:buttons?|ctas?)\s*(?:color|colors|theme)?\s*(?:should\s*)?(?:be\s*)?(?:in\s*|to\s*|is\s*|=|:)?\s*(#[0-9a-f]{3,6})/i);
  if (hexBtnMatch) {
    buttonBackground = hexBtnMatch[1];
  }

  // 1. Compound phrase parsing (e.g. "background should in yellow and button should in green", "yellow background and green buttons")
  const compoundMatch = p.match(new RegExp(`(?:background|bg|page)\\s*(?:color|colors|theme)?\\s*(?:should\\s*)?(?:be\\s*)?(?:in\\s*|to\\s*|is\\s*|=|:)?\\s*(${colorTerms})\\s*(?:and|,)?\\s*(?:buttons?|ctas?)\\s*(?:color|colors|theme)?\\s*(?:should\\s*)?(?:be\\s*)?(?:in\\s*|to\\s*|is\\s*|=|:)?\\s*(${colorTerms})`, 'i'));
  if (compoundMatch) {
    background = compoundMatch[1].trim();
    buttonBackground = compoundMatch[2].trim();
  }

  const compoundMatchRev = p.match(new RegExp(`(${colorTerms})\\s*(?:background|bg|page)\\s*(?:and|,)?\\s*(${colorTerms})\\s*(?:buttons?|ctas?)`, 'i'));
  if (compoundMatchRev) {
    background = compoundMatchRev[1].trim();
    buttonBackground = compoundMatchRev[2].trim();
  }

  // 1b. Background regex pattern (handles: "background color is yellow", "background should be in yellow", "page to grey", "yellow background", etc.)
  if (!background) {
    const bgRegex = new RegExp(`(?:background|bg|canvas|page)\\s*(?:color|colors|style|theme)?\\s*(?:should\\s*)?(?:be\\s*)?(?:in\\s*|to\\s*|is\\s*|=|:)?\\s*(${colorTerms})`, 'i');
    const bgRegexRev = new RegExp(`(${colorTerms})\\s*(?:color|colors|style|theme)?\\s*(?:background|bg|canvas|page)`, 'i');
    const bgMatch = p.match(bgRegex) || p.match(bgRegexRev);
    if (bgMatch) {
      background = bgMatch[1].trim();
    }
  }

  // 2. Button Background regex pattern (handles: "button should green", "button color is green", "white buttons", "buttons to yellow", etc.)
  if (!buttonBackground) {
    const btnRegex = new RegExp(`(?:buttons?|ctas?)\\s*(?:color|colors|style|theme)?\\s*(?:should\\s*)?(?:be\\s*)?(?:in\\s*|to\\s*|is\\s*|=|:)?\\s*(${colorTerms})`, 'i');
    const btnRegexRev = new RegExp(`(${colorTerms})\\s*(?:color|colors|style|theme)?\\s*(?:buttons?|ctas?)`, 'i');
    const btnMatch = p.match(btnRegex) || p.match(btnRegexRev);
    if (btnMatch) {
      buttonBackground = btnMatch[1].trim();
    }
  }

  // Fallback phrases if regex misses
  if (!background) {
    if (p.includes('light grey') && (p.includes('background') || p.includes('bg') || p.includes('page'))) background = 'light grey';
    else if ((p.includes('grey') || p.includes('gray')) && (p.includes('background') || p.includes('bg') || p.includes('page'))) background = 'grey';
    else if (p.includes('everything dark') || p.includes('make dark') || (p.includes('black') && (p.includes('background') || p.includes('bg') || p.includes('page') || p.includes('dark')))) background = 'black';
    else if (p.includes('white') && (p.includes('background') || p.includes('bg') || p.includes('page'))) background = 'white';
    else if (p.includes('yellow') && (p.includes('background') || p.includes('bg') || p.includes('page'))) background = 'yellow';
    else if (p.includes('blue') && (p.includes('background') || p.includes('bg') || p.includes('page'))) background = 'blue';
    else if (p.includes('green') && (p.includes('background') || p.includes('bg') || p.includes('page'))) background = 'green';
  }

  if (!buttonBackground) {
    if (p.includes('white') && (p.includes('button') || p.includes('cta'))) buttonBackground = 'white';
    else if (p.includes('yellow') && (p.includes('button') || p.includes('cta'))) buttonBackground = 'yellow';
    else if (p.includes('green') && (p.includes('button') || p.includes('cta'))) buttonBackground = 'green';
    else if (p.includes('red') && (p.includes('button') || p.includes('cta'))) buttonBackground = 'red';
    else if (p.includes('blue') && (p.includes('button') || p.includes('cta'))) buttonBackground = 'blue';
    else if (p.includes('gold') && (p.includes('button') || p.includes('cta'))) buttonBackground = 'gold';
  }

  // 3. Surface / Card regex pattern
  const surfaceRegex = new RegExp(`(?:cards?|surfaces?)\\s*(?:color|colors|style|theme)?\\s*(?:should\\s*)?(?:be\\s*)?(?:in\\s*|to\\s*|is\\s*|=|:)?\\s*(${colorTerms})`, 'i');
  const surfaceRegexRev = new RegExp(`(${colorTerms})\\s*(?:color|colors|style|theme)?\\s*(?:cards?|surfaces?)`, 'i');
  const surfaceMatch = p.match(surfaceRegex) || p.match(surfaceRegexRev);
  if (surfaceMatch) {
    surface = surfaceMatch[1].trim();
  }

  // 4. Headings & Text regex pattern
  const headingRegex = new RegExp(`(?:headings?|titles?)\\s*(?:color|colors|style|theme)?\\s*(?:should\\s*)?(?:be\\s*)?(?:in\\s*|to\\s*|is\\s*|=|:)?\\s*(${colorTerms})`, 'i');
  const headingRegexRev = new RegExp(`(${colorTerms})\\s*(?:color|colors|style|theme)?\\s*(?:headings?|titles?)`, 'i');
  const headingMatch = p.match(headingRegex) || p.match(headingRegexRev);
  if (headingMatch) {
    headings = headingMatch[1].trim();
  }

  return {
    background,
    buttonBackground,
    buttonText,
    surface,
    headings,
    text,
    border,
    accent,
  };
};

const buildThemeTokens = (colorSpec = {}, domain = 'generic', themeName = 'dark') => {
  const isExplicitDark = colorSpec.background === 'black' || colorSpec.background === 'dark';
  const isLightMode =
    !isExplicitDark && (
      colorSpec.background === 'white' ||
      colorSpec.background === 'grey' ||
      colorSpec.background === 'light grey' ||
      colorSpec.background === 'yellow' ||
      colorSpec.background === 'cream' ||
      colorSpec.background === 'beige' ||
      themeName === 'light' ||
      themeName === 'college' ||
      themeName === 'healthcare' ||
      domain === 'hospital' ||
      domain === 'college'
    );

  // Default Domain Color Palettes (Vibrant & Distinct per Domain!)
  const DOMAIN_DEFAULT_PALETTES = {
    food: { bg: '#181216', surface: '#261A20', primary: '#E11D48', accent: '#F97316' },
    college: { bg: '#F8FAFC', surface: '#FFFFFF', primary: '#2563EB', accent: '#059669' },
    hospital: { bg: '#F0FDFA', surface: '#FFFFFF', primary: '#0D9488', accent: '#E11D48' },
    travel: { bg: '#0C1B2A', surface: '#14283E', primary: '#0284C7', accent: '#F59E0B' },
    fashion: { bg: '#0F0E17', surface: '#1A1828', primary: '#F43F5E', accent: '#F59E0B' },
    movie: { bg: '#0D0914', surface: '#1A1326', primary: '#E11D48', accent: '#F59E0B' },
    gaming: { bg: '#090A0F', surface: '#121420', primary: '#84CC16', accent: '#06B6D4' },
    banking: { bg: '#0B132B', surface: '#1C2541', primary: '#10B981', accent: '#3B82F6' },
    realestate: { bg: '#0F172A', surface: '#1E293B', primary: '#10B981', accent: '#38BDF8' },
    saas: { bg: '#090814', surface: '#131126', primary: '#8B5CF6', accent: '#06B6D4' },
  };

  const domainPalette = DOMAIN_DEFAULT_PALETTES[domain] || DOMAIN_DEFAULT_PALETTES.saas;

  // Base background hex
  let bgHex = isLightMode ? '#F3F4F6' : domainPalette.bg;
  if (colorSpec.background) {
    if (colorSpec.background === 'yellow') bgHex = '#FEF08A';
    else if (colorSpec.background === 'grey' || colorSpec.background === 'gray') bgHex = '#F3F4F6';
    else if (colorSpec.background === 'light grey' || colorSpec.background === 'light gray') bgHex = '#F8FAFC';
    else if (colorSpec.background === 'white') bgHex = '#FFFFFF';
    else if (colorSpec.background === 'black' || colorSpec.background === 'dark') bgHex = '#020617';
    else bgHex = resolveColorToHex(colorSpec.background, isLightMode ? '#F3F4F6' : domainPalette.bg);
  }

  // Surface / Cards hex
  let surfaceHex = isLightMode ? '#FFFFFF' : domainPalette.surface;
  if (colorSpec.surface || String(colorSpec.rawPrompt || '').toLowerCase().includes('except the cards')) {
    if (colorSpec.surface === 'off-white') surfaceHex = '#F8FAFC';
    else if (colorSpec.surface === 'white' || String(colorSpec.rawPrompt || '').toLowerCase().includes('except the cards')) surfaceHex = '#FFFFFF';
    else if (colorSpec.surface === 'grey') surfaceHex = '#E5E7EB';
    else surfaceHex = resolveColorToHex(colorSpec.surface, isLightMode ? '#FFFFFF' : domainPalette.surface);
  }

  // Primary Button hex
  let buttonBgHex = domainPalette.primary;
  if (colorSpec.buttonBackground) {
    buttonBgHex = resolveColorToHex(colorSpec.buttonBackground, domainPalette.primary);
  }

  // Primary Button Text hex (Auto-calculate high contrast)
  let buttonTextHex = '#FFFFFF';
  const lightBtnBgs = ['#FFFFFF', '#F8FAFC', '#FDFBF7', '#F5F5DC', '#F3F4F6', '#E5E7EB', '#FACC15', '#FEF08A', '#F59E0B', '#E9D5FF', '#A7F3D0'];
  if (lightBtnBgs.includes(buttonBgHex.toUpperCase()) || colorSpec.buttonBackground === 'white' || colorSpec.buttonBackground === 'yellow') {
    buttonTextHex = '#111827';
  }

  // Base Text hex
  let textHex = isLightMode ? '#111827' : '#F8FAFC';
  let mutedHex = isLightMode ? '#6B7280' : '#94A3B8';
  let borderHex = isLightMode ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)';

  // Headings hex
  let headingHex = textHex;
  if (colorSpec.headings) {
    headingHex = resolveColorToHex(colorSpec.headings, textHex);
  }

  // Accent hex
  let accentHex = buttonBgHex !== '#FFFFFF' ? buttonBgHex : '#6366F1';

  return {
    background: bgHex,
    surface: surfaceHex,
    primary: buttonBgHex,
    primaryText: buttonTextHex,
    secondary: isLightMode ? '#E5E7EB' : '#1F2937',
    text: textHex,
    headings: headingHex,
    mutedText: mutedHex,
    border: borderHex,
    accent: accentHex,
    headerBg: surfaceHex,
    headerText: textHex,
  };
};

// ── Gemini System Prompt Formatter ────────────────────────────────────────────
/**
 * Formats a Requirement Specification into explicit system instructions for Gemini.
 *
 * @param {object} spec - Output of extractPromptRequirements()
 * @returns {string} Explicit system instruction text
 */
const formatRequirementSpecPrompt = (spec) => {
  if (!spec) return '';

  let text = `\n\n==================================================\n`;
  text += `MANDATORY REQUIREMENT SPECIFICATION (MUST COMPLY 100%):\n`;
  text += `==================================================\n`;
  text += `DOMAIN: ${spec.domain.toUpperCase()}\n`;
  text += `PAGE TYPE: ${spec.pageType}\n\n`;

  text += `REQUIRED SECTIONS:\n`;
  spec.requiredSections.forEach((sec) => {
    text += `- MUST generate a section of type "${sec}"\n`;
  });

  text += `\nMANDATORY COLOR THEME TOKENS (HIGHEST PRIORITY):\n`;
  if (spec.themeTokens) {
    text += `- themeTokens: ${JSON.stringify(spec.themeTokens)}\n`;
    text += `- BACKGROUND COLOR: "${spec.themeTokens.background}"\n`;
    text += `- SURFACE / CARD COLOR: "${spec.themeTokens.surface}"\n`;
    text += `- BUTTON BACKGROUND: "${spec.themeTokens.primary}"\n`;
    text += `- BUTTON TEXT COLOR: "${spec.themeTokens.primaryText}"\n`;
    text += `- TEXT COLOR: "${spec.themeTokens.text}"\n`;
    if (spec.themeTokens.headings) text += `- HEADING TEXT COLOR: "${spec.themeTokens.headings}"\n`;
    text += `Include "themeTokens": ${JSON.stringify(spec.themeTokens)} inside "props" of output UIPage.\n`;
  }

  if (spec.loginTypes?.length > 0) {
    text += `- LOGIN PORTAL REQUIREMENT: MUST include dedicated login functionality for ${spec.loginTypes.join(' and ')} (e.g. Student Login card/form AND Teacher Login card/form).\n`;
  }

  if (spec.requiresImage) {
    text += `- MUST include high-quality, domain-specific IMAGE elements (type "image") with descriptive "imageQuery" e.g. "${spec.domain} photo". NEVER use empty images.\n`;
  }

  if (spec.requiresPrice) {
    text += `- MUST include explicit price text (e.g. "${spec.financials?.basePriceFormatted || '₹500'}") for items and products.\n`;
  }

  if (spec.requiresGST && spec.financials) {
    text += `- MUST include GST tax breakdown with exact amounts:\n`;
    text += `  • Item Price: ${spec.financials.basePriceFormatted}\n`;
    text += `  • GST Rate: ${spec.financials.gstPercentage}%\n`;
    text += `  • GST Amount: ${spec.financials.gstAmountFormatted}\n`;
    text += `  • Final Total Price: ${spec.financials.totalPriceFormatted}\n`;
    text += `  Include a clear price breakdown element/card showing Subtotal, GST Amount, and Final Total.\n`;
  }

  if (spec.explicitBrand) {
    text += `- EXACT BRAND NAME: MUST use "${spec.explicitBrand}" as the website brand logo and navbar title.\n`;
  }

  if (spec.explicitHeadline) {
    text += `- EXACT HERO HEADLINE: MUST use "${spec.explicitHeadline}" as the main hero H1 heading.\n`;
  }

  if (spec.interactiveFeatures?.length > 0) {
    text += `- INTERACTIVE FUNCTIONALITY REQUIREMENTS:\n`;
    if (spec.interactiveFeatures.includes('accordion')) {
      text += `  • MUST include an interactive FAQ section (type "faq" or "accordion") with questions and answers.\n`;
    }
    if (spec.interactiveFeatures.includes('contactForm')) {
      text += `  • MUST include a working contact/inquiry form (type "contact") with Name, Email, Phone/Message inputs and a Submit button.\n`;
    }
    if (spec.interactiveFeatures.includes('pricingToggle')) {
      text += `  • MUST include a multi-tier pricing section (type "pricing") with 3 distinct plans (e.g. Starter, Pro, Enterprise) and features list.\n`;
    }
    if (spec.interactiveFeatures.includes('search')) {
      text += `  • MUST include search & filter capabilities for the items/cards collection.\n`;
    }
  }

  text += `\nMANDATORY ACTION BUTTONS:\n`;
  spec.requiredActions.forEach((act) => {
    text += `- MUST include a button element with content "${act}" and variant "primary" or "secondary"\n`;
  });

  text += `\nCRITICAL RULE: Every mandatory requirement above MUST be represented in the output JSON. Do NOT omit any requested element.\n`;

  return text;
};

module.exports = {
  extractPromptRequirements,
  extractColorSpec,
  buildThemeTokens,
  resolveColorToHex,
  calculateFinancials,
  formatRequirementSpecPrompt,
  DOMAIN_PATTERNS,
};

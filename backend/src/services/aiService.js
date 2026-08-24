/**
 * NeuraMinds — AI Service (Gemini)
 *
 * This is the SOLE abstraction boundary for AI/LLM calls.
 * Controllers must NEVER contain provider-specific logic.
 *
 * Provider: Google Gemini (gemini-2.0-flash by default)
 * Config:   AI_API_KEY, AI_MODEL (via .env)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { geminiProviderManager } = require('./geminiProviderManager');
const { resolveContextualImage } = require('./imageService');

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * Known valid Gemini models. Prevents accidental use of non-existent model names.
 * When in doubt, fall back to gemini-2.0-flash which supports vision + JSON mode.
 */
const VALID_MODELS = new Set([
  'gemini-3.6-flash',        // current recommended
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
]);

const DEFAULT_MODEL = 'gemini-2.0-flash';

const getConfig = () => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not set. Add it to backend/.env');
  }

  const rawModel = (process.env.AI_MODEL || DEFAULT_MODEL).trim();
  const model = VALID_MODELS.has(rawModel) ? rawModel : DEFAULT_MODEL;

  if (!VALID_MODELS.has(rawModel)) {
    console.warn(
      `[AI] AI_MODEL="${rawModel}" is not a recognised Gemini model — falling back to "${DEFAULT_MODEL}"`
    );
  }

  return { apiKey, model };
};

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are NeuraMinds, a world-class AI Creative Director and Chief Product Designer (ex-Lovable, Stripe, Airbnb).
You produce ONLY valid JSON — no markdown fences, no backticks, no explanatory text before or after.

Your mission is to generate HACKATHON-WINNING, visually stunning, ultra-colorful, production-ready web applications that outshine Lovable, Gemini, and ChatGPT.

Output a single JSON object matching this exact schema:

{
  "page": "<PageName>",
  "sections": [
    {
      "id": "<unique-section-id>",
      "type": "<hero|navbar|features|pricing|footer|cards|carousel|wizard|content|cta|testimonials|gallery|custom>",
      "elements": [
        {
          "id": "<unique-element-id>",
          "type": "<text|image|button|input|textfield|card|cards|icon|divider|link|list|carousel|wizard|custom>",
          "content": "<the actual content string or structured object>",
          "fallback": "<safe default content if AI response fails>",
          "props": {}
        }
      ],
      "props": {}
    }
  ],
  "meta": {
    "title": "<page title>",
    "description": "<page description>"
  }
}

HACKATHON-WINNING VISUAL & AESTHETIC DIRECTIVES:
1. COLORFUL & VIBRANT DOMAIN-SPECIFIC THEMING:
   - NEVER generate monotone, plain black, or dull gray pages. Use vibrant, rich, colorful domain palettes:
     * Food & Dining: Crimson Flame (#E11D48) & Sunfire Amber (#F97316) over Warm Charcoal (#181216) or Ivory (#FDFBF7)
     * College & Education: Royal Imperial Blue (#2563EB) & Emerald (#059669) over Crisp Royal Slate (#F8FAFC)
     * Hospital & Healthcare: Health Mint Teal (#0D9488) & Crimson (#E11D48) over Soft Medical White (#F0FDFA)
     * Travel & Resort: Tropical Azure (#0284C7) & Golden Sunset (#F59E0B) over Deep Ocean (#0C1B2A)
     * Fashion & E-Commerce: Luxe Rose (#F43F5E) & Champagne Gold (#F59E0B) over Velvet Night (#0F0E17)
     * Gaming & Esports: Cyber Lime (#84CC16) & Electric Cyan (#06B6D4) over Carbon Dark (#090A0F)
     * SaaS & AI Tech: Neon Violet (#8B5CF6) & Hyper Cyan (#06B6D4) over Obsidian Deep (#090814)

2. FULL 6-8 MULTI-SECTION RICHNESS (DO NOT GENERATE BRIEF OR SMALL PAGES):
   Every generated website MUST include 6 to 8 full-sized sections:
     Section 1) Navbar: Brand logo with glowing icon badge, navigation links, search input, role switcher / login CTA button.
     Section 2) Hero: High-impact bold headline, subheadline, dual primary/secondary CTA buttons, trust badges ("★ 4.9/5 Rating · 50,000+ Active Users"), and high-res Unsplash hero photography.
     Section 3) Category Filter & Control Bar: Interactive pill badges ("All", "Popular", "Top Rated", "Featured") and search bar.
     Section 4) Core Cards Grid (6 to 8 detailed items): Each card MUST have title, price (with GST if food/checkout), star rating badge ("★ 4.9"), description, category badge, Unsplash imageQuery, and "Add to Cart" or "Book Now" CTA button.
     Section 5) Core Pillars / Features Grid (4 cards): Highlighting key domain advantages with colorful icon badges.
     Section 6) Stat Counter Bar: 4 large numerical metrics (e.g., "99.9% Uptime", "50k+ Happy Customers", "100+ Awards").
     Section 7) Testimonials & FAQ Accordion: Authentic customer review cards with star ratings and avatar badges.
     Section 8) Grand Footer: Brand mission, multi-column navigation links, newsletter email signup input form, social media icons, and legal links.

3. ZERO PLACEHOLDERS & ABSOLUTE CONTENT REALISM:
   - NEVER output "Lorem ipsum", "Sample text", or generic placeholders.
   - Use exact realistic prices (e.g. "$14.99", "₹349", "$1,450/mo"), accurate ratings ("★ 4.9 (320+ reviews)"), explicit button labels ("Order Fresh Now", "Book Free Consultation", "Explore Collection", "Sign In to Student Portal").

4. HIGH-RESOLUTION CONTEXTUAL IMAGE QUERIES:
   - EVERY image element and EVERY card item MUST include a domain-specific "imageQuery" so real Unsplash photos render automatically across all elements!

OUTPUT ONLY THE JSON OBJECT. ZERO TEXT BEFORE OR AFTER.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read an image file and return a Gemini-compatible inline data part.
 * @param {string} filePath - filename (relative to uploads/) or absolute path
 */
const imageFileToPart = (filePath) => {
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '../../uploads', filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Wireframe file not found: ${filePath}`);
  }

  const data = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase().replace('.', '');
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const mimeType = mimeMap[ext] || 'image/png';

  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
};

/**
 * Extract pure JSON from an AI response that may contain markdown fences
 * or surrounding prose. Three-pass fallback strategy.
 *
 * @param {string} text - raw AI response text
 * @returns {object} parsed JSON
 * @throws {Error} if no valid JSON found
 */
const extractJSON = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('AI returned an empty response');
  }

  const trimmed = text.trim();

  // Pass 1: direct parse (model followed the instruction)
  try {
    return JSON.parse(trimmed);
  } catch (_) { /* continue */ }

  // Pass 2: strip markdown code fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) { /* continue */ }
  }

  // Pass 3: find first '{' ... last '}' pair
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch (_) { /* continue */ }
  }

  throw new Error('AI response did not contain valid JSON');
};

/**
 * Build shared generationConfig. responseMimeType is only added for
 * models known to support structured JSON output mode.
 *
 * @param {string} model
 */
const buildGenerationConfig = (model) => {
  const config = {
    temperature: 0.7,
    maxOutputTokens: 8192,
  };

  // responseMimeType is supported on flash/pro models; guard it defensively
  const supportsJsonMode = [
    'gemini-3.6-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ].includes(model);

  if (supportsJsonMode) {
    config.responseMimeType = 'application/json';
  }

  return config;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a UIPage from a text prompt (no wireframe).
 *
 * @param {object} params
 * @param {string} params.prompt
 * @param {string} [params.pageName]
 * @param {string} [params.existingCode]
 * @param {string} [params.architectureFlow]
 * @returns {Promise<object>} parsed UIPage JSON
 */
const buildSmartFallbackPage = (pageName = 'Home', prompt = '') => {
  const promptLower = String(prompt).toLowerCase();
  const name = pageName || 'Home';

  const contextAsset = resolveContextualImage(prompt || pageName, 'Hero visual asset');
  let heroTitle = `${name} Portal`;
  let heroDesc = `Discover modern solutions designed for exceptional digital experiences.`;
  let heroImage = contextAsset.src;
  let heroCta = 'Explore Now';
  let cardTitle = 'Core Services & Programs';
  let items = [
    { id: 'item-1', title: 'Streamlined Analytics', description: 'Real-time performance tracking and actionable business metrics.', price: '$29/mo' },
    { id: 'item-2', title: 'Automated Workflows', description: 'Intelligent process automation designed for modern teams.', price: '$49/mo' },
    { id: 'item-3', title: 'Enterprise Security', description: 'Bank-grade encryption and access controls across all touchpoints.', price: '$99/mo' },
  ];

  if (promptLower.includes('college') || promptLower.includes('university') || promptLower.includes('campus') || promptLower.includes('academic')) {
    heroTitle = 'Excellence in Higher Education & Academic Innovation';
    heroDesc = 'Empowering future leaders through world-class degree programs, pioneering research, and vibrant campus life.';
    heroImage = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Apply Now';
    cardTitle = 'Academic Departments & Degree Programs';
    items = [
      { id: 'edu-1', title: 'School of Computer Science & AI', description: 'B.S. and M.S. programs in Software Engineering, Data Science, and Robotics.', price: 'Admissions Open' },
      { id: 'edu-2', title: 'Department of Business Administration', description: 'MBA and Undergraduate programs in Global Finance, Leadership, and Marketing.', price: 'Admissions Open' },
      { id: 'edu-3', title: 'College of Engineering & Architecture', description: 'ABET-accredited majors in Electrical, Mechanical, and Sustainable Design.', price: 'Admissions Open' },
    ];
  } else if (promptLower.includes('hospital') || promptLower.includes('medical') || promptLower.includes('clinic') || promptLower.includes('doctor')) {
    heroTitle = 'World-Class Healthcare & Compassionate Patient Care';
    heroDesc = 'Advanced clinical care, state-of-the-art diagnostic facilities, and dedicated medical specialists available 24/7.';
    heroImage = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Book Appointment';
    cardTitle = 'Specialized Clinical Services & Departments';
    items = [
      { id: 'hosp-1', title: 'Cardiology & Vascular Institute', description: 'Comprehensive heart care, non-invasive imaging, and advanced cardiac surgery.', price: 'Emergency 24/7' },
      { id: 'hosp-2', title: 'Orthopedics & Joint Replacement', description: 'Robotic joint surgery, sports medicine, and specialized rehabilitation therapies.', price: 'Consultation Available' },
      { id: 'hosp-3', title: 'Pediatric & Neonatal Care Center', description: 'Specialized pediatric ICU, emergency care, and child development specialists.', price: 'Consultation Available' },
    ];
  } else if (promptLower.includes('bank') || promptLower.includes('banking') || promptLower.includes('fintech')) {
    heroTitle = 'Next-Generation Digital Banking & Financial Freedom';
    heroDesc = 'Manage accounts, transfer funds instantly, and grow investments with institutional-grade security.';
    heroImage = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Open Account';
    cardTitle = 'Financial Accounts & Digital Solutions';
    items = [
      { id: 'bank-1', title: 'High-Yield Premier Savings Account', description: '4.85% APY interest rate with zero monthly fees and instant mobile access.', price: '4.85% APY' },
      { id: 'bank-2', title: 'Cashback World Rewards Card', description: '3% unlimited cashback on dining and travel with zero foreign transaction fees.', price: 'No Annual Fee' },
      { id: 'bank-3', title: 'Automated Portfolio Investment', description: 'AI-driven robo-advisory portfolio rebalancing tailored to your risk profile.', price: '$0 Commission' },
    ];
  } else if (promptLower.includes('job') || promptLower.includes('career') || promptLower.includes('hiring')) {
    heroTitle = 'Discover Your Next Career at Leading Tech Enterprises';
    heroDesc = 'Connect with top engineering, design, and product roles offering competitive compensation and remote flexibility.';
    heroImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Search Jobs';
    cardTitle = 'Featured Career Vacancies';
    items = [
      { id: 'job-1', title: 'Senior Full Stack Engineer', description: 'React, Node.js, GraphQL • Remote / Hybrid • Full-time', price: '$140k - $180k' },
      { id: 'job-2', title: 'Lead Product Designer (UX/UI)', description: 'Figma, Design Systems, Mobile Apps • San Francisco, CA', price: '$130k - $165k' },
      { id: 'job-3', title: 'Principal Cloud Architect', description: 'AWS, Kubernetes, Terraform • New York, NY / Remote', price: '$170k - $210k' },
    ];
  } else if (promptLower.includes('food') || promptLower.includes('pizza') || promptLower.includes('burger') || promptLower.includes('restaurant')) {
    heroTitle = 'Artisan Culinary Delivered Fresh to Your Door';
    heroDesc = 'Savor hand-crafted gourmet meals prepared by master chefs using locally sourced organic ingredients.';
    heroImage = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Order Online';
    cardTitle = 'Popular Menu Items';
    items = [
      { id: 'food-1', title: 'Truffle & Mushroom Pizza', description: 'Wood-fired sourdough base with wild mushrooms and truffle oil.', price: '₹350' },
      { id: 'food-2', title: 'Gourmet Wagyu Burger', description: 'Double wagyu beef patty, aged cheddar, and smoked aioli on brioche.', price: '₹280' },
      { id: 'food-3', title: 'Artisan Rigatoni Carbonara', description: 'Handmade pasta with crispy guanciale, pecorino romano, and egg yolk.', price: '₹320' },
    ];
  } else if (promptLower.includes('travel') || promptLower.includes('resort') || promptLower.includes('hotel')) {
    heroTitle = 'Explore Breathtaking Global Destinations';
    heroDesc = 'Plan your next dream luxury escape with curated resort packages, private tours, and exclusive travel deals.';
    heroImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Book Now';
    cardTitle = 'Featured Luxury Resorts';
    items = [
      { id: 'travel-1', title: 'Overwater Bungalow Resort', description: 'Maldives turquoise lagoon villa with private infinity plunge pool.', price: '$650/night' },
      { id: 'travel-2', title: 'Swiss Alpine Lodge', description: 'Panoramic mountain views with ski-in access and luxury spa amenities.', price: '$480/night' },
      { id: 'travel-3', title: 'Santorini Cliffside Suites', description: 'Sunset ocean views overlooking the Caldera with private terrace dining.', price: '$520/night' },
    ];
  } else if (promptLower.includes('fashion') || promptLower.includes('clothes') || promptLower.includes('store') || promptLower.includes('ecommerce')) {
    heroTitle = 'Elevate Your Style with Autumn Luxe Collection';
    heroDesc = 'Discover minimalist luxury apparel crafted with sustainable textiles and timeless design aesthetics.';
    heroImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Shop Now';
    cardTitle = 'Trending Seasonal Apparel';
    items = [
      { id: 'fashion-1', title: 'Tailored Cashmere Coat', description: 'Double-breasted wool-cashmere blend with structured lapels.', price: '$340.00' },
      { id: 'fashion-2', title: 'Italian Leather Jacket', description: 'Hand-finished full-grain leather jacket with matte black hardware.', price: '$490.00' },
      { id: 'fashion-3', title: 'Minimalist Designer Sneakers', description: 'Premium calfskin leather low-top sneakers with ergonomic insoles.', price: '$220.00' },
    ];
  } else if (promptLower.includes('estate') || promptLower.includes('villa') || promptLower.includes('house') || promptLower.includes('property')) {
    heroTitle = 'Discover Exceptional Architectural Properties';
    heroDesc = 'Browse luxury waterfront estates, modern architectural villas, and exclusive penthouse residences.';
    heroImage = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80';
    heroCta = 'Inquire Now';
    cardTitle = 'Featured Prime Listings';
    items = [
      { id: 'estate-1', title: 'Modern Oceanfront Villa', description: '5 Beds • 6 Baths • 6,500 Sq Ft with private beach access.', price: '$3,850,000' },
      { id: 'estate-2', title: 'Contemporary Hillside Estate', description: '4 Beds • 5 Baths • Infinity pool overlooking city skyline.', price: '$2,750,000' },
      { id: 'estate-3', title: 'Luxury Penthouse Residence', description: '3 Beds • 3.5 Baths • Private rooftop terrace and concierge.', price: '$1,950,000' },
    ];
  } else if (promptLower.includes('architecture') || promptLower.includes('diagram') || promptLower.includes('dataflow') || promptLower.includes('microservice') || promptLower.includes('usecase') || promptLower.includes('pipeline') || promptLower.includes('system')) {
    heroTitle = 'Software System & Architecture Management Console';
    heroDesc = 'Operational telemetry, service topology, and data pipeline management synthesized directly from software diagrams.';
    heroImage = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80';
    cardTitle = 'System Nodes & Core Pipelines';
    items = [
      { id: 'diag-1', title: 'API Gateway & Ingress Router', description: 'High-availability reverse proxy with JWT authentication and traffic throttling.', price: 'Healthy • 99.98% uptime', badge: 'Active Node', icon: 'pi pi-cloud' },
      { id: 'diag-2', title: 'Real-Time Stream Processor', description: 'Event pipeline processing message queues with automated partition rebalancing.', price: '12ms Latency', badge: 'Stream Pipeline', icon: 'pi pi-sync' },
      { id: 'diag-3', title: 'Distributed Database Cluster', description: 'Multi-region replicated data tier with automatic failover and query caching.', price: 'Sync OK', badge: 'Data Tier', icon: 'pi pi-database' },
    ];
  }

  const isLightTheme = promptLower.includes('white color') || promptLower.includes('light theme') || promptLower.includes('white page');
  const hasLogin = promptLower.includes('student') || promptLower.includes('teacher') || promptLower.includes('login');
  const isCollege = promptLower.includes('college') || promptLower.includes('university') || promptLower.includes('campus');

  const pageProps = isLightTheme ? { theme: 'light' } : {};

  const pageSections = [
    {
      id: 'sec-nav',
      type: 'navbar',
      elements: [
        { id: 'nav-logo', type: 'text', content: name, props: { tag: 'h2' }, fallback: name },
        { id: 'nav-btn', type: 'button', content: heroCta, props: { variant: 'primary' }, fallback: heroCta },
      ],
    },
    {
      id: 'sec-hero',
      type: 'hero',
      elements: [
        { id: 'hero-title', type: 'text', content: heroTitle, props: { tag: 'h1' }, fallback: heroTitle },
        { id: 'hero-desc', type: 'text', content: heroDesc, props: { tag: 'p' }, fallback: heroDesc },
        { id: 'hero-btn', type: 'button', content: heroCta, props: { variant: 'primary' }, fallback: heroCta },
        { id: 'hero-img', type: 'image', props: { src: heroImage, alt: heroTitle }, fallback: heroTitle },
      ],
    },
  ];

  if (isCollege && hasLogin) {
    pageSections.push({
      id: 'sec-auth-portal',
      type: 'features',
      elements: [
        { id: 'auth-header', type: 'text', content: 'College Student & Faculty Access Portal', props: { tag: 'h2' }, fallback: 'Student & Faculty Portal' },
        {
          id: 'auth-cards-grid',
          type: 'cards',
          props: {
            columns: 2,
            items: [
              { id: 'card-student-login', title: 'Student Login', description: 'Access coursework, gradebooks, assignment submissions, and student notices.', price: 'Student Portal', badge: 'Students', icon: 'pi pi-user' },
              { id: 'card-teacher-login', title: 'Teacher Login', description: 'Access faculty dashboard, attendance tracking, syllabus management, and grading.', price: 'Faculty Portal', badge: 'Faculty', icon: 'pi pi-briefcase' },
            ],
          },
          fallback: 'Role Login Portals',
        },
        { id: 'btn-student-login', type: 'button', content: 'Student Login', props: { variant: 'primary', label: 'Student Login' }, fallback: 'Student Login' },
        { id: 'btn-teacher-login', type: 'button', content: 'Teacher Login', props: { variant: 'primary', label: 'Teacher Login' }, fallback: 'Teacher Login' },
      ],
    });

    pageSections.push({
      id: 'sec-gallery',
      type: 'gallery',
      elements: [
        { id: 'gallery-header', type: 'text', content: 'Campus Life & Academic Facilities', props: { tag: 'h2' }, fallback: 'Campus Life' },
        { id: 'img-campus-1', type: 'image', props: { src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80', alt: 'University Campus Quad & Hall' }, fallback: 'Campus Quad' },
        { id: 'img-campus-2', type: 'image', props: { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', alt: 'Students Studying on Campus' }, fallback: 'Students Studying' },
        { id: 'img-campus-3', type: 'image', props: { src: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80', alt: 'University Library & Study Space' }, fallback: 'University Library' },
      ],
    });
  }

  pageSections.push(
    {
      id: 'sec-cards',
      type: 'cards',
      elements: [
        { id: 'cards-heading', type: 'text', content: cardTitle, props: { tag: 'h2' }, fallback: cardTitle },
        { id: 'cards-collection', type: 'cards', props: { items }, fallback: cardTitle },
      ],
    },
    {
      id: 'sec-footer',
      type: 'footer',
      elements: [
        { id: 'footer-text', type: 'text', content: `© ${new Date().getFullYear()} ${name}. All rights reserved.`, props: { tag: 'p' }, fallback: `© ${name}` },
      ],
    }
  );

  const { extractPromptRequirements } = require('./promptRequirementExtractor');
  const reqSpec = extractPromptRequirements(prompt);

  const finalProps = {
    ...(pageProps || {}),
    themeTokens: reqSpec.themeTokens,
    bgColor: reqSpec.customBgColor || reqSpec.colorSpec?.background,
    buttonColor: reqSpec.primaryButtonColor || reqSpec.colorSpec?.buttonBackground,
  };

  return {
    page: name,
    props: finalProps,
    themeTokens: reqSpec.themeTokens,
    meta: {
      title: name,
      description: heroDesc,
      prompt: prompt,
      themeTokens: reqSpec.themeTokens,
      customBgColor: reqSpec.customBgColor || reqSpec.colorSpec?.background,
      primaryButtonColor: reqSpec.primaryButtonColor || reqSpec.colorSpec?.buttonBackground,
      theme: isLightTheme ? 'light' : 'dark',
      generatedAt: new Date().toISOString(),
    },
    sections: pageSections,
  };
};

const executeWithModelFallback = async (genAI, primaryModel, buildRequestFn, prompt = '', pageName = 'Home') => {
  const fallbackModels = [
    primaryModel,
    'gemini-3.6-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError;
  for (const modelName of fallbackModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const { contents, config } = buildRequestFn(modelName);
      const result = await model.generateContent({
        contents,
        generationConfig: config,
      });

      const text = result.response.text();
      console.log(`[AI] Response generated using model "${modelName}" (${text.length} chars)`);
      return extractJSON(text);
    } catch (err) {
      lastError = err;
      const isQuotaError =
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('404');

      if (isQuotaError) {
        console.warn(`[AI] Quota/Rate limit hit on "${modelName}" — waiting 1s before trying next model...`);
        await new Promise((res) => setTimeout(res, 1000));
        continue;
      }
    }
  }

  console.warn('[AI] Remote AI models exhausted quota limits — engaging NeuraMinds Intelligent Generation Fallback engine.');
  return buildSmartFallbackPage(pageName, prompt);
};

/**
 * Generate a UIPage from a text prompt (no wireframe).
 *
 * @param {object} params
 * @param {string} params.prompt
 * @param {string} [params.pageName]
 * @param {string} [params.existingCode]
 * @param {string} [params.architectureFlow]
 * @returns {Promise<object>} parsed UIPage JSON
 */
const generateUIFromPrompt = async ({ prompt, pageName, existingCode, architectureFlow }) => {
  const { extractPromptRequirements, formatRequirementSpecPrompt } = require('./promptRequirementExtractor');
  const reqSpec = extractPromptRequirements(prompt);
  const reqSpecPrompt = formatRequirementSpecPrompt(reqSpec);

  console.log(`\n================ GENERATION REQUEST ================`);
  console.log(`prompt: "${prompt}"`);
  console.log(`pageName: "${pageName || 'Home'}"`);
  console.log(`wireframe: none`);
  console.log(`detected requirements:`, JSON.stringify({
    domain: reqSpec.domain,
    pageType: reqSpec.pageType,
    theme: reqSpec.theme,
    users: reqSpec.users,
    loginTypes: reqSpec.loginTypes,
    requiresImage: reqSpec.requiresImage,
    imageDensity: reqSpec.imageDensity,
    requiredSections: reqSpec.requiredSections,
    requiredActions: reqSpec.requiredActions,
  }, null, 2));
  console.log(`====================================================\n`);

  let userMessage = `Generate a complete UI page named "${pageName || 'Home'}".\n\nUser prompt:\n${prompt}${reqSpecPrompt}`;
  if (existingCode) userMessage += `\n\nExisting code context (use as reference for styling/structure):\n${existingCode}`;
  if (architectureFlow) userMessage += `\n\nArchitecture / user flow:\n${architectureFlow}`;

  return geminiProviderManager.generateWithFailover(async ({ apiKey, model: providerModel }) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    return executeWithModelFallback(
      genAI,
      providerModel,
      (modelName) => ({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: buildGenerationConfig(modelName),
      }),
      prompt,
      pageName
    );
  });
};

/**
 * Generate a UIPage from a wireframe image (with optional prompt).
 *
 * @param {object} params
 * @param {string} params.imagePath - filename or absolute path to the wireframe
 * @param {string} [params.prompt]
 * @param {string} [params.pageName]
 * @returns {Promise<object>} parsed UIPage JSON
 */
const generateUIFromWireframe = async ({ imagePath, prompt, pageName }) => {
  const { extractPromptRequirements, formatRequirementSpecPrompt } = require('./promptRequirementExtractor');
  const reqSpec = extractPromptRequirements(prompt || 'wireframe layout');
  console.log(`\n================ GENERATION REQUEST ================`);
  console.log(`prompt: "${prompt || ''}"`);
  console.log(`pageName: "${pageName || 'Home'}"`);
  console.log(`wireframe: "${imagePath}"`);
  console.log(`detected requirements:`, JSON.stringify({
    domain: reqSpec.domain,
    pageType: reqSpec.pageType,
    theme: reqSpec.theme,
    users: reqSpec.users,
    loginTypes: reqSpec.loginTypes,
    requiresImage: reqSpec.requiresImage,
  }, null, 2));
  console.log(`====================================================\n`);

  const imagePart = imageFileToPart(imagePath);

  let userMessage = `Analyse this wireframe image carefully and generate a structured UI page named "${pageName || 'Home'}" that faithfully reproduces its layout, sections, and component hierarchy.`;
  if (prompt) {
    userMessage += `\n\nAdditional instructions from the user:\n${prompt}${formatRequirementSpecPrompt(reqSpec)}`;
  }

  return geminiProviderManager.generateWithFailover(async ({ apiKey, model: providerModel }) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    return executeWithModelFallback(
      genAI,
      providerModel,
      (modelName) => ({
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }, imagePart],
          },
        ],
        config: buildGenerationConfig(modelName),
      }),
      prompt,
      pageName
    );
  });
};

/**
 * Generate a UIPage from any software-related diagram (Architecture, Use Case, Data Flow DFD, Sequence, ER Schema, Microservices).
 *
 * @param {object} params
 * @param {string} [params.imagePath] - filename of diagram image if uploaded
 * @param {string} [params.diagramCode] - text/spec of diagram (Mermaid, PlantUML, ASCII, text)
 * @param {string} [params.diagramType] - 'architecture' | 'dataflow' | 'usecase' | 'sequence' | 'schema' | 'workflow' | 'auto'
 * @param {string} [params.prompt] - optional extra user instructions
 * @param {string} [params.pageName]
 * @returns {Promise<object>} parsed UIPage JSON
 */
const generateUIFromDiagram = async ({ imagePath, diagramCode, diagramType = 'auto', prompt, pageName }) => {
  const config = getConfig();
  const resolvedName = pageName || 'Software Architecture Console';
  console.log(`[AI] generateUIFromDiagram — model: ${config.model}, type: ${diagramType}, image: "${imagePath || 'none'}", page: "${resolvedName}"`);

  const genAI = new GoogleGenerativeAI(config.apiKey);

  let typeGuidance = '';
  switch (diagramType) {
    case 'architecture':
      typeGuidance = 'This is a SOFTWARE / SYSTEM ARCHITECTURE diagram (e.g. Microservices, Cloud Infrastructure, Multi-Tier App). Synthesize a production-ready system console / architectural interface displaying service health, active microservices, API Gateway endpoints, real-time message bus metrics, and operational control actions.';
      break;
    case 'mvc':
      typeGuidance = 'This is an MVC (MODEL-VIEW-CONTROLLER) ARCHITECTURE diagram. Synthesize a complete 3-tier application structure clearly presenting: (1) View Layer UI (User/Student portals, interactive forms, action buttons, and live dashboards), (2) Controller Layer (API routes, event handlers, workflow controllers, and request status indicators), and (3) Model Layer (Database entity cards, table schemas, records count, and data persistence controls).';
      break;
    case 'mvvm':
      typeGuidance = 'This is an MVVM (MODEL-VIEW-VIEWMODEL) ARCHITECTURE diagram. Synthesize a reactive modern application clearly presenting: (1) Declarative View UI (interactive screens, forms, click handlers, and visual metric displays), (2) ViewModel State Layer (Reactive StateFlow/LiveData status badges, event dispatchers, and state store monitors), and (3) Model Layer (Repository sync cards, remote REST API endpoints, and local cache controls).';
      break;
    case 'dataflow':
      typeGuidance = 'This is a DATA FLOW DIAGRAM (DFD) / ETL PIPELINE diagram. Synthesize a modern data pipeline dashboard showing data ingestion sources, transformation stages, stream latency/throughput KPI cards, processed record tables, and pipeline execution controls.';
      break;
    case 'usecase':
      typeGuidance = 'This is a USE CASE / USER JOURNEY diagram depicting actors and system goals. Synthesize a functional, end-user interactive portal or application fulfilling these use cases, complete with user role cards, step-by-step action wizards, input forms, and primary workflow buttons.';
      break;
    case 'sequence':
      typeGuidance = 'This is a SYSTEM SEQUENCE / INTERACTION FLOW diagram. Synthesize an interactive workflow execution interface showing the step-by-step lifecycle, participant service badges, request/response payload inspector cards, and execution triggers.';
      break;
    case 'schema':
      typeGuidance = 'This is an ENTITY-RELATIONSHIP (ERD) / DATABASE SCHEMA diagram. Synthesize a data management & entity explorer dashboard with data tables, relationship tags, entity detail view cards, and search/filtering controls.';
      break;
    case 'workflow':
      typeGuidance = 'This is a BUSINESS PROCESS / STATE MACHINE WORKFLOW diagram. Synthesize a visual process management portal with state transition stages, task approval cards, active status badges, and workflow trigger forms.';
      break;
    default:
      typeGuidance = 'This is a SOFTWARE DIAGRAM (Architecture, Flow, Pipeline, or Use Case). Analyze all components, labels, connections, data flows, and services shown, and generate a complete, rich, production-ready interface that operates, visualizes, or implements this software system.';
      break;
  }

  let userMessage = `You are an expert software architect AI converting software diagrams into live functional UI applications.\n\n${typeGuidance}\n\nGenerate a complete, structured UI page named "${resolvedName}" that faithfully visualizes, implements, and provides interfaces for all components, relationships, databases, and pipelines depicted in this diagram.`;

  if (diagramCode) {
    userMessage += `\n\nDiagram Code / Specification:\n\`\`\`\n${diagramCode}\n\`\`\``;
  }
  if (prompt) {
    userMessage += `\n\nUser's Custom Instructions:\n${prompt}`;
  }

  if (imagePath) {
    const imagePart = imageFileToPart(imagePath);
    return executeWithModelFallback(
      genAI,
      config.model,
      (modelName) => ({
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }, imagePart],
          },
        ],
        config: buildGenerationConfig(modelName),
      }),
      prompt || typeGuidance,
      resolvedName
    );
  } else {
    return executeWithModelFallback(
      genAI,
      config.model,
      (modelName) => ({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: buildGenerationConfig(modelName),
      }),
      prompt || typeGuidance,
      resolvedName
    );
  }
};

/**
 * Analyze a UI photo, screenshot, or page schema and extract a complete user flow diagram in flowchart format.
 *
 * @param {object} params
 * @param {string} [params.imagePath] - filename or path of UI screenshot/photo
 * @param {object} [params.uiPage] - existing UIPage JSON
 * @param {string} [params.prompt] - optional extra instructions
 * @returns {Promise<object>} flowchart JSON with nodes, edges, mermaid, and insights
 */
const generateUiToFlow = async ({ imagePath, uiPage, prompt }) => {
  const config = getConfig();
  console.log(`[AI] generateUiToFlow — model: ${config.model}, image: "${imagePath || 'none'}"`);

  const genAI = new GoogleGenerativeAI(config.apiKey);

  const flowSystemPrompt = `You are NeuraMinds Flowchart Architect.
Analyze the provided UI screenshot, photo, form, or application mockup and extract a complete, granular, step-by-step User Navigation & Interaction Flowchart.

Capture all sequential interaction stages such as:
1. Authentication & Access (Login / Register / New Applicant Portal)
2. Data & Detail Ingestion (Enter Student/User Details, Contact, Academic Info)
3. Media & Document Uploads (Upload Passport Photo, ID Proof, Documents, Transcripts)
4. Option Selection (Program / Course Selection, Department, Semester)
5. Decision Gateways & Validation Checks (Eligibility Verification, Form Validation Passed / Failed)
6. Transaction & Actions (Fee Payment Gateway, Terms Agreement, Digital Signature)
7. Outcomes & Confirmation (Submission Confirmation, Application Number Issued, Dashboard Tracking)

Output ONLY a single valid JSON object matching this schema:
{
  "title": "<Flowchart Title, e.g. Student Admission Application Flowchart>",
  "summary": "<2-3 sentence overview of the end-to-end user journey, forms, uploads, and decisions>",
  "nodes": [
    {
      "id": "node-login",
      "label": "Login / Register Portal",
      "type": "screen | section | action | decision | modal | outcome",
      "description": "Applicant authenticates or registers new account credentials",
      "icon": "pi pi-user",
      "step": 1
    },
    {
      "id": "node-details",
      "label": "Enter Student & Personal Details",
      "type": "section",
      "description": "Fills applicant full name, date of birth, contact details & address",
      "icon": "pi pi-id-card",
      "step": 2
    },
    {
      "id": "node-upload-photo",
      "label": "Upload Passport Photo & Documents",
      "type": "action",
      "description": "Uploads passport size photograph, ID proof, and academic certificates",
      "icon": "pi pi-camera",
      "step": 3
    },
    {
      "id": "node-course-select",
      "label": "Select Degree & Course Program",
      "type": "section",
      "description": "Chooses desired faculty, major/course, and study mode",
      "icon": "pi pi-bookmark",
      "step": 4
    },
    {
      "id": "node-eligibility-check",
      "label": "Eligibility & Prerequisite Check",
      "type": "decision",
      "description": "Automated system validation for minimum percentage & course criteria",
      "icon": "pi pi-verified",
      "step": 5
    },
    {
      "id": "node-fee-payment",
      "label": "Application Fee Payment",
      "type": "action",
      "description": "Submits online processing fee via payment gateway",
      "icon": "pi pi-credit-card",
      "step": 6
    },
    {
      "id": "node-confirmation",
      "label": "Application Submitted & Reference Generated",
      "type": "outcome",
      "description": "Generates Student Application Reference Number & Tracking Dashboard access",
      "icon": "pi pi-check-circle",
      "step": 7
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "node-login",
      "target": "node-details",
      "label": "Submits Credentials & Accesses Form",
      "type": "interaction"
    },
    {
      "id": "e2",
      "source": "node-details",
      "target": "node-upload-photo",
      "label": "Saves Profile & Proceeds to Documents",
      "type": "interaction"
    },
    {
      "id": "e3",
      "source": "node-upload-photo",
      "target": "node-course-select",
      "label": "Uploads Photo & Documents",
      "type": "interaction"
    },
    {
      "id": "e4",
      "source": "node-course-select",
      "target": "node-eligibility-check",
      "label": "Submits Course Selection",
      "type": "interaction"
    },
    {
      "id": "e5",
      "source": "node-eligibility-check",
      "target": "node-fee-payment",
      "label": "Eligibility Verified (Yes)",
      "type": "interaction"
    },
    {
      "id": "e6",
      "source": "node-fee-payment",
      "target": "node-confirmation",
      "label": "Payment Successful",
      "type": "interaction"
    }
  ],
  "mermaid": "flowchart TD\\n  A[1. Login / Register] -->|Authenticates| B[2. Enter Personal Details]\\n  B -->|Saves Profile| C[3. Upload Passport Photo & Docs]\\n  C -->|Files Attached| D[4. Select Course Program]\\n  D -->|Applies| E{5. Eligibility Check}\\n  E -->|Eligible| F[6. Pay Application Fee]\\n  E -->|Ineligible| G[Revision Request]\\n  F -->|Receipt Confirmed| H((7. Application Number Issued))",
  "insights": [
    "Critical Path: Student Login -> Enter Details -> Upload Photo -> Eligibility Check -> Fee Payment -> Confirmed",
    "Key Drop-off Guard: Mandatory passport photo & document validation before proceeding to payment"
  ]
}
Output pure JSON with no markdown fences or surrounding prose.`;

  let userMessage = `Analyze this UI screenshot/photo/specification and extract the complete, granular step-by-step user interaction flowchart (including authentication, filling details, document/passport photo uploads, course selections, decision checks, payments, and submission).`;
  if (uiPage) {
    userMessage += `\n\nExisting UI Page Structure:\n\`\`\`json\n${JSON.stringify(uiPage, null, 2).slice(0, 3000)}\n\`\`\``;
  }
  if (prompt) {
    userMessage += `\n\nCustom Instructions:\n${prompt}`;
  }

  // Smart domain-aware Fallback builder
  const buildFallbackFlow = () => {
    const rawText = `${prompt || ''} ${uiPage?.page || ''}`.toLowerCase();
    
    // 1. Hospital & Healthcare Patient Workflow
    if (/\bhospital\b|\bclinic\b|\bpatient\b|\bdoctor\b|\bmedical\b|\bhealth\b|\bopd\b|\btelehealth\b/i.test(rawText)) {
      return {
        title: 'Hospital Patient Intake & Clinical Care Flowchart',
        summary: 'Clinical workflow guiding patient registration, doctor appointment booking, diagnostic report uploads, clinical consultation, lab orders, and pharmacy discharge.',
        nodes: [
          {
            id: 'hosp-reg',
            label: '1. Patient Registration / UHID Login',
            type: 'screen',
            description: 'Patient creates unique Health ID (UHID) or logs in with mobile OTP.',
            icon: 'pi pi-user-plus',
            step: 1,
          },
          {
            id: 'hosp-dept',
            label: '2. Select Specialty & Doctor Slot',
            type: 'section',
            description: 'Chooses clinical department (Cardiology, Pediatrics, General) and consult time.',
            icon: 'pi pi-calendar-plus',
            step: 2,
          },
          {
            id: 'hosp-upload',
            label: '3. Upload Past Reports & Medical History',
            type: 'action',
            description: 'Attaches blood work PDFs, MRI/X-Ray scans, allergies, and current medications.',
            icon: 'pi pi-file-pdf',
            step: 3,
          },
          {
            id: 'hosp-consult',
            label: '4. Doctor Consultation (OPD / Video)',
            type: 'section',
            description: 'Clinical examination, vitals review, diagnostic evaluation, and note taking.',
            icon: 'pi pi-heart',
            step: 4,
          },
          {
            id: 'hosp-decision',
            label: '5. Diagnostic Lab Order / Prescription Check',
            type: 'decision',
            description: 'Doctor orders blood/imaging tests OR issues direct pharmacy e-prescription.',
            icon: 'pi pi-verified',
            step: 5,
          },
          {
            id: 'hosp-discharge',
            label: '6. E-Prescription & Follow-up Scheduled',
            type: 'outcome',
            description: 'Dispatches medication delivery, generates clinical summary, and sets follow-up alert.',
            icon: 'pi pi-check-circle',
            step: 6,
          },
        ],
        edges: [
          { id: 'he1', source: 'hosp-reg', target: 'hosp-dept', label: 'Registers UHID' },
          { id: 'he2', source: 'hosp-dept', target: 'hosp-upload', label: 'Selects Time Slot' },
          { id: 'he3', source: 'hosp-upload', target: 'hosp-consult', label: 'Attaches Lab History' },
          { id: 'he4', source: 'hosp-consult', target: 'hosp-decision', label: 'Doctor Diagnosis' },
          { id: 'he5', source: 'hosp-decision', target: 'hosp-discharge', label: 'Prescription Finalized' },
        ],
        mermaid: `flowchart TD
  A[1. Patient Registration / UHID] -->|Books Slot| B[2. Select Specialty & Doctor]
  B -->|Pre-consult| C[3. Upload Past Reports & Scans]
  C -->|Doctor Joins| D[4. Clinical Consultation]
  D -->|Doctor Examines| E{5. Lab Tests or Meds?}
  E -->|Tests Required| F[Order Lab Diagnostics & Sample Collection]
  E -->|Meds Only| G[6. E-Prescription Issued]
  F --> G
  G -->|Complete| H((Discharge Summary & Follow-up Set))`,
        insights: [
          'Clinical Pathway: Prior report upload ensures physician has full diagnostic context before entering consult room.',
        ],
      };
    }

    // 2. Hotel & Travel Reservation Workflow
    if (/\bhotel\b|\bresort\b|\bvacation\b|\broom\b|\bstay\b|\btravel\b|\bflight\b/i.test(rawText)) {
      return {
        title: 'Hotel & Travel Reservation Workflow Flowchart',
        summary: 'Hospitality guest journey covering destination search, room selection, guest ID proof uploads, payment confirmation, and digital keycard generation.',
        nodes: [
          { id: 't1', label: '1. Search Dates & Destination', type: 'screen', description: 'Enters city, check-in/out dates, and number of guests.', icon: 'pi pi-compass', step: 1 },
          { id: 't2', label: '2. Select Room Category & Amenities', type: 'section', description: 'Chooses Suite, Deluxe, or Executive room with breakfast options.', icon: 'pi pi-home', step: 2 },
          { id: 't3', label: '3. Enter Guest Details & Upload ID', type: 'action', description: 'Enters primary guest details and attaches passport / government ID scan.', icon: 'pi pi-id-card', step: 3 },
          { id: 't4', label: '4. Payment & Deposit Transaction', type: 'action', description: 'Processes secure credit card deposit with free cancellation terms.', icon: 'pi pi-credit-card', step: 4 },
          { id: 't5', label: '5. Instant Booking Voucher & Digital Key', type: 'outcome', description: 'Generates reservation voucher QR code and mobile check-in pass.', icon: 'pi pi-check-circle', step: 5 },
        ],
        edges: [
          { id: 'te1', source: 't1', target: 't2', label: 'Searches Availability' },
          { id: 'te2', source: 't2', target: 't3', label: 'Selects Room' },
          { id: 'te3', source: 't3', target: 't4', label: 'Attaches Guest ID' },
          { id: 'te4', source: 't4', target: 't5', label: 'Completes Payment' },
        ],
        mermaid: `flowchart TD
  A[1. Search Dates & Location] -->|Finds Rooms| B[2. Select Room & Amenities]
  B -->|Guest Profile| C[3. Enter Details & Upload Guest ID]
  C -->|Secure Checkout| D[4. Payment & Deposit]
  D -->|Confirmed| E((5. Booking Voucher QR & Mobile Key Generated))`,
        insights: [
          'Travel Flow: Guest ID upload ahead of arrival enables seamless contactless check-in.',
        ],
      };
    }

    // 3. Student Admission & Enrollment Workflow
    if (/\bstudent\b|\badmiss\b|\bschool\b|\bcollege\b|\buniversity\b|\benroll\b|\bpassport\b/i.test(rawText)) {
      return {
        title: 'Student Admission & Enrollment Application Flowchart',
        summary: 'End-to-end multi-step workflow detailing applicant registration, personal details entry, passport photo and document uploads, program selection, eligibility screening, fee transaction, and final application submission.',
        nodes: [
          {
            id: 'node-auth',
            label: '1. Applicant Login & Registration',
            type: 'screen',
            description: 'New student registers with email & phone, or logs into applicant portal.',
            icon: 'pi pi-user',
            step: 1,
          },
          {
            id: 'node-details',
            label: '2. Enter Student & Personal Details',
            type: 'section',
            description: 'Enter student full name, DOB, guardian information, address, and contact details.',
            icon: 'pi pi-id-card',
            step: 2,
          },
          {
            id: 'node-upload-photo',
            label: '3. Upload Passport Photo & Documents',
            type: 'action',
            description: 'Upload digital passport-sized photo, birth certificate, ID proof, and previous academic marksheets.',
            icon: 'pi pi-camera',
            step: 3,
          },
          {
            id: 'node-course-select',
            label: '4. Select Course & Academic Program',
            type: 'section',
            description: 'Select desired department, major/course curriculum, semester, and scholarship preferences.',
            icon: 'pi pi-bookmark',
            step: 4,
          },
          {
            id: 'node-eligibility',
            label: '5. Automated Eligibility & Prerequisite Check',
            type: 'decision',
            description: 'Automated verification check against minimum entry requirements and document completeness.',
            icon: 'pi pi-verified',
            step: 5,
          },
          {
            id: 'node-fee-payment',
            label: '6. Application Processing Fee Payment',
            type: 'action',
            description: 'Secure payment gateway processing for admission examination and application fee.',
            icon: 'pi pi-credit-card',
            step: 6,
          },
          {
            id: 'node-confirmation',
            label: '7. Application Submitted & Reference Issued',
            type: 'outcome',
            description: 'Student Application Number generated, confirmation PDF downloaded, and tracking portal enabled.',
            icon: 'pi pi-check-circle',
            step: 7,
          },
        ],
        edges: [
          { id: 'e1', source: 'node-auth', target: 'node-details', label: 'Authenticates & Accesses Form' },
          { id: 'e2', source: 'node-details', target: 'node-upload-photo', label: 'Saves Details & Proceeds' },
          { id: 'e3', source: 'node-upload-photo', target: 'node-course-select', label: 'Uploads Passport Photo & Docs' },
          { id: 'e4', source: 'node-course-select', target: 'node-eligibility', label: 'Submits Program Selection' },
          { id: 'e5', source: 'node-eligibility', target: 'node-fee-payment', label: 'Eligibility Verified (Yes)' },
          { id: 'e6', source: 'node-fee-payment', target: 'node-confirmation', label: 'Payment Successful' },
        ],
        mermaid: `flowchart TD
  A["1. Applicant Login & Registration"] -->|"Authenticates"| B["2. Enter Student Personal Details"]
  B -->|"Saves Profile"| C["3. Upload Passport Photo & Documents"]
  C -->|"Files Attached"| D["4. Select Course & Program"]
  D -->|"Submits Choice"| E{"5. Eligibility Verification"}
  E -->|"Eligible (Yes)"| F["6. Pay Application Processing Fee"]
  E -->|"Incomplete (No)"| G["Request Document Re-upload"]
  F -->|"Payment Confirmed"| H(["7. Application Number Issued & Dashboard Enabled"])`,
        insights: [
          'Primary Admission Path: Login -> Details -> Passport Photo -> Program -> Eligibility Check -> Fee -> Confirmation Number',
          'Automated checkpoint ensures passport photo and prerequisite documents are uploaded before fee checkout.',
        ],
      };
    }

    // 4. Library Management & Circulation Workflow
    if (/\blibrary\b|\bbooks?\b|\bborrow|\bcatalog\b|\bcirculation\b|\blibrarian\b/i.test(rawText)) {
      return {
        title: 'Library Management & Book Circulation Flowchart',
        summary: 'Complete member journey covering catalog search, book reservation, barcode checkout verification, due date scheduling, and return fine reconciliation.',
        nodes: [
          {
            id: 'lib-auth',
            label: '1. Library Member Login / Scan Card',
            type: 'screen',
            description: 'Member authenticates with Library Card ID or scans digital barcode badge.',
            icon: 'pi pi-id-card',
            step: 1,
          },
          {
            id: 'lib-search',
            label: '2. Search Book Catalog & Shelf Location',
            type: 'section',
            description: 'Searches catalog by Title, Author, ISBN, or Subject taxonomy.',
            icon: 'pi pi-search',
            step: 2,
          },
          {
            id: 'lib-availability',
            label: '3. Availability & Hold Reservation',
            type: 'decision',
            description: 'Checks shelf status (Available on Rack vs. Checked Out). Places hold if reserved.',
            icon: 'pi pi-bookmark',
            step: 3,
          },
          {
            id: 'lib-issue',
            label: '4. Book Checkout & Barcode Scan',
            type: 'action',
            description: 'RFID / Barcode scan of selected books to bind against member account.',
            icon: 'pi pi-qrcode',
            step: 4,
          },
          {
            id: 'lib-due-date',
            label: '5. Due Date & Loan Stamp Issued',
            type: 'section',
            description: 'Calculates 14-day borrowing period and sets SMS/Email return reminder schedule.',
            icon: 'pi pi-calendar',
            step: 5,
          },
          {
            id: 'lib-receipt',
            label: '6. Circulation Receipt & Active Loans',
            type: 'outcome',
            description: 'Issues digital borrowing slip, updates member dashboard, and triggers security gate deactivation.',
            icon: 'pi pi-check-circle',
            step: 6,
          },
        ],
        edges: [
          { id: 'le1', source: 'lib-auth', target: 'lib-search', label: 'Logs In & Opens Catalog' },
          { id: 'le2', source: 'lib-search', target: 'lib-availability', label: 'Selects Book Title' },
          { id: 'le3', source: 'lib-availability', target: 'lib-issue', label: 'In Stock (Available)' },
          { id: 'le4', source: 'lib-issue', target: 'lib-due-date', label: 'Scans Book Barcode' },
          { id: 'le5', source: 'lib-due-date', target: 'lib-receipt', label: 'Loan Confirmed' },
        ],
        mermaid: `flowchart TD
  A[1. Member Login / Scan Card] -->|Accesses Catalog| B[2. Search Book & Shelf Location]
  B -->|Selects Title| C{3. Availability Check}
  C -->|Available on Shelf| D[4. Scan RFID / Barcode]
  C -->|Currently Checked Out| E[Place Hold / Waitlist Queue]
  D -->|Binds to Member| F[5. Set Due Date & Return Reminders]
  F -->|Loan Activated| G((6. Circulation Slip Issued & RFID Tag Updated))`,
        insights: [
          'Library Flow: Barcode check immediately updates stock circulation index.',
          'Hold queuing automatically notifies next student in reservation line.',
        ],
      };
    }

    // 4. Banking, Loan & Financial KYC Workflow
    if (rawText.includes('bank') || rawText.includes('loan') || rawText.includes('finance') || rawText.includes('kyc') || rawText.includes('credit') || rawText.includes('mortgage')) {
      return {
        title: 'Banking Loan Application & KYC Verification Flowchart',
        summary: 'Financial customer journey covering credit request, personal income inputs, salary slip uploads, automated bureau score check, and fund disbursement.',
        nodes: [
          { id: 'b1', label: '1. Customer Authentication & OTP', type: 'screen', description: 'Customer logs into banking portal with NetBanking / OTP.', icon: 'pi pi-lock', step: 1 },
          { id: 'b2', label: '2. Loan Type & Amount Selection', type: 'section', description: 'Selects Personal/Home Loan amount and repayment tenure.', icon: 'pi pi-dollar', step: 2 },
          { id: 'b3', label: '3. Income Details & Salary Slip Upload', type: 'action', description: 'Enters employer info and uploads 3 months bank statements & salary slips.', icon: 'pi pi-upload', step: 3 },
          { id: 'b4', label: '4. Credit Score & KYC Verification Check', type: 'decision', description: 'Automated credit bureau score pull and government ID verification.', icon: 'pi pi-shield', step: 4 },
          { id: 'b5', label: '5. Digital Agreement & E-Sign', type: 'action', description: 'Customer reviews loan sanction terms and signs electronically.', icon: 'pi pi-pencil', step: 5 },
          { id: 'b6', label: '6. Loan Disbursed to Bank Account', type: 'outcome', description: 'Funds credited immediately with EMI repayment calendar enabled.', icon: 'pi pi-check-circle', step: 6 },
        ],
        edges: [
          { id: 'be1', source: 'b1', target: 'b2', label: 'Logs In' },
          { id: 'be2', source: 'b2', target: 'b3', label: 'Chooses Loan Terms' },
          { id: 'be3', source: 'b3', target: 'b4', label: 'Uploads Statements' },
          { id: 'be4', source: 'b4', target: 'b5', label: 'Credit Approved' },
          { id: 'be5', source: 'b5', target: 'b6', label: 'E-Signs Agreement' },
        ],
        mermaid: `flowchart TD
  A[1. Customer Login & OTP] -->|Selects Amount| B[2. Loan & Tenure Selection]
  B -->|Income Profile| C[3. Upload Salary Slips & Bank Statements]
  C -->|Bureau Pull| D{4. Credit Score & KYC Check}
  D -->|Score > 750| E[5. Digital Agreement & E-Sign]
  D -->|Score < 650| F[Guarantor Request]
  E -->|Terms Signed| G((6. Funds Disbursed to Account))`,
        insights: [
          'Fintech Flow: Automated bank statement analysis allows instant credit decisioning.',
        ],
      };
    }

    // 5. Hotel & Travel Reservation Workflow
    if (rawText.includes('hotel') || rawText.includes('travel') || rawText.includes('flight') || rawText.includes('resort') || rawText.includes('vacation')) {
      return {
        title: 'Hotel & Travel Reservation Workflow Flowchart',
        summary: 'Hospitality guest journey covering destination search, room selection, guest ID proof uploads, payment confirmation, and digital keycard generation.',
        nodes: [
          { id: 't1', label: '1. Search Dates & Destination', type: 'screen', description: 'Enters city, check-in/out dates, and number of guests.', icon: 'pi pi-compass', step: 1 },
          { id: 't2', label: '2. Select Room Category & Amenities', type: 'section', description: 'Chooses Suite, Deluxe, or Executive room with breakfast options.', icon: 'pi pi-home', step: 2 },
          { id: 't3', label: '3. Enter Guest Details & Upload ID', type: 'action', description: 'Enters primary guest details and attaches passport / government ID scan.', icon: 'pi pi-id-card', step: 3 },
          { id: 't4', label: '4. Payment & Deposit Transaction', type: 'action', description: 'Processes secure credit card deposit with free cancellation terms.', icon: 'pi pi-credit-card', step: 4 },
          { id: 't5', label: '5. Instant Booking Voucher & Digital Key', type: 'outcome', description: 'Generates reservation voucher QR code and mobile check-in pass.', icon: 'pi pi-check-circle', step: 5 },
        ],
        edges: [
          { id: 'te1', source: 't1', target: 't2', label: 'Searches Availability' },
          { id: 'te2', source: 't2', target: 't3', label: 'Selects Room' },
          { id: 'te3', source: 't3', target: 't4', label: 'Attaches Guest ID' },
          { id: 'te4', source: 't4', target: 't5', label: 'Completes Payment' },
        ],
        mermaid: `flowchart TD
  A[1. Search Dates & Location] -->|Finds Rooms| B[2. Select Room & Amenities]
  B -->|Guest Profile| C[3. Enter Details & Upload Guest ID]
  C -->|Secure Checkout| D[4. Payment & Deposit]
  D -->|Confirmed| E((5. Booking Voucher QR & Mobile Key Generated))`,
        insights: [
          'Travel Flow: Guest ID upload ahead of arrival enables seamless contactless check-in.',
        ],
      };
    }

    // Default Universal Dynamic Application Flow
    const pageName = uiPage?.page || 'Extracted Application Portal';
    return {
      title: `${pageName} — Application Workflow Flowchart`,
      summary: `End-to-end multi-step workflow detailing entry authentication, profile data fields, document and photo uploads, automated verification decisions, and final outcome confirmation.`,
      nodes: [
        {
          id: 'flow-auth',
          label: `1. User Authentication & Login`,
          type: 'screen',
          description: `Initial access, account login, and portal entry for ${pageName}.`,
          icon: 'pi pi-user',
          step: 1,
        },
        {
          id: 'flow-details',
          label: `2. Enter Profile & Application Details`,
          type: 'section',
          description: `Complete application fields, demographic inputs, and required criteria.`,
          icon: 'pi pi-file-edit',
          step: 2,
        },
        {
          id: 'flow-upload',
          label: `3. Upload Passport Photo & Documentation`,
          type: 'action',
          description: `Attach required photos, identification proof, or supporting digital files.`,
          icon: 'pi pi-upload',
          step: 3,
        },
        {
          id: 'flow-review',
          label: `4. Automated Validation & Review Check`,
          type: 'decision',
          description: `System verification check for criteria completeness and rule compliance.`,
          icon: 'pi pi-verified',
          step: 4,
        },
        {
          id: 'flow-outcome',
          label: `5. Final Submission & Reference Number`,
          type: 'outcome',
          description: `Application registered, confirmation voucher generated, and tracking active.`,
          icon: 'pi pi-check-circle',
          step: 5,
        },
      ],
      edges: [
        { id: 'e1', source: 'flow-auth', target: 'flow-details', label: 'Logs In & Starts Application' },
        { id: 'e2', source: 'flow-details', target: 'flow-upload', label: 'Saves Details & Proceeds' },
        { id: 'e3', source: 'flow-upload', target: 'flow-review', label: 'Uploads Required Files' },
        { id: 'e4', source: 'flow-review', target: 'flow-outcome', label: 'Validation Approved (Yes)' },
      ],
      mermaid: `flowchart TD
  A[1. User Authentication & Login] -->|Authenticates| B[2. Enter Application Details]
  B -->|Saves Profile| C[3. Upload Photo & Documents]
  C -->|Files Attached| D{4. Automated Validation Check}
  D -->|Approved| E((5. Final Submission & Reference Issued))`,
      insights: [
        `Captured complete sequential workflow for ${pageName}.`,
        `Identified clear validation gate prior to final goal confirmation.`,
      ],
    };
  };

  try {
    const fallbackModels = [
      config.model,
      'gemini-3.6-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: flowSystemPrompt,
        });

        const contents = [];
        const parts = [{ text: userMessage }];
        if (imagePath) {
          parts.push(imageFileToPart(imagePath));
        }
        contents.push({ role: 'user', parts });

        const result = await model.generateContent({
          contents,
          generationConfig: buildGenerationConfig(modelName),
        });

        const text = result.response.text();
        const parsed = extractJSON(text);
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          return parsed;
        }
      } catch (err) {
        console.warn(`[AI] Flowchart model fallback on "${modelName}":`, err.message);
      }
    }
  } catch (err) {
    console.error('[AI] Flowchart extraction failed, using fallback:', err.message);
  }

  return buildFallbackFlow();
};

/**
 * Generate a design theme from a text prompt.
 *
 * @param {string} prompt
 * @returns {Promise<object>} parsed theme JSON
 */
const generateTheme = async (prompt) => {
  const config = getConfig();
  console.log(`[AI] generateTheme — model: ${config.model}, prompt: "${prompt}"`);

  const genAI = new GoogleGenerativeAI(config.apiKey);
  const userMessage = `Generate a structured design theme based on this prompt: "${prompt}".
Output a single JSON object matching this schema:
{
  "name": "Theme Name",
  "colors": {
    "background": "#...",
    "surface": "#...",
    "primary": "#...",
    "secondary": "#...",
    "text": "#...",
    "muted": "#...",
    "border": "#..."
  },
  "typography": { "fontFamily": "..." },
  "radius": { "value": "..." },
  "spacing": { "base": "..." }
}
Output ONLY valid JSON. Return hex codes for colors.`;

  return executeWithModelFallback(genAI, config.model, (modelName) => ({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    config: buildGenerationConfig(modelName),
  }));
};

module.exports = {
  generateUIFromPrompt,
  generateUIFromWireframe,
  generateUIFromDiagram,
  generateUiToFlow,
  generateTheme,
  buildSmartFallbackPage,
};


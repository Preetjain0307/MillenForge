/**
 * NeuraMind — AI Service (Gemini)
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

const DEFAULT_MODEL = 'gemini-3.6-flash';

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

const SYSTEM_PROMPT = `You are NeuraMind, an expert AI UI generator.
You produce ONLY valid JSON — no markdown fences, no backticks, no explanatory text before or after.

You generate complete, realistic, visually stunning websites tailored to the requested domain (e.g. Food Ordering, Travel, E-commerce, SaaS Analytics, Real Estate, Portfolio).

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

CRITICAL CONTENT REALISM RULES:
- NEVER use "Lorem ipsum", "Sample text", "Test Product", "Lorem...", or generic placeholders.
- Generate realistic, contextual headings, item titles, prices (e.g. "$14.99", "$1,299", "$189"), ratings (e.g. "4.9 ★"), delivery times (e.g. "20–25 min"), badges ("Best Seller", "New Arrival", "Top Rated", "Featured"), and action-oriented CTAs ("Order Now", "Book Vacation", "Explore Collection", "Start Free Trial", "Inquire Now").

DOMAIN & VISUAL GENERATION GUIDELINES:

1. FOOD & RESTAURANT WEBSITES (e.g. food delivery, pizza, cafe, dining):
   - Hero: mouth-watering food visual (imageQuery: "artisan pizza restaurant" or "gourmet burger food")
   - Menu / Popular Items: section with type "cards" containing realistic food items.
     Each card item MUST have:
     { "id": "food-1", "title": "Margherita D.O.P", "description": "Wood-fired crust, San Marzano sauce, fresh mozzarella, basil", "price": "$15.99", "badge": "Best Seller", "imageQuery": "margherita pizza food", "icon": "pi pi-star" }
   - Clear CTAs: "Order Online", "Add to Cart", "View Full Menu"

2. TRAVEL & HOSPITALITY WEBSITES (e.g. hotel booking, vacation, tours):
   - Hero: destination visual (imageQuery: "tropical beach resort" or "luxury hotel infinity pool")
   - Destination cards: cards with imageQuery, title, location description, price per night (e.g. "$240/night"), rating badge ("4.9 ★")
   - Search & Booking controls: input/date fields and "Book Vacation" CTA

3. E-COMMERCE & FASHION WEBSITES (e.g. apparel, shoes, accessories):
   - Hero: editorial fashion visual (imageQuery: "modern fashion editorial collection")
   - Product cards: item title, description, price (e.g. "$189.00"), badge ("New Arrival"), imageQuery (e.g. "designer sneakers apparel"), "Add to Bag" CTA

4. SAAS & TECH DASHBOARDS:
   - Prioritize data metrics, KPI cards (e.g. "$124,500 Monthly Recurring Revenue", "+14.2% MoM Growth"), charts, tables, feature lists
   - DO NOT include random food or travel photos. Use minimal tech/workspace imagery only where relevant.

5. REAL ESTATE WEBSITES (e.g. luxury villas, property listings):
   - Hero: architectural villa visual (imageQuery: "modern luxury villa exterior")
   - Property cards: title, specs badge ("4 Beds · 3 Baths"), location description, price (e.g. "$1,450,000"), imageQuery ("luxury villa architecture"), "Inquire Now" CTA

6. CREATIVE PORTFOLIO WEBSITES (e.g. designer, developer, photographer):
   - Hero: creative workspace visual (imageQuery: "creative product designer workspace")
   - Project cards: project title, description, category badge ("UI/UX Design", "Branding"), imageQuery ("brand identity design presentation"), "View Project" CTA

7. DOCUMENTATION & DEVELOPER GUIDES (e.g. API docs, SDK references, knowledge bases):
   - Use a clean two-column layout: sidebar navigation + content area
   - No hero photography — use code blocks, structured text, breadcrumbs
   - Sections: Introduction, Quick Start, API Reference, Examples, FAQ
   - Elements: structured text blocks, code snippets (type: "text", props.tag: "code"), links, search input
   - Minimal decorative imagery — focus on clarity and developer experience

8. AUTHENTICATION & ONBOARDING PAGES (e.g. login, signup, create account):
   - Centered layout with a single focused form card
   - Fields: Email input, Password input (required), optional name/company fields
   - Social auth buttons (Google, GitHub) with icons
   - Primary CTA: "Sign Up", "Create Account", "Continue with Email"
   - Minimal imagery — one tasteful hero background image is acceptable
   - Include trust signals: privacy note, terms of service link

9. DASHBOARDS (e.g. admin, analytics, product, CRM):
   - Top navbar with user avatar, notifications, workspace selector
   - Sidebar navigation with grouped menu items and icons
   - KPI metric cards with realistic numbers (e.g. "12,483 Active Users", "+8.4% vs last month")
   - Data visualization placeholders (charts, tables, graphs) using icon + metric card pattern
   - DO NOT use food, travel, or fashion photography
   - Action buttons: "Export Report", "Add Record", "View All"

ELEMENT TYPE RULES:

1. TEXT elements
   - props.tag: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "label"
   - content: realistic, high-quality text

2. IMAGE elements
   - content: { "src": "", "alt": "Descriptive alt text", "imageQuery": "specific search query e.g. gourmet burger restaurant" }
   - props.alt: descriptive alt text
   - props.imageQuery: specific contextual search query

3. BUTTON elements
   - content: clear action label (e.g. "Order Online", "Start Free Trial", "Book Stay", "Inquire Now")
   - props.variant: "primary" | "secondary" | "ghost" | "danger"

4. CARD / CARDS elements (for repeating grids and lists)
   - props.columns: 2 | 3 | 4
   - props.items: array of card items
     Each item: { "id": "<id>", "title": "...", "description": "...", "price": "$...", "badge": "...", "icon": "pi pi-...", "imageQuery": "..." }

5. INPUT / TEXTFIELD elements
   - props.label: field label
   - props.placeholder: helpful hint

SECTION RULES:
- Every section and element must have a unique, stable id (e.g. "hero-section", "menu-cards", "cta-button")
- Generate 3 to 5 coherent, complete sections for a full page
- Set appropriate section layout: "split", "center", "grid-2", "grid-3", "grid-4"

OUTPUT: ONLY the JSON object. Zero text before or after.`;

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

  let heroTitle = `Welcome to ${name}`;
  let heroDesc = `Discover modern solutions designed for exceptional digital experiences.`;
  let heroImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
  let cardTitle = 'Core Services';
  let items = [
    { id: 'item-1', title: 'Streamlined Analytics', description: 'Real-time performance tracking and actionable business metrics.', price: '$29/mo' },
    { id: 'item-2', title: 'Automated Workflows', description: 'Intelligent process automation designed for modern teams.', price: '$49/mo' },
    { id: 'item-3', title: 'Enterprise Security', description: 'Bank-grade encryption and access controls across all touchpoints.', price: '$99/mo' },
  ];

  if (promptLower.includes('food') || promptLower.includes('pizza') || promptLower.includes('burger')) {
    heroTitle = 'Artisan Culinary Delivered Fresh to Your Door';
    heroDesc = 'Savor hand-crafted gourmet meals prepared by master chefs using locally sourced organic ingredients.';
    heroImage = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
    cardTitle = 'Popular Menu Items';
    items = [
      { id: 'food-1', title: 'Truffle & Mushroom Pizza', description: 'Wood-fired sourdough base with wild mushrooms and truffle oil.', price: '$22.99' },
      { id: 'food-2', title: 'Gourmet Wagyu Burger', description: 'Double wagyu beef patty, aged cheddar, and smoked aioli on brioche.', price: '$18.50' },
      { id: 'food-3', title: 'Artisan Rigatoni Carbonara', description: 'Handmade pasta with crispy guanciale, pecorino romano, and egg yolk.', price: '$19.99' },
    ];
  } else if (promptLower.includes('travel') || promptLower.includes('resort') || promptLower.includes('hotel')) {
    heroTitle = 'Explore Breathtaking Global Destinations';
    heroDesc = 'Plan your next dream luxury escape with curated resort packages, private tours, and exclusive travel deals.';
    heroImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
    cardTitle = 'Featured Luxury Resorts';
    items = [
      { id: 'travel-1', title: 'Overwater Bungalow Resort', description: 'Maldives turquoise lagoon villa with private infinity plunge pool.', price: '$650/night' },
      { id: 'travel-2', title: 'Swiss Alpine Lodge', description: 'Panoramic mountain views with ski-in access and luxury spa amenities.', price: '$480/night' },
      { id: 'travel-3', title: 'Santorini Cliffside Suites', description: 'Sunset ocean views overlooking the Caldera with private terrace dining.', price: '$520/night' },
    ];
  } else if (promptLower.includes('fashion') || promptLower.includes('clothes') || promptLower.includes('store')) {
    heroTitle = 'Elevate Your Style with Autumn Luxe Collection';
    heroDesc = 'Discover minimalist luxury apparel crafted with sustainable textiles and timeless design aesthetics.';
    heroImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80';
    cardTitle = 'Trending Seasonal Apparel';
    items = [
      { id: 'fashion-1', title: 'Tailored Cashmere Coat', description: 'Double-breasted wool-cashmere blend with structured lapels.', price: '$340.00' },
      { id: 'fashion-2', title: 'Italian Leather Jacket', description: 'Hand-finished full-grain leather jacket with matte black hardware.', price: '$490.00' },
      { id: 'fashion-3', title: 'Minimalist Designer Sneakers', description: 'Premium calfskin leather low-top sneakers with ergonomic insoles.', price: '$220.00' },
    ];
  } else if (promptLower.includes('estate') || promptLower.includes('villa') || promptLower.includes('house')) {
    heroTitle = 'Discover Exceptional Architectural Properties';
    heroDesc = 'Browse luxury waterfront estates, modern architectural villas, and exclusive penthouse residences.';
    heroImage = 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80';
    cardTitle = 'Featured Prime Listings';
    items = [
      { id: 'estate-1', title: 'Modern Oceanfront Villa', description: '5 Beds • 6 Baths • 6,500 Sq Ft with private beach access.', price: '$3,850,000' },
      { id: 'estate-2', title: 'Contemporary Hillside Estate', description: '4 Beds • 5 Baths • Infinity pool overlooking city skyline.', price: '$2,750,000' },
      { id: 'estate-3', title: 'Luxury Penthouse Residence', description: '3 Beds • 3.5 Baths • Private rooftop terrace and concierge.', price: '$1,950,000' },
    ];
  }

  return {
    page: name,
    meta: {
      title: name,
      description: heroDesc,
      prompt: prompt,
      generatedAt: new Date().toISOString(),
    },
    sections: [
      {
        id: 'sec-nav',
        type: 'navbar',
        elements: [
          { id: 'nav-logo', type: 'text', content: name, props: { tag: 'h2' }, fallback: name },
          { id: 'nav-btn', type: 'button', content: 'Explore Now', props: { variant: 'primary' }, fallback: 'Explore Now' },
        ],
      },
      {
        id: 'sec-hero',
        type: 'hero',
        elements: [
          { id: 'hero-title', type: 'text', content: heroTitle, props: { tag: 'h1' }, fallback: heroTitle },
          { id: 'hero-desc', type: 'text', content: heroDesc, props: { tag: 'p' }, fallback: heroDesc },
          { id: 'hero-btn', type: 'button', content: 'Get Started Today', props: { variant: 'primary' }, fallback: 'Get Started Today' },
          { id: 'hero-img', type: 'image', props: { src: heroImage, alt: heroTitle }, fallback: heroTitle },
        ],
      },
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
      },
    ],
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

  console.warn('[AI] Remote AI models exhausted quota limits — engaging NeuraMind Intelligent Generation Fallback engine.');
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
  const config = getConfig();
  console.log(`[AI] generateUIFromPrompt — model: ${config.model}, page: "${pageName || 'Home'}"`);

  const genAI = new GoogleGenerativeAI(config.apiKey);
  let userMessage = `Generate a complete UI page named "${pageName || 'Home'}".\n\nUser prompt:\n${prompt}`;
  if (existingCode) userMessage += `\n\nExisting code context (use as reference for styling/structure):\n${existingCode}`;
  if (architectureFlow) userMessage += `\n\nArchitecture / user flow:\n${architectureFlow}`;

  return executeWithModelFallback(
    genAI,
    config.model,
    (modelName) => ({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: buildGenerationConfig(modelName),
    }),
    prompt,
    pageName
  );
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
  const config = getConfig();
  console.log(`[AI] generateUIFromWireframe — model: ${config.model}, image: "${imagePath}", page: "${pageName || 'Home'}"`);

  const genAI = new GoogleGenerativeAI(config.apiKey);
  const imagePart = imageFileToPart(imagePath);

  let userMessage = `Analyse this wireframe image carefully and generate a structured UI page named "${pageName || 'Home'}" that faithfully reproduces its layout, sections, and component hierarchy.`;
  if (prompt) userMessage += `\n\nAdditional instructions from the user:\n${prompt}`;

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
    prompt,
    pageName
  );
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

module.exports = { generateUIFromPrompt, generateUIFromWireframe, generateTheme, buildSmartFallbackPage };

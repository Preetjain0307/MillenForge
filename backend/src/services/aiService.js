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

  const flowSystemPrompt = `You are NeuraMind Flowchart Architect.
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


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
const executeWithModelFallback = async (genAI, primaryModel, buildRequestFn) => {
  const fallbackModels = [primaryModel, 'gemini-1.5-flash', 'gemini-2.5-flash'].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

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
        err.message.includes('429') ||
        err.message.includes('quota') ||
        err.message.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError && modelName !== fallbackModels[fallbackModels.length - 1]) {
        console.warn(`[AI] Quota/Rate limit hit on "${modelName}" — attempting fallback model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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

  return executeWithModelFallback(genAI, config.model, (modelName) => ({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    config: buildGenerationConfig(modelName),
  }));
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

  return executeWithModelFallback(genAI, config.model, (modelName) => ({
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }, imagePart],
      },
    ],
    config: buildGenerationConfig(modelName),
  }));
};

module.exports = { generateUIFromPrompt, generateUIFromWireframe };

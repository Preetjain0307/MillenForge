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
          "type": "<text|image|button|input|textfield|card|icon|divider|link|list|carousel|wizard|custom>",
          "content": "<the actual content string>",
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

ELEMENT TYPE RULES:

1. TEXT elements
   - Use props.tag: "h1" | "h2" | "h3" | "p" | "span" | "label"
   - Use props.className for optional styling hints

2. IMAGE elements
   - content: a descriptive placeholder URL like "https://placehold.co/600x400?text=Hero+Image"
   - props.alt: descriptive alt text
   - props.width / props.height: optional dimensions

3. BUTTON elements
   - content: the button label
   - props.variant: "primary" | "secondary" | "ghost" | "danger"
   - props.href: optional link target

4. INPUT / TEXTFIELD elements
   - Use type "textfield" for multi-line text areas
   - Use type "input" for single-line fields
   - content: placeholder text
   - props.label: field label
   - props.inputType: "text" | "email" | "password" | "number" | "tel" | "url"
   - props.required: true | false

5. CARD elements (for grid/list cards)
   - Section type should be "cards"
   - Each element of type "card" represents one card
   - props.title: card heading
   - props.description: card body text
   - props.icon: icon name or emoji
   - props.badge: optional badge label
   - props.items: array of loop items (for repeating/list cards)
     Each item: { "id": "<id>", "title": "...", "description": "...", "icon": "..." }

6. CAROUSEL elements
   - Section type "carousel", element type "carousel"
   - props.slides: array of slide objects
     Each slide: { "id": "<id>", "title": "...", "content": "...", "image": "<url>", "caption": "..." }
   - props.autoplay: true | false
   - props.interval: milliseconds between slides (e.g. 3000)

7. WIZARD elements
   - Section type "wizard", element type "wizard"
   - props.steps: array of step objects
     Each step: { "id": "<id>", "title": "...", "description": "...", "fields": [] }
   - props.currentStep: 0-based index of initial step

8. LIST elements
   - content: primary label
   - props.items: array of strings or { "id": "...", "label": "...", "icon": "..." }
   - props.ordered: true | false

9. ICON elements
   - content: icon name (e.g. "pi pi-star", "⭐", or icon identifier)
   - props.size: "sm" | "md" | "lg"

10. DIVIDER elements
    - content: "" (empty)
    - props.style: "solid" | "dashed" | "gradient"

11. LINK elements
    - content: visible link text
    - props.href: destination URL

SECTION RULES:
- Every section must have a unique id (e.g. "hero-01", "features-01", "cards-01")
- Every element must have a unique id (e.g. "hero-title", "feature-card-1")
- Use fictional but realistic content for a modern SaaS/tech product
- NEVER use real brand names, trademarks, or copyrighted content
- Generate at least 3-5 sections for a complete page
- Include responsive layout hints: props.layout ("center" | "left" | "right" | "grid-2" | "grid-3" | "grid-4")
- Include props.background ("white" | "dark" | "gradient" | "subtle") where appropriate

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
const generateUIFromPrompt = async ({ prompt, pageName, existingCode, architectureFlow }) => {
  const config = getConfig();
  console.log(`[AI] generateUIFromPrompt — model: ${config.model}, page: "${pageName || 'Home'}"`);

  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: SYSTEM_PROMPT,
  });

  let userMessage = `Generate a complete UI page named "${pageName || 'Home'}".\n\nUser prompt:\n${prompt}`;
  if (existingCode) userMessage += `\n\nExisting code context (use as reference for styling/structure):\n${existingCode}`;
  if (architectureFlow) userMessage += `\n\nArchitecture / user flow:\n${architectureFlow}`;

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: buildGenerationConfig(config.model),
  });

  const text = result.response.text();
  console.log(`[AI] Raw response length: ${text.length} chars`);
  return extractJSON(text);
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
  const model = genAI.getGenerativeModel({
    model: config.model,
    systemInstruction: SYSTEM_PROMPT,
  });

  const imagePart = imageFileToPart(imagePath);

  let userMessage = `Analyse this wireframe image carefully and generate a structured UI page named "${pageName || 'Home'}" that faithfully reproduces its layout, sections, and component hierarchy.`;
  if (prompt) userMessage += `\n\nAdditional instructions from the user:\n${prompt}`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: userMessage },
          imagePart,
        ],
      },
    ],
    generationConfig: buildGenerationConfig(config.model),
  });

  const text = result.response.text();
  console.log(`[AI] Raw response length: ${text.length} chars`);
  return extractJSON(text);
};

module.exports = { generateUIFromPrompt, generateUIFromWireframe };

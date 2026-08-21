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

const getConfig = () => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not set. Add it to backend/.env');
  }
  return {
    apiKey,
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
  };
};

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are NeuraMind, an AI UI generator. You produce ONLY valid JSON (no markdown, no backticks, no explanation).

Your output must be a single JSON object matching this exact schema:

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
          "fallback": "<safe default content>",
          "props": { }
        }
      ],
      "props": { }
    }
  ],
  "meta": {
    "title": "<page title>",
    "description": "<page description>"
  }
}

Rules:
1. Every section must have a unique "id" (e.g. "hero-01", "features-01").
2. Every element must have a unique "id" (e.g. "hero-title", "feature-card-1").
3. Element "type" tells the renderer what component to use.
4. For "text" elements, use props.tag to indicate "h1","h2","h3","p","span".
5. For "image" elements, put the image URL or placeholder in "content" and "alt" in props.alt.
6. For "button" elements, put the button label in "content".
7. For "card" elements, use props.title, props.description, props.icon.
8. Use props.className for Tailwind CSS classes when useful.
9. Use fictional content only. Never use real brand names.
10. Generate realistic, professional content for a modern SaaS/tech product.
11. Output ONLY the JSON object. No text before or after it.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read an image file and return a Gemini-compatible inline data part.
 */
const imageFileToPart = (filePath) => {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '../../uploads', filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Wireframe file not found: ${filePath}`);
  }

  const data = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase().replace('.', '');
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/png';

  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
};

/**
 * Extract pure JSON from an AI response that may contain markdown fences.
 */
const extractJSON = (text) => {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (_) {
    // Strip markdown fences
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    // Try to find first { ... last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('AI response did not contain valid JSON');
  }
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
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({ model: config.model });

  let userMessage = `Generate a UI page named "${pageName || 'Home'}".\n\nUser prompt:\n${prompt}`;
  if (existingCode) userMessage += `\n\nExisting code context:\n${existingCode}`;
  if (architectureFlow) userMessage += `\n\nArchitecture/flow:\n${architectureFlow}`;

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userMessage }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const text = result.response.text();
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
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({ model: config.model });

  const imagePart = imageFileToPart(imagePath);

  let userMessage = `Analyze this wireframe image and generate a structured UI page named "${pageName || 'Home'}" that matches its layout.`;
  if (prompt) userMessage += `\n\nAdditional instructions:\n${prompt}`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: SYSTEM_PROMPT + '\n\n' + userMessage },
          imagePart,
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const text = result.response.text();
  return extractJSON(text);
};

module.exports = { generateUIFromPrompt, generateUIFromWireframe };

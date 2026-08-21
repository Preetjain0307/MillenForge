// AI service boundary placeholder
// This module defines the clean integration point for future LLM/Vision APIs.
// Replace this stub with real implementations in later tasks.

/**
 * generateUIFromPrompt
 * Future: call an LLM API with the given prompt and return a UIPage structure.
 *
 * @param {object} params
 * @param {string} params.prompt - Natural language description
 * @param {string} [params.existingCode] - Optional existing code context
 * @param {string} [params.architectureFlow] - Optional architecture/flow description
 * @returns {Promise<object>} UIPage structure (see shared types)
 */
const generateUIFromPrompt = async ({ prompt, existingCode, architectureFlow }) => {
  throw new Error('AI service not yet implemented. Awaiting LLM/Vision API integration.');
};

/**
 * generateUIFromWireframe
 * Future: call a Vision API with the wireframe image and return a UIPage structure.
 *
 * @param {object} params
 * @param {string} params.imagePath - Local path to uploaded wireframe image
 * @param {string} [params.prompt] - Optional guiding prompt
 * @returns {Promise<object>} UIPage structure (see shared types)
 */
const generateUIFromWireframe = async ({ imagePath, prompt }) => {
  throw new Error('Vision service not yet implemented. Awaiting LLM/Vision API integration.');
};

module.exports = { generateUIFromPrompt, generateUIFromWireframe };

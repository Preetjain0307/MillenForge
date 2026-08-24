/**
 * NeuraMind — Frontend API Service Layer
 *
 * ALL HTTP calls to the backend must go through this module.
 * Components must NOT scatter fetch/axios calls throughout the app.
 *
 * Base URL is resolved from VITE_API_URL env var or falls back to /api
 * (which is proxied to localhost:5000 by Vite in development).
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 120s — AI generation can take 15-60s
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response interceptor ─────────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Health ───────────────────────────────────────────────────────────────────

/**
 * Check backend health.
 * @returns {Promise<{status: string, database: object}>}
 */
export const checkHealth = () => client.get('/health');

// ─── Generate ─────────────────────────────────────────────────────────────────

/**
 * Submit a generation request.
 * @param {object} payload
 * @param {string} payload.pageName
 * @param {string} [payload.prompt]
 * @param {string} [payload.existingCode]
 * @param {string} [payload.architectureFlow]
 * @returns {Promise<object>}
 */
export const generateUI = (payload) => client.post('/generate', payload);

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a wireframe image.
 * @param {File} file
 * @param {function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<{file: object}>}
 */
export const uploadWireframe = (file, onProgress) => {
  const formData = new FormData();
  formData.append('wireframe', file);

  return client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (evt) => {
          const pct = Math.round((evt.loaded * 100) / (evt.total || 1));
          onProgress(pct);
        }
      : undefined,
  });
};

// ─── Pages ────────────────────────────────────────────────────────────────────

/**
 * Fetch all pages.
 * @returns {Promise<object>}
 */
export const listPages = () => client.get('/pages');

/**
 * Fetch a single page by name.
 * @param {string} pageName
 * @returns {Promise<object>}
 */
export const getPage = (pageName) => client.get(`/pages/${encodeURIComponent(pageName)}`);

// ─── Platform & Diagrams ──────────────────────────────────────────────────────

/**
 * Extract a user navigation & interaction flowchart from UI photo, screenshot, or page schema.
 * @param {object} payload
 * @param {string} [payload.imagePath]
 * @param {object} [payload.uiPage]
 * @param {string} [payload.prompt]
 * @returns {Promise<{success: boolean, flowchart: object}>}
 */
export const generateUiToFlow = (payload) => client.post('/platform/ui-to-flow', payload);

export default client;

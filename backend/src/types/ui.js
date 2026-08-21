/**
 * NeuraMind Backend — Shared Type Definitions (JSDoc)
 *
 * Mirrors the frontend's types/ui.js contract for use in backend services.
 * Kept in sync with frontend/src/types/ui.js
 */

/**
 * @typedef {Object} UIElement
 * @property {string} id
 * @property {'text'|'image'|'button'|'input'|'icon'|'divider'|'custom'} type
 * @property {string} content
 * @property {string} fallback
 * @property {Object} [props]
 */

/**
 * @typedef {Object} UISection
 * @property {string}      id
 * @property {'hero'|'navbar'|'features'|'pricing'|'footer'|'custom'} type
 * @property {UIElement[]} elements
 * @property {Object}      [props]
 */

/**
 * @typedef {Object} UIPage
 * @property {string}      page
 * @property {string}      [id]
 * @property {UISection[]} sections
 * @property {Object}      [meta]
 */

module.exports = {};

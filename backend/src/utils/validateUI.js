/**
 * NeuraMind — UI Structure Validator
 *
 * Lightweight validation for AI-generated UIPage JSON.
 * Ensures the structure is safe for the React renderer before sending to frontend.
 * Does NOT implement the future UI quality/accessibility engine.
 */

const VALID_ELEMENT_TYPES = new Set([
  'text', 'image', 'button', 'input', 'icon', 'divider', 'custom',
  'card', 'cards', 'carousel', 'wizard', 'textfield', 'link', 'list', 'badge',
]);

const VALID_SECTION_TYPES = new Set([
  'hero', 'navbar', 'features', 'pricing', 'footer', 'custom',
  'cards', 'carousel', 'wizard', 'content', 'cta', 'testimonials', 'gallery',
]);

/**
 * Validate a UIElement.
 * Repairs missing fields with safe defaults rather than rejecting.
 *
 * @param {object} el
 * @param {number} index
 * @returns {{ valid: boolean, element: object, warnings: string[] }}
 */
const validateElement = (el, index) => {
  const warnings = [];

  if (!el || typeof el !== 'object') {
    return { valid: false, element: null, warnings: [`Element at index ${index} is not an object`] };
  }

  // Repair missing id
  if (!el.id || typeof el.id !== 'string') {
    el.id = `el-auto-${index}-${Date.now()}`;
    warnings.push(`Element at index ${index}: missing id — auto-generated`);
  }

  // Repair missing type
  if (!el.type || typeof el.type !== 'string') {
    el.type = 'text';
    warnings.push(`Element "${el.id}": missing type — defaulted to "text"`);
  } else if (!VALID_ELEMENT_TYPES.has(el.type)) {
    warnings.push(`Element "${el.id}": unknown type "${el.type}" — will render as custom`);
    // Don't reject — allow the renderer to use a fallback
  }

  // Repair missing content
  if (el.content === undefined || el.content === null) {
    el.content = el.fallback || '';
  }

  // Ensure fallback
  if (!el.fallback) {
    el.fallback = el.content || '';
  }

  // Ensure props is an object
  if (el.props && typeof el.props !== 'object') {
    el.props = {};
    warnings.push(`Element "${el.id}": props was not an object — reset`);
  }

  return { valid: true, element: el, warnings };
};

/**
 * Validate a UISection.
 * @param {object} sec
 * @param {number} index
 * @returns {{ valid: boolean, section: object, warnings: string[] }}
 */
const validateSection = (sec, index) => {
  const warnings = [];

  if (!sec || typeof sec !== 'object') {
    return { valid: false, section: null, warnings: [`Section at index ${index} is not an object`] };
  }

  // Repair id
  if (!sec.id || typeof sec.id !== 'string') {
    sec.id = `sec-auto-${index}-${Date.now()}`;
    warnings.push(`Section at index ${index}: missing id — auto-generated`);
  }

  // Repair type
  if (!sec.type || typeof sec.type !== 'string') {
    sec.type = 'custom';
    warnings.push(`Section "${sec.id}": missing type — defaulted to "custom"`);
  } else if (!VALID_SECTION_TYPES.has(sec.type)) {
    warnings.push(`Section "${sec.id}": unknown type "${sec.type}" — will render as custom`);
  }

  // Ensure elements is an array
  if (!Array.isArray(sec.elements)) {
    sec.elements = [];
    warnings.push(`Section "${sec.id}": elements was not an array — reset to empty`);
  }

  // Validate each element
  const validatedElements = [];
  for (let i = 0; i < sec.elements.length; i++) {
    const result = validateElement(sec.elements[i], i);
    warnings.push(...result.warnings);
    if (result.valid) {
      validatedElements.push(result.element);
    }
  }
  sec.elements = validatedElements;

  // Ensure props is an object
  if (sec.props && typeof sec.props !== 'object') {
    sec.props = {};
  }

  return { valid: true, section: sec, warnings };
};

/**
 * Validate a full UIPage structure.
 *
 * @param {object} page - The raw AI-generated page object
 * @returns {{ valid: boolean, page: object|null, warnings: string[], errors: string[] }}
 */
const validateUIPage = (page) => {
  const warnings = [];
  const errors = [];

  if (!page || typeof page !== 'object') {
    errors.push('AI response is not an object');
    return { valid: false, page: null, warnings, errors };
  }

  // Page name
  if (!page.page || typeof page.page !== 'string') {
    if (page.name && typeof page.name === 'string') {
      page.page = page.name; // common AI variant
    } else {
      page.page = 'Untitled';
      warnings.push('Missing page name — defaulted to "Untitled"');
    }
  }

  // Sections
  if (!Array.isArray(page.sections)) {
    errors.push('page.sections is not an array — cannot render');
    return { valid: false, page: null, warnings, errors };
  }

  if (page.sections.length === 0) {
    warnings.push('Page has no sections');
  }

  // Validate each section
  const validatedSections = [];
  for (let i = 0; i < page.sections.length; i++) {
    const result = validateSection(page.sections[i], i);
    warnings.push(...result.warnings);
    if (result.valid) {
      validatedSections.push(result.section);
    }
  }
  page.sections = validatedSections;

  // Ensure meta is an object
  if (!page.meta || typeof page.meta !== 'object') {
    page.meta = {};
  }

  // Ensure id
  if (!page.id) {
    page.id = `page-${page.page.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  return { valid: true, page, warnings, errors };
};

module.exports = { validateUIPage, validateSection, validateElement };

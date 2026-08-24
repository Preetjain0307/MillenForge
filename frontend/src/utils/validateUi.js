/**
 * NeuraMinds - UIPage Validation Utility
 *
 * Validates an AI-generated UIPage before it reaches the renderer.
 * Does NOT call Gemini, modify Redux, or touch backend.
 *
 * Usage:
 *   import { validateUiPage } from '../utils/validateUi.js';
 *   const result = validateUiPage(pageData);
 *   // { valid: boolean, errors: string[], warnings: string[], score: number }
 *
 * Design principles:
 *   - Errors   = structural problems that will break the renderer.
 *   - Warnings = optional/missing content that degrades quality but is non-fatal.
 *   - Score    = 0-100. Simple deterministic deduction (not ML-based).
 *   - Never reject an entire page for a missing optional field.
 *   - Unknown element types produce a warning, not an error (UIRenderer handles them gracefully).
 */

import { ELEMENT_TYPES, SECTION_TYPES } from '../types/ui.js';
import { resolveDisplayString } from './valueNormalizer.js';

// --- Constants ----------------------------------------------------------------

/**
 * All element types the UIRenderer has an explicit switch case for.
 * Includes types handled by the renderer but not yet in ELEMENT_TYPES constants
 * (card, link, list) to avoid false-positive "unknown type" warnings.
 */
const KNOWN_ELEMENT_TYPES = new Set([
  ...Object.values(ELEMENT_TYPES),
  'card',   // UIRenderer case 'card'
  'link',   // UIRenderer case 'link'
  'list',   // UIRenderer case 'list'
  'textfield', // UIRenderer case 'textfield' (alias for input)
]);

/** All section types recognised by the system. */
const KNOWN_SECTION_TYPES = new Set(Object.values(SECTION_TYPES));

// --- Scoring weights ----------------------------------------------------------
// Each deduction is applied once per occurrence; total is capped at 100.

const SCORE_DEDUCTIONS = {
  missingPageName:     10,
  missingSections:     20,
  missingSectionId:     5,
  invalidSectionType:   2,
  missingElements:      5,
  missingElementId:     3,
  missingElementType:   5,
  unknownElementType:   1,
  missingContent:       2,
  missingImageAlt:      2,
  missingButtonLabel:   3,
  missingInputHint:     1,
  emptyCardList:        3,
};

// --- Helper guards ------------------------------------------------------------

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isArray          = (v) => Array.isArray(v);

// --- Element Validation -------------------------------------------------------

/**
 * Validate a single UIElement.
 *
 * @param {object}  element
 * @param {string}  sectionRef - Human-readable section reference for messages.
 * @param {number}  index      - Element index within section.
 * @returns {{ errors: string[], warnings: string[], deduction: number }}
 */
function validateElement(element, sectionRef, index) {
  const errors   = [];
  const warnings = [];
  let deduction  = 0;

  if (!element || typeof element !== 'object') {
    errors.push(`${sectionRef} > element[${index}]: not a valid object.`);
    deduction += SCORE_DEDUCTIONS.missingElementType + SCORE_DEDUCTIONS.missingElementId;
    return { errors, warnings, deduction };
  }

  const ref = `${sectionRef} > "${element.id || `element[${index}]`}"`;

  // ID
  if (!isNonEmptyString(element.id)) {
    errors.push(`${ref}: missing or empty element id.`);
    deduction += SCORE_DEDUCTIONS.missingElementId;
  }

  // Type
  if (!isNonEmptyString(element.type)) {
    errors.push(`${ref}: missing element type.`);
    deduction += SCORE_DEDUCTIONS.missingElementType;
    return { errors, warnings, deduction };
  }

  const type      = element.type.toLowerCase().trim();
  const props     = (element.props && typeof element.props === 'object' && !Array.isArray(element.props)) ? element.props : {};
  const content   = element.content;
  const fallback  = element.fallback;
  const strContent  = resolveDisplayString(content, '');
  const strFallback = resolveDisplayString(fallback, '');
  const hasContent  = strContent.trim().length > 0;
  const hasFallback = strFallback.trim().length > 0;
  const usableText  = hasContent ? strContent : hasFallback ? strFallback : (typeof props.label === 'string' && props.label.trim().length > 0 ? props.label : null);

  // Unknown type
  if (!KNOWN_ELEMENT_TYPES.has(type)) {
    warnings.push(`${ref}: unknown element type "${type}" - will render as placeholder.`);
    deduction += SCORE_DEDUCTIONS.unknownElementType;
  }

  // IMAGE: must have alt text
  if (type === 'image') {
    if (!isNonEmptyString(props.alt) && !hasFallback) {
      warnings.push(`${ref}: image has no alt text (props.alt) and no fallback - accessibility risk.`);
      deduction += SCORE_DEDUCTIONS.missingImageAlt;
    }
  }

  // BUTTON: must have a usable label
  if (type === 'button') {
    if (!usableText) {
      errors.push(`${ref}: button has no content or fallback label - will render as an empty button.`);
      deduction += SCORE_DEDUCTIONS.missingButtonLabel;
    }
  }

  // INPUT / TEXTFIELD: should have label or placeholder
  if (type === 'input' || type === 'textfield') {
    if (!usableText && !isNonEmptyString(props.label) && !isNonEmptyString(props.placeholder)) {
      warnings.push(`${ref}: input/textfield has no content, label, or placeholder hint.`);
      deduction += SCORE_DEDUCTIONS.missingInputHint;
    }
  }

  // TEXT / LINK: warn if both content and fallback are absent
  if ((type === 'text' || type === 'link') && !hasContent && !hasFallback) {
    warnings.push(`${ref}: "${type}" element has no content or fallback - will render empty.`);
    deduction += SCORE_DEDUCTIONS.missingContent;
  }

  // CARD: check for any renderable data
  if (type === 'card') {
    const hasItems      = isArray(props.items) && props.items.length > 0;
    const hasCardContent = isNonEmptyString(props.title) || isNonEmptyString(props.description) || hasContent;
    if (!hasItems && !hasCardContent) {
      warnings.push(`${ref}: card has no title, description, content, or items - will render empty.`);
      deduction += SCORE_DEDUCTIONS.emptyCardList;
    }
  }

  // LIST: check items are present
  if (type === 'list') {
    const hasListItems = isArray(props.items) && props.items.length > 0;
    if (!hasListItems && !hasContent) {
      warnings.push(`${ref}: list has no items array and no content string - will render empty list.`);
      deduction += SCORE_DEDUCTIONS.emptyCardList;
    }
  }

  return { errors, warnings, deduction };
}

// --- Section Validation -------------------------------------------------------

/**
 * Validate a single UISection.
 *
 * @param {object} section
 * @param {number} index
 * @returns {{ errors: string[], warnings: string[], deduction: number }}
 */
function validateSection(section, index) {
  const errors   = [];
  const warnings = [];
  let deduction  = 0;

  if (!section || typeof section !== 'object') {
    errors.push(`sections[${index}]: not a valid object.`);
    deduction += SCORE_DEDUCTIONS.missingSectionId + SCORE_DEDUCTIONS.missingElements;
    return { errors, warnings, deduction };
  }

  const sectionRef = `section "${section.id || `[${index}]`}"`;

  // ID
  if (!isNonEmptyString(section.id)) {
    errors.push(`${sectionRef}: missing or empty section id.`);
    deduction += SCORE_DEDUCTIONS.missingSectionId;
  }

  // Type
  if (isNonEmptyString(section.type) && !KNOWN_SECTION_TYPES.has(section.type.toLowerCase())) {
    warnings.push(`${sectionRef}: unknown section type "${section.type}" - will still render.`);
    deduction += SCORE_DEDUCTIONS.invalidSectionType;
  }

  // Elements
  if (!isArray(section.elements)) {
    errors.push(`${sectionRef}: "elements" is missing or not an array.`);
    deduction += SCORE_DEDUCTIONS.missingElements;
    return { errors, warnings, deduction };
  }

  if (section.elements.length === 0) {
    warnings.push(`${sectionRef}: has no elements (empty section).`);
  }

  for (let i = 0; i < section.elements.length; i++) {
    const r = validateElement(section.elements[i], sectionRef, i);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    deduction += r.deduction;
  }

  return { errors, warnings, deduction };
}

// --- Page Validation ----------------------------------------------------------

/**
 * Validate a complete UIPage object.
 *
 * @param {unknown} pageData - The raw value from the AI/Redux result.
 * @returns {{
 *   valid:    boolean,
 *   errors:   string[],
 *   warnings: string[],
 *   score:    number,
 * }}
 */
export function validateUiPage(pageData) {
  const errors   = [];
  const warnings = [];
  let totalDeduction = 0;

  // Null / non-object guard
  if (pageData === null || pageData === undefined) {
    errors.push('Page data is null or undefined - no UI can be rendered.');
    return { valid: false, errors, warnings, score: 0 };
  }

  if (typeof pageData !== 'object' || Array.isArray(pageData)) {
    errors.push(`Page data is not a plain object (received ${Array.isArray(pageData) ? 'array' : typeof pageData}).`);
    return { valid: false, errors, warnings, score: 0 };
  }

  // Page name
  if (!isNonEmptyString(pageData.page)) {
    warnings.push('Page is missing the "page" name field - will be treated as "Untitled".');
    totalDeduction += SCORE_DEDUCTIONS.missingPageName;
  }

  // Sections array
  if (!isArray(pageData.sections)) {
    errors.push('Page "sections" is missing or not an array - nothing can be rendered.');
    totalDeduction += SCORE_DEDUCTIONS.missingSections;
    return { valid: false, errors, warnings, score: Math.max(0, 100 - totalDeduction) };
  }

  if (pageData.sections.length === 0) {
    warnings.push('Page has zero sections - the renderer will show an empty state.');
  }

  // Validate each section
  for (let i = 0; i < pageData.sections.length; i++) {
    const r = validateSection(pageData.sections[i], i);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    totalDeduction += r.deduction;
  }

  const score = Math.max(0, 100 - totalDeduction);
  const valid = errors.length === 0;

  return { valid, errors, warnings, score };
}

/**
 * Convenience: returns true only if the UIPage passes validation with no errors.
 *
 * @param {unknown} pageData
 * @returns {boolean}
 */
export function isValidUiPage(pageData) {
  return validateUiPage(pageData).valid;
}

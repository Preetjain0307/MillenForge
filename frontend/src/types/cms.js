/**
 * NeuraMind – CMS Data Contract & Binding Foundation
 *
 * Provides a clean architecture for CMS-bound generated UI elements
 * and reusable repeating components (e.g. loops for cards/lists).
 *
 * Concept:
 *   Element (Structure/Schema)
 *     ↓
 *   Element ID (Stable Key)
 *     ↓
 *   Content/Data (Separated CMS payload or repeat items)
 *     ↓
 *   Rendered Component (Presentation)
 */

import { ELEMENT_TYPES, createElement } from './ui.js';
import { resolveDisplayString } from '../utils/valueNormalizer.js';

/**
 * @typedef {string | {
 *   text?: string,
 *   title?: string,
 *   subtitle?: string,
 *   label?: string,
 *   description?: string,
 *   src?: string,
 *   alt?: string,
 *   placeholder?: string,
 *   href?: string,
 *   [key: string]: any
 * }} CmsContent
 */

/**
 * @typedef {Object} CmsRepeatingItem
 * @property {string} id              - Stable item ID (e.g. "card-1")
 * @property {string} [title]         - Primary item title
 * @property {string} [description]   - Primary item description/subtitle
 * @property {string} [content]       - Generic text content
 * @property {string} [icon]          - Icon name/class e.g. "pi pi-bolt"
 * @property {string} [badge]         - Chip/badge text e.g. "New"
 * @property {string} [src]           - Image/media URL
 * @property {string} [alt]           - Alt text for media
 * @property {string} [href]          - Destination link
 * @property {Object} [props]         - Additional presentation props
 */

/**
 * @typedef {Object} CmsElement
 * @property {string} id                    - Unique stable element ID (e.g. "hero-title")
 * @property {string} type                  - Element type (e.g. "text", "image", "button", "cards")
 * @property {CmsContent} [content]         - CMS content payload (string or structured object)
 * @property {string} [fallback]            - Default fallback text if content is absent
 * @property {CmsRepeatingItem[]} [items]   - Data array for repeating loop components
 * @property {Object} [props]               - Presentation properties (styles, variant, layout)
 * @property {Object} [meta]                - Optional CMS field metadata (label, fieldType)
 */

/**
 * @typedef {Record<string, CmsContent | CmsRepeatingItem[] | { content?: CmsContent, items?: CmsRepeatingItem[], fallback?: string, props?: Object }>} CmsDataMap
 */

// ─── RESOLVERS & CONVERTERS ──────────────────────────────────────────────────

/**
 * Safely resolve display content from string, object, or fallback.
 *
 * @param {CmsContent | undefined | null} content - CMS content value (string or object)
 * @param {string} [fallback='']                  - Fallback content
 * @param {string} [preferredKey='text']          - Preferred object key if content is object
 * @returns {string}
 */
export const resolveCmsContent = (content, fallback = '', preferredKey = 'text') => {
  return resolveDisplayString(content, fallback, preferredKey);
};

/**
 * Normalizes a CMS-structured element into a canonical UIElement for rendering & validation.
 * Ensures backward compatibility with UIRenderer, PreviewPage, and validators.
 *
 * @param {Partial<CmsElement>} raw
 * @returns {import('./ui.js').UIElement & { items?: CmsRepeatingItem[] }}
 */
export const normalizeToUiElement = (raw = {}) => {
  const safeRaw = (raw && typeof raw === 'object') ? raw : {};
  const elementId = typeof safeRaw.id === 'string' && safeRaw.id.trim() !== '' ? safeRaw.id.trim() : `el-${Date.now()}`;
  const type = typeof safeRaw.type === 'string' ? safeRaw.type.toLowerCase().trim() : ELEMENT_TYPES.TEXT;
  const fallback = typeof safeRaw.fallback === 'string' ? safeRaw.fallback : '';

  // Extract string content suitable for canonical UIElement
  const stringContent = resolveCmsContent(safeRaw.content, fallback);

  // Extract repeating items if provided
  const items = Array.isArray(safeRaw.items)
    ? safeRaw.items
    : (Array.isArray(safeRaw.props?.items) ? safeRaw.props.items : undefined);

  // Merge presentation props
  const baseProps = (safeRaw.props && typeof safeRaw.props === 'object') ? { ...safeRaw.props } : {};
  if (items) {
    baseProps.items = items;
  }

  // Preserve structured content in props for CMS-aware consumers
  if (safeRaw.content && typeof safeRaw.content === 'object') {
    baseProps.cmsContent = safeRaw.content;
    if (safeRaw.content.src && !baseProps.src) baseProps.src = safeRaw.content.src;
    if (safeRaw.content.alt && !baseProps.alt) baseProps.alt = safeRaw.content.alt;
    if (safeRaw.content.label && !baseProps.label) baseProps.label = safeRaw.content.label;
    if (safeRaw.content.title && !baseProps.title) baseProps.title = safeRaw.content.title;
    if (safeRaw.content.placeholder && !baseProps.placeholder) baseProps.placeholder = safeRaw.content.placeholder;
  }

  const result = createElement({
    id: elementId,
    type,
    content: stringContent,
    fallback,
    props: baseProps,
  });

  if (items) {
    result.items = items;
  }

  return result;
};

/**
 * Extracts a decoupled CMS Data Map from any UIPage structure.
 * Keys are stable Element IDs; values are content payloads or repeating item arrays.
 *
 * @param {import('./ui.js').UIPage} uiPage
 * @returns {CmsDataMap}
 */
export const extractCmsData = (uiPage) => {
  const dataMap = {};
  if (!uiPage || !Array.isArray(uiPage.sections)) return dataMap;

  for (const section of uiPage.sections) {
    if (!section || !Array.isArray(section.elements)) continue;
    for (const el of section.elements) {
      if (!el || !el.id) continue;

      const items = Array.isArray(el.items) ? el.items : (Array.isArray(el.props?.items) ? el.props.items : null);
      if (items) {
        dataMap[el.id] = items;
      } else if (el.props?.cmsContent) {
        dataMap[el.id] = el.props.cmsContent;
      } else {
        dataMap[el.id] = {
          text: el.content || '',
          fallback: el.fallback || '',
        };
      }
    }
  }

  return dataMap;
};

/**
 * Pure function: Binds updated CMS data back into a UIPage structure by matching Element IDs.
 *
 * @param {import('./ui.js').UIPage} uiPage
 * @param {CmsDataMap} cmsDataMap
 * @returns {import('./ui.js').UIPage} Cloned UIPage with bound CMS data
 */
export const bindCmsData = (uiPage, cmsDataMap = {}) => {
  if (!uiPage || typeof uiPage !== 'object') return uiPage;
  if (!Array.isArray(uiPage.sections)) return { ...uiPage };

  return {
    ...uiPage,
    sections: uiPage.sections.map((section) => {
      if (!section || !Array.isArray(section.elements)) return section;

      return {
        ...section,
        elements: section.elements.map((el) => {
          if (!el || !el.id || !(el.id in cmsDataMap)) return el;

          const update = cmsDataMap[el.id];

          // Case 1: Updating repeating items array
          if (Array.isArray(update)) {
            return {
              ...el,
              items: update,
              props: {
                ...(el.props || {}),
                items: update,
              },
            };
          }

          // Case 2: Updating with a string
          if (typeof update === 'string') {
            return {
              ...el,
              content: update,
            };
          }

          // Case 3: Updating with a structured object
          if (update && typeof update === 'object') {
            const preferredKey = el.type === 'image' ? 'src' : (el.type === 'button' ? 'label' : (el.type === 'card' ? 'description' : 'text'));
            const newContent = resolveCmsContent(update, el.fallback || '', preferredKey);
            const newProps = { ...(el.props || {}) };
            if (update.items && Array.isArray(update.items)) {
              newProps.items = update.items;
            }
            if (update.src !== undefined) newProps.src = update.src;
            if (update.alt !== undefined) newProps.alt = update.alt;
            if (update.label !== undefined) newProps.label = update.label;
            if (update.title !== undefined) newProps.title = update.title;
            if (update.placeholder !== undefined) newProps.placeholder = update.placeholder;
            if (update.variant !== undefined) newProps.variant = update.variant;
            if (update.props && typeof update.props === 'object') {
              Object.assign(newProps, update.props);
            }
            return {
              ...el,
              content: newContent,
              fallback: update.fallback !== undefined ? update.fallback : el.fallback,
              items: Array.isArray(update.items) ? update.items : el.items,
              props: {
                ...newProps,
                cmsContent: update,
              },
            };
          }

          return el;
        }),
      };
    }),
  };
};

/**
 * Pure function: Updates a single element's content immutably by matching Element ID.
 * Returns updated UI data without mutating the original state.
 *
 * @param {import('./ui.js').UIPage} page - The source UIPage
 * @param {string} elementId               - Target element ID
 * @param {CmsContent | CmsRepeatingItem[] | string} newContent - New content string, object, or items array
 * @returns {import('./ui.js').UIPage}     - New UIPage with updated element content
 */
export const updateElementContent = (page, elementId, newContent) => {
  if (!page || typeof page !== 'object') return page;
  if (!elementId) return page;
  return bindCmsData(page, { [elementId]: newContent });
};

/**
 * Pure function: Finds an element in a UIPage by its stable ID.
 *
 * @param {import('./ui.js').UIPage} page - The source UIPage
 * @param {string} elementId               - Target element ID
 * @returns {import('./ui.js').UIElement | null}
 */
export const findElementById = (page, elementId) => {
  if (!page || !Array.isArray(page.sections) || !elementId) return null;
  for (const section of page.sections) {
    if (!section || !Array.isArray(section.elements)) continue;
    for (const el of section.elements) {
      if (el && el.id === elementId) return el;
    }
  }
  return null;
};

/**
 * Pure function: Reads element content and metadata by stable ID.
 *
 * @param {import('./ui.js').UIPage} page - The source UIPage
 * @param {string} elementId               - Target element ID
 * @returns {{ id: string, type: string, content: any, fallback: string, items?: any[], props?: object } | null}
 */
export const getElementContent = (page, elementId) => {
  const el = findElementById(page, elementId);
  if (!el) return null;
  return {
    id: el.id,
    type: el.type,
    content: el.content,
    fallback: el.fallback,
    items: el.items || el.props?.items,
    props: el.props,
  };
};

/**
 * Pure function: Updates a single item within a repeating element's items array immutably.
 *
 * @param {import('./ui.js').UIPage} page     - The source UIPage
 * @param {string} elementId                   - Target repeating element ID (e.g. "feature-cards")
 * @param {string} itemId                      - Target item ID (e.g. "card-1")
 * @param {object | string} updatedItemData   - Updated item properties or content string
 * @returns {import('./ui.js').UIPage}         - New UIPage with updated repeating item
 */
export const updateRepeatingItem = (page, elementId, itemId, updatedItemData) => {
  if (!page || typeof page !== 'object' || !elementId || !itemId) return page;

  const el = findElementById(page, elementId);
  if (!el) return page;

  const currentItems = Array.isArray(el.items) ? el.items : (Array.isArray(el.props?.items) ? el.props.items : []);
  const nextItems = currentItems.map((item) => {
    if (item && item.id === itemId) {
      return typeof updatedItemData === 'object' && updatedItemData !== null
        ? { ...item, ...updatedItemData }
        : { ...item, content: updatedItemData };
    }
    return item;
  });

  return updateElementContent(page, elementId, nextItems);
};

/**
 * Creates a CMS Element with guaranteed stable structure and defaults.
 *
 * @param {Partial<CmsElement>} overrides
 * @returns {CmsElement}
 */
export const createCmsElement = (overrides = {}) => ({
  id: overrides.id || `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  type: overrides.type || ELEMENT_TYPES.TEXT,
  content: overrides.content !== undefined ? overrides.content : '',
  fallback: overrides.fallback || '',
  items: overrides.items || (overrides.props?.items ? overrides.props.items : undefined),
  props: overrides.props || {},
  meta: overrides.meta || {},
  ...overrides,
});

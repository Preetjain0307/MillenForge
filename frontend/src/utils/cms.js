/**
 * NeuraMindss — CMS Utilities & Stable ID Management
 *
 * Helpers for ID stabilization, content fallback resolution,
 * and CMS data lifecycle operations.
 */

import { ELEMENT_TYPES } from '../types/ui.js';
import { slugify } from './helpers.js';

/**
 * Generate a deterministic, human-readable stable ID.
 * Example: generateStableId('features', 'card', 0) -> "features-card-0"
 *
 * @param {...(string | number)} parts
 * @returns {string}
 */
export const generateStableId = (...parts) => {
  return parts
    .filter((p) => p !== undefined && p !== null && p !== '')
    .map((p) => slugify(String(p)))
    .join('-');
};

/**
 * Ensures all sections, elements, and repeating items in a UIPage
 * have deterministic, stable IDs suitable for CMS keying.
 *
 * @param {import('../types/ui.js').UIPage} uiPage
 * @returns {import('../types/ui.js').UIPage}
 */
export const ensureStableIds = (uiPage) => {
  if (!uiPage || typeof uiPage !== 'object') return uiPage;

  const pageSlug = slugify(uiPage.page || uiPage.id || 'page');
  const pageId = uiPage.id && !uiPage.id.startsWith('page-') ? uiPage.id : generateStableId('page', pageSlug);

  const sections = Array.isArray(uiPage.sections)
    ? uiPage.sections.map((section, sIdx) => {
        if (!section) return section;

        const secType = section.type || 'section';
        const sectionId = section.id && !section.id.startsWith('sec-')
          ? section.id
          : generateStableId(secType, sIdx + 1);

        const elements = Array.isArray(section.elements)
          ? section.elements.map((el, eIdx) => {
              if (!el) return el;

              const elType = el.type || 'element';
              const elementId = el.id && !el.id.startsWith('el-') && !el.id.startsWith('repeat-')
                ? el.id
                : generateStableId(sectionId, elType, eIdx);

              let items = el.items;
              let propsItems = el.props?.items;

              // Stabilize repeating item IDs
              if (Array.isArray(items)) {
                items = items.map((item, itemIdx) => ({
                  ...item,
                  id: item.id || generateStableId(elementId, 'item', itemIdx + 1),
                }));
              }
              if (Array.isArray(propsItems)) {
                propsItems = propsItems.map((item, itemIdx) => ({
                  ...item,
                  id: item.id || generateStableId(elementId, 'item', itemIdx + 1),
                }));
              }

              return {
                ...el,
                id: elementId,
                items: items || propsItems,
                props: {
                  ...(el.props || {}),
                  ...(propsItems ? { items: propsItems } : {}),
                },
              };
            })
          : [];

        return {
          ...section,
          id: sectionId,
          elements,
        };
      })
    : [];

  return {
    ...uiPage,
    id: pageId,
    sections,
  };
};

/**
 * Returns default fallback content structure for any given element type.
 *
 * @param {string} type - Element type
 * @returns {object} Default content & fallback values
 */
export const getDefaultCmsContent = (type) => {
  const normType = String(type).toLowerCase().trim();

  switch (normType) {
    case ELEMENT_TYPES.TEXT:
      return {
        content: { text: 'Default text content' },
        fallback: 'Default text content',
        props: { tag: 'p' },
      };

    case ELEMENT_TYPES.IMAGE:
      return {
        content: {
          src: 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image',
          alt: 'Default placeholder image',
        },
        fallback: 'Placeholder image',
        props: {},
      };

    case ELEMENT_TYPES.BUTTON:
      return {
        content: { label: 'Click here' },
        fallback: 'Click here',
        props: { variant: 'primary' },
      };

    case ELEMENT_TYPES.INPUT:
    case ELEMENT_TYPES.TEXTFIELD:
      return {
        content: { label: 'Input field', placeholder: 'Enter text...' },
        fallback: 'Input field',
        props: { inputType: 'text' },
      };

    case ELEMENT_TYPES.CARDS:
      return {
        content: '',
        fallback: 'No card items',
        items: [
          {
            id: 'card-1',
            title: 'Card 1',
            description: 'Description for card 1',
            icon: 'pi pi-bolt',
          },
          {
            id: 'card-2',
            title: 'Card 2',
            description: 'Description for card 2',
            icon: 'pi pi-check',
          },
        ],
        props: { columns: 2 },
      };

    case ELEMENT_TYPES.CAROUSEL:
      return {
        content: '',
        fallback: 'No carousel slides',
        items: [
          {
            id: 'slide-1',
            title: 'Slide 1',
            description: 'Slide 1 description',
            src: 'https://placehold.co/800x400/1a1a2e/6c63ff?text=Slide+1',
          },
        ],
        props: {},
      };

    default:
      return {
        content: '',
        fallback: '',
        props: {},
      };
  }
};

export {
  updateElementContent,
  updateRepeatingItem,
  findElementById,
  getElementContent,
  bindCmsData,
  extractCmsData,
  resolveCmsContent,
  normalizeToUiElement,
} from '../types/cms.js';

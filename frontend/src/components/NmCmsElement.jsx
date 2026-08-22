/**
 * NmCmsElement — CMS-Bound Reusable UI Element
 *
 * Implements the architecture:
 *   Element (Schema/Type)
 *     ↓
 *   Element ID (Stable Key)
 *     ↓
 *   Content/Data (Separated CMS Data or Dynamic Props)
 *     ↓
 *   Rendered Component (Atomic React Component)
 */

import { ELEMENT_TYPES } from '../types/ui.js';
import { resolveCmsContent } from '../types/cms.js';
import NmButton from './NmButton.jsx';
import NmInput from './NmInput.jsx';
import NmCard from './NmCard.jsx';
import NmRepeatingGrid from './NmRepeatingGrid.jsx';

/**
 * @param {object} props
 * @param {import('../types/cms.js').CmsElement} props.element - Element contract definition
 * @param {import('../types/cms.js').CmsContent | import('../types/cms.js').CmsRepeatingItem[]} [props.cmsData] - Optional direct CMS data override
 * @param {string} [props.className] - Optional container className
 */
const NmCmsElement = ({ element, cmsData, className = '' }) => {
  if (!element || typeof element !== 'object') return null;

  const id = element.id || 'cms-element';
  const type = (element.type || ELEMENT_TYPES.TEXT).toLowerCase().trim();
  const fallback = element.fallback || '';
  const baseProps = element.props || {};

  // Active content prioritizing CMS data override > element content > fallback
  const activeContentSource = cmsData !== undefined ? cmsData : element.content;

  switch (type) {
    // ─── 1. TEXT ────────────────────────────────────────────────────────────
    case ELEMENT_TYPES.TEXT: {
      const text = resolveCmsContent(activeContentSource, fallback, 'text');
      const ALLOWED_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'label', 'strong', 'em'];
      const Tag = ALLOWED_TAGS.includes(baseProps.tag) ? baseProps.tag : 'p';

      return (
        <Tag
          id={id}
          className={`${baseProps.className || 'text-[var(--nm-text-primary)] leading-relaxed'} ${className}`}
        >
          {text || <span className="text-[var(--nm-text-muted)] italic">(empty)</span>}
        </Tag>
      );
    }

    // ─── 2. IMAGE ───────────────────────────────────────────────────────────
    case ELEMENT_TYPES.IMAGE: {
      let src = '';
      let alt = fallback || 'Image';

      if (typeof activeContentSource === 'string' && activeContentSource.trim() !== '') {
        src = activeContentSource;
      } else if (activeContentSource && typeof activeContentSource === 'object') {
        src = activeContentSource.src || activeContentSource.url || '';
        alt = activeContentSource.alt || activeContentSource.title || alt;
      }

      if (!src) {
        src = baseProps.src || 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image';
      }
      if (baseProps.alt) alt = baseProps.alt;

      return (
        <img
          id={id}
          src={src}
          alt={alt}
          className={`max-w-full rounded-[var(--nm-radius-sm)] object-cover ${baseProps.className || ''} ${className}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/600x400/1a1a2e/6c63ff?text=Image+Error';
          }}
        />
      );
    }

    // ─── 3. BUTTON ──────────────────────────────────────────────────────────
    case ELEMENT_TYPES.BUTTON: {
      const label = resolveCmsContent(activeContentSource, fallback || 'Button', 'label');

      return (
        <NmButton
          id={id}
          variant={baseProps.variant || 'primary'}
          label={label}
          icon={baseProps.icon}
          className={`${baseProps.className || ''} ${className}`}
          aria-label={baseProps['aria-label'] || label}
          onClick={baseProps.onClick || (() => {})}
          type={baseProps.type || 'button'}
        />
      );
    }

    // ─── 4. INPUT / TEXTFIELD ───────────────────────────────────────────────
    case ELEMENT_TYPES.INPUT:
    case ELEMENT_TYPES.TEXTFIELD: {
      let label = baseProps.label;
      let placeholder = baseProps.placeholder;

      if (typeof activeContentSource === 'string') {
        placeholder = placeholder || activeContentSource;
      } else if (activeContentSource && typeof activeContentSource === 'object') {
        label = activeContentSource.label || label;
        placeholder = activeContentSource.placeholder || placeholder;
      }

      label = label || fallback || 'Field';

      return (
        <NmInput
          id={id}
          label={label}
          placeholder={placeholder || label}
          className={`${baseProps.className || ''} ${className}`}
          multiline={Boolean(baseProps.multiline)}
          disabled={Boolean(baseProps.disabled)}
        />
      );
    }

    // ─── 5. CARDS (REPEATING LOOP) ──────────────────────────────────────────
    case ELEMENT_TYPES.CARDS: {
      const items = Array.isArray(activeContentSource)
        ? activeContentSource
        : (Array.isArray(element.items) ? element.items : (Array.isArray(baseProps.items) ? baseProps.items : []));

      return (
        <NmRepeatingGrid
          id={id}
          items={items}
          columns={baseProps.columns || 3}
          fallback={fallback || 'No card items available'}
          className={`${baseProps.className || ''} ${className}`}
        />
      );
    }

    // ─── 6. SINGLE CARD ─────────────────────────────────────────────────────
    case ELEMENT_TYPES.CARD: {
      let title = baseProps.title;
      let description = baseProps.description;

      if (typeof activeContentSource === 'string') {
        description = activeContentSource;
      } else if (activeContentSource && typeof activeContentSource === 'object') {
        title = activeContentSource.title || title;
        description = activeContentSource.description || activeContentSource.text || description;
      }

      return (
        <NmCard
          title={title}
          subtitle={baseProps.subtitle}
          className={`${baseProps.className || ''} ${className}`}
        >
          {description && (
            <p className="text-sm text-[var(--nm-text-secondary)] leading-relaxed">{description}</p>
          )}
        </NmCard>
      );
    }

    // ─── DEFAULT / FALLBACK ─────────────────────────────────────────────────
    default: {
      const text = resolveCmsContent(activeContentSource, fallback);
      return (
        <div id={id} className={`nm-element nm-element--${type} ${className}`}>
          {text}
        </div>
      );
    }
  }
};

export default NmCmsElement;

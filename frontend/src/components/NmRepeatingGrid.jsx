/**
 * NmRepeatingGrid — Reusable Repeating Loop Component
 *
 * Implements the requirement for repeating collections to use proper data arrays
 * and loops with safe value normalization and card image support.
 */

import NmCard from './NmCard.jsx';
import { resolveDisplayString } from '../utils/valueNormalizer.js';

/**
 * @typedef {Object} RepeatingItem
 * @property {string} id             - Stable item identifier
 * @property {string|object} [title]        - Item title
 * @property {string|object} [description]  - Item description/subtitle
 * @property {string|object} [content]      - Fallback or generic text content
 * @property {string} [icon]         - PrimeIcons icon name (e.g. "pi pi-bolt")
 * @property {string} [badge]        - Badge or chip label
 * @property {string} [price]        - Item price e.g. "$14.99"
 * @property {string} [src]          - Item image URL
 * @property {string} [image]        - Alternative image URL
 * @property {string} [alt]          - Image alt text
 * @property {string} [className]    - Optional custom card styling
 */

/**
 * @param {object} props
 * @param {string} [props.id]                                  - Container element ID
 * @param {RepeatingItem[]} [props.items=[]]                   - Data array to iterate over
 * @param {number} [props.columns=3]                           - Grid column count (1 | 2 | 3 | 4)
 * @param {string} [props.fallback='No items available']       - Empty state message
 * @param {string} [props.className='']                        - Container class name
 * @param {(item: RepeatingItem, index: number) => React.ReactNode} [props.renderItem] - Custom loop item renderer
 */
const NmRepeatingGrid = ({
  id,
  items = [],
  columns = 3,
  fallback = 'No items available',
  className = '',
  renderItem,
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const activeColClass = columnClasses[columns] || columnClasses[3];

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div
        id={id}
        className="px-4 py-8 rounded-[var(--nm-radius-sm)] border border-dashed border-[var(--nm-border-subtle)] text-sm text-[var(--nm-text-muted)] text-center flex flex-col items-center justify-center gap-2"
        role="status"
      >
        <i className="pi pi-inbox text-xl text-[var(--nm-text-muted)]" aria-hidden="true" />
        <span>{resolveDisplayString(fallback, 'No items available')}</span>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`grid ${activeColClass} gap-5 ${className}`}
      role="list"
    >
      {items.map((item, index) => {
        const itemKey = (item && item.id) ? item.id : (id ? `${id}-item-${index}` : `repeat-item-${index}`);

        if (typeof renderItem === 'function') {
          return (
            <div key={itemKey} role="listitem">
              {renderItem(item, index)}
            </div>
          );
        }

        if (!item || typeof item !== 'object') {
          return (
            <div key={itemKey} role="listitem">
              <NmCard title={resolveDisplayString(item, `Item ${index + 1}`)} />
            </div>
          );
        }

        const titleText = resolveDisplayString(item.title, `Item ${index + 1}`, 'title');
        const displayText = resolveDisplayString(item.description || item.content, '', 'description');
        const badgeText = resolveDisplayString(item.badge, '', 'badge');
        const priceText = resolveDisplayString(item.price, '', 'price');
        const iconClass = typeof item.icon === 'string' ? item.icon : (item.icon?.name || item.icon?.icon || '');
        const imgSrc = item.src || item.image || (typeof item.content === 'object' ? item.content.src : '') || '';
        const imgAlt = resolveDisplayString(item.alt || titleText, 'Card image');

        return (
          <div key={itemKey} role="listitem">
            <NmCard
              title={titleText}
              className={`h-full flex flex-col transition-all duration-200 hover:border-[var(--nm-accent)] overflow-hidden ${item.className || ''}`}
            >
              {/* Optional card top image */}
              {imgSrc && (
                <div className="w-full h-40 rounded-t-[var(--nm-radius-sm)] -mt-6 -mx-6 mb-3 overflow-hidden bg-[var(--nm-bg-surface)]">
                  <img
                    src={imgSrc}
                    alt={imgAlt}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {iconClass && (
                <div
                  className="w-10 h-10 rounded-lg bg-[var(--nm-accent-glow)] flex items-center justify-center mb-3 text-[var(--nm-accent-light)]"
                  aria-hidden="true"
                >
                  <i className={`${iconClass} text-lg`} />
                </div>
              )}

              {badgeText && (
                <span className="nm-badge self-start mb-2 text-xs font-semibold px-2 py-0.5 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)]">
                  {badgeText}
                </span>
              )}

              {displayText && (
                <p className="text-sm text-[var(--nm-text-secondary)] leading-relaxed flex-1">
                  {displayText}
                </p>
              )}

              {priceText && (
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--nm-border-subtle)]">
                  <span className="font-bold text-base text-[var(--nm-accent-light)] font-mono">
                    {priceText}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] font-medium">
                    Select
                  </span>
                </div>
              )}
            </NmCard>
          </div>
        );
      })}
    </div>
  );
};

export default NmRepeatingGrid;

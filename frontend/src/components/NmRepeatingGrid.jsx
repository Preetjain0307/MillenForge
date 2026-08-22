/**
 * NmRepeatingGrid — Reusable Repeating Loop Component
 *
 * Implements the requirement for repeating collections to use proper data arrays
 * and loops rather than hard-coded duplicate component blocks.
 */

import NmCard from './NmCard.jsx';

/**
 * @typedef {Object} RepeatingItem
 * @property {string} id             - Stable item identifier
 * @property {string} [title]        - Item title
 * @property {string} [description]  - Item description/subtitle
 * @property {string} [content]      - Fallback or generic text content
 * @property {string} [icon]         - PrimeIcons icon name (e.g. "pi pi-bolt")
 * @property {string} [badge]        - Badge or chip label
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
        <span>{fallback}</span>
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
        const itemKey = item.id || (id ? `${id}-item-${index}` : `repeat-item-${index}`);

        if (typeof renderItem === 'function') {
          return (
            <div key={itemKey} role="listitem">
              {renderItem(item, index)}
            </div>
          );
        }

        const displayText = item.description || item.content || '';

        return (
          <div key={itemKey} role="listitem">
            <NmCard
              title={item.title}
              className={`h-full flex flex-col transition-all duration-200 hover:border-[var(--nm-accent)] ${item.className || ''}`}
            >
              {item.icon && (
                <div
                  className="w-10 h-10 rounded-lg bg-[var(--nm-accent-glow)] flex items-center justify-center mb-3 text-[var(--nm-accent-light)]"
                  aria-hidden="true"
                >
                  <i className={`${item.icon} text-lg`} />
                </div>
              )}
              {item.badge && (
                <span className="nm-badge self-start mb-2 text-xs font-semibold px-2 py-0.5 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)]">
                  {item.badge}
                </span>
              )}
              {displayText && (
                <p className="text-sm text-[var(--nm-text-secondary)] leading-relaxed flex-1">
                  {displayText}
                </p>
              )}
            </NmCard>
          </div>
        );
      })}
    </div>
  );
};

export default NmRepeatingGrid;

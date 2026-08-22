/**
 * ElementSelector — CMS Element Selection List & Section Explorer
 *
 * Allows users to browse and select any element from a UIPage or element list.
 *
 * Architecture:
 *   SELECT ELEMENT  ->  VIEW CONTENT  ->  EDIT CONTENT  ->  UPDATE PREVIEW
 */

import React, { useState, useMemo } from 'react';
import { resolveCmsContent } from '../../types/cms.js';

const TYPE_ICONS = {
  text: 'pi pi-align-left',
  button: 'pi pi-bolt',
  image: 'pi pi-image',
  input: 'pi pi-pencil',
  textfield: 'pi pi-pencil',
  card: 'pi pi-id-card',
  cards: 'pi pi-th-large',
  carousel: 'pi pi-images',
  wizard: 'pi pi-list-check',
  icon: 'pi pi-star',
  divider: 'pi pi-minus',
  link: 'pi pi-link',
};

const TYPE_COLORS = {
  text: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  button: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  image: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  input: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  textfield: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  card: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  cards: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

/**
 * @param {object} props
 * @param {import('../../types/ui.js').UIPage} [props.pageData] - Full page data
 * @param {import('../../types/cms.js').CmsElement[]} [props.elements] - Flat elements array
 * @param {string} [props.selectedElementId] - Currently selected element ID
 * @param {function} props.onSelectElement - (elementId) => void
 * @param {string} [props.className]
 */
const ElementSelector = ({
  pageData,
  elements,
  selectedElementId,
  onSelectElement,
  className = '',
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Normalize elements list either from pageData or direct elements prop
  const allElements = useMemo(() => {
    if (Array.isArray(elements) && elements.length > 0) {
      return elements.map((el) => ({ ...el, sectionTitle: 'Elements' }));
    }

    if (pageData && Array.isArray(pageData.sections)) {
      const list = [];
      pageData.sections.forEach((sec, secIdx) => {
        const secName = sec.props?.title || sec.type || `Section ${secIdx + 1}`;
        if (Array.isArray(sec.elements)) {
          sec.elements.forEach((el) => {
            if (el && el.id) {
              list.push({
                ...el,
                sectionTitle: secName,
                sectionId: sec.id || `sec-${secIdx}`,
              });
            }
          });
        }
      });
      return list;
    }

    return [];
  }, [pageData, elements]);

  // Filtered elements based on search query
  const filteredElements = useMemo(() => {
    if (!filterQuery.trim()) return allElements;
    const q = filterQuery.toLowerCase().trim();
    return allElements.filter((el) => {
      const idMatch = (el.id || '').toLowerCase().includes(q);
      const typeMatch = (el.type || '').toLowerCase().includes(q);
      const contentStr = resolveCmsContent(el.content, el.fallback || '').toLowerCase();
      const contentMatch = contentStr.includes(q);
      return idMatch || typeMatch || contentMatch;
    });
  }, [allElements, filterQuery]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Search / Filter bar */}
      <div className="relative flex items-center">
        <i className="pi pi-search absolute left-3 text-xs text-[var(--nm-text-muted)]" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter elements by ID, text or type..."
          className="w-full pl-8 pr-8 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
        />
        {filterQuery && (
          <button
            type="button"
            onClick={() => setFilterQuery('')}
            className="absolute right-2.5 text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)]"
          >
            <i className="pi pi-times text-xs" />
          </button>
        )}
      </div>

      {/* Elements List */}
      <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
        {filteredElements.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--nm-text-muted)] flex flex-col items-center gap-1.5">
            <i className="pi pi-search text-base opacity-40" />
            <span>No matching elements found</span>
          </div>
        ) : (
          filteredElements.map((el) => {
            const isSelected = el.id === selectedElementId;
            const iconClass = TYPE_ICONS[el.type] || 'pi pi-box';
            const colorClass = TYPE_COLORS[el.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            const displayPreview = resolveCmsContent(el.content, el.fallback || '', 'text') || el.props?.title || el.fallback || '';

            return (
              <button
                key={el.id}
                type="button"
                onClick={() => onSelectElement?.(el.id)}
                className={`w-full text-left px-3 py-2.5 rounded-[var(--nm-radius-sm)] border transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'border-[var(--nm-accent)] bg-[var(--nm-accent-glow)] shadow-[0_0_12px_rgba(108,99,255,0.2)]'
                    : 'border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] hover:border-[var(--nm-border)] hover:bg-[rgba(26,26,46,0.8)]'
                }`}
              >
                {/* Type Icon Badge */}
                <div className={`w-6 h-6 rounded flex items-center justify-center border flex-shrink-0 mt-0.5 ${colorClass}`}>
                  <i className={`${iconClass} text-xs`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-mono font-medium text-[var(--nm-text-primary)] truncate">
                      {el.id}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--nm-text-muted)]">
                      {el.type}
                    </span>
                  </div>

                  {displayPreview && (
                    <p className="text-[11px] text-[var(--nm-text-secondary)] truncate">
                      {displayPreview}
                    </p>
                  )}
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <i className="pi pi-check text-xs text-[var(--nm-accent-light)] flex-shrink-0 mt-1" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ElementSelector;

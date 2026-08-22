/**
 * CardsEditor — CMS Editor for Cards and Repeating Loop Elements
 *
 * Supports editing:
 * - Repeating cards collection (items array)
 * - Individual card title, description, icon, badge
 * - Adding new card items with deterministic stable IDs
 * - Removing card items
 * - Moving items up / down (reordering)
 * - Grid column layout selection (1, 2, 3, 4)
 * - Also handles single card element gracefully
 */

import React, { useState } from 'react';
import { generateStableId } from '../../utils/cms.js';

const POPULAR_CARD_ICONS = [
  { label: '⚡ Bolt', value: 'pi pi-bolt' },
  { label: '✨ Sparkles', value: 'pi pi-sparkles' },
  { label: '🔄 Sync', value: 'pi pi-sync' },
  { label: '🗄️ Database', value: 'pi pi-database' },
  { label: '🛡️ Shield', value: 'pi pi-shield' },
  { label: '📈 Chart', value: 'pi pi-chart-line' },
  { label: '⭐ Star', value: 'pi pi-star' },
  { label: '💡 Lightbulb', value: 'pi pi-lightbulb' },
  { label: '🎯 Target', value: 'pi pi-bullseye' },
  { label: 'None', value: '' },
];

/**
 * @param {object} props
 * @param {import('../../types/cms.js').CmsElement} props.element
 * @param {function} props.onUpdate - (updatedData) => void
 * @param {boolean} [props.disabled=false]
 */
const CardsEditor = ({ element, onUpdate, disabled = false }) => {
  if (!element || typeof element !== 'object') {
    return (
      <div className="p-4 text-xs text-[var(--nm-text-muted)] text-center">
        No cards element provided.
      </div>
    );
  }

  const isSingleCard = element.type === 'card';
  const rawItems = Array.isArray(element.items)
    ? element.items
    : (Array.isArray(element.props?.items) ? element.props.items : []);

  // For single card, wrap in an array or edit single fields
  const [expandedIndex, setExpandedIndex] = useState(0);

  // If single card
  if (isSingleCard) {
    const rawContent = element.content;
    let singleTitle = element.props?.title || '';
    let singleDesc = element.props?.description || '';
    const singleIcon = element.props?.icon || '';
    const singleBadge = element.props?.badge || '';

    if (typeof rawContent === 'string') {
      singleDesc = singleDesc || rawContent;
    } else if (rawContent && typeof rawContent === 'object') {
      singleTitle = rawContent.title || singleTitle;
      singleDesc = rawContent.description || rawContent.text || singleDesc;
    }

    const handleSingleFieldChange = (field, value) => {
      const updatedProps = { ...(element.props || {}), [field]: value };
      const updatedContent = typeof rawContent === 'object'
        ? { ...rawContent, [field]: value }
        : singleDesc;

      onUpdate?.({
        content: updatedContent,
        props: updatedProps,
      });
    };

    return (
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-single-card-title" className="font-medium text-[var(--nm-text-primary)]">
            Card Title
          </label>
          <input
            id="cms-single-card-title"
            type="text"
            value={singleTitle}
            onChange={(e) => handleSingleFieldChange('title', e.target.value)}
            disabled={disabled}
            placeholder="e.g. Instant Deployment"
            className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-single-card-desc" className="text-xs font-medium text-[var(--nm-text-secondary)]">
            Description
          </label>
          <textarea
            id="cms-single-card-desc"
            rows={3}
            value={singleDesc}
            onChange={(e) => handleSingleFieldChange('description', e.target.value)}
            disabled={disabled}
            placeholder="Describe the card details..."
            className="w-full px-3.5 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cms-single-card-icon" className="text-xs font-medium text-[var(--nm-text-secondary)]">
              Icon
            </label>
            <select
              id="cms-single-card-icon"
              value={singleIcon}
              onChange={(e) => handleSingleFieldChange('icon', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
            >
              {POPULAR_CARD_ICONS.map((ic) => (
                <option key={ic.value} value={ic.value}>
                  {ic.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cms-single-card-badge" className="text-xs font-medium text-[var(--nm-text-secondary)]">
              Badge Label
            </label>
            <input
              id="cms-single-card-badge"
              type="text"
              value={singleBadge}
              onChange={(e) => handleSingleFieldChange('badge', e.target.value)}
              disabled={disabled}
              placeholder="e.g. New / Pro"
              className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
            />
          </div>
        </div>
      </div>
    );
  }

  // Repeating Cards Loop Collection
  const items = rawItems;
  const currentColumns = element.props?.columns || 3;

  const handleItemChange = (index, field, value) => {
    const updated = items.map((it, idx) => {
      if (idx !== index) return it;
      return {
        ...it,
        [field]: value,
      };
    });

    onUpdate?.({
      items: updated,
      props: {
        ...(element.props || {}),
        items: updated,
      },
    });
  };

  const handleAddItem = () => {
    const newId = generateStableId(element.id || 'cards', 'item', items.length + 1);
    const newItem = {
      id: newId,
      title: `Card ${items.length + 1}`,
      description: 'New feature card description.',
      icon: 'pi pi-bolt',
      badge: '',
    };
    const updated = [...items, newItem];

    onUpdate?.({
      items: updated,
      props: {
        ...(element.props || {}),
        items: updated,
      },
    });
    setExpandedIndex(updated.length - 1);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return; // keep at least 1 item for safety
    const updated = items.filter((_, idx) => idx !== index);

    onUpdate?.({
      items: updated,
      props: {
        ...(element.props || {}),
        items: updated,
      },
    });
    if (expandedIndex >= updated.length) {
      setExpandedIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    onUpdate?.({
      items: updated,
      props: {
        ...(element.props || {}),
        items: updated,
      },
    });
    setExpandedIndex(targetIdx);
  };

  const handleColumnsChange = (cols) => {
    onUpdate?.({
      props: {
        ...(element.props || {}),
        columns: cols,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Header with Add Button and Column Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[var(--nm-border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--nm-text-primary)]">
            Card Items
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--nm-bg-surface)] text-[var(--nm-text-secondary)] border border-[var(--nm-border-subtle)]">
            {items.length} {items.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {/* Layout columns */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[var(--nm-text-muted)] mr-1">Cols:</span>
          {[1, 2, 3, 4].map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => handleColumnsChange(col)}
              disabled={disabled}
              className={`w-6 h-6 rounded text-xs font-mono transition-colors flex items-center justify-center ${
                currentColumns === col
                  ? 'bg-[var(--nm-accent)] text-white font-bold shadow-[0_0_8px_var(--nm-accent-glow)]'
                  : 'bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)]'
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Repeating Items List */}
      <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={item.id || index}
              className={`rounded-[var(--nm-radius-sm)] border transition-all ${
                isExpanded
                  ? 'border-[var(--nm-border)] bg-[var(--nm-bg-surface)]'
                  : 'border-[var(--nm-border-subtle)] bg-[rgba(26,26,46,0.4)] hover:border-[var(--nm-border)]'
              }`}
            >
              {/* Item Summary Bar (Click to toggle expand) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                onKeyDown={(e) => e.key === 'Enter' && setExpandedIndex(isExpanded ? -1 : index)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] flex items-center justify-center text-[10px] font-mono text-[var(--nm-text-muted)] flex-shrink-0">
                    {index + 1}
                  </span>
                  {item.icon && (
                    <i className={`${item.icon} text-xs text-[var(--nm-accent-light)] flex-shrink-0`} />
                  )}
                  <span className="text-xs font-medium text-[var(--nm-text-primary)] truncate">
                    {item.title || `Item ${index + 1}`}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Actions: Move & Delete */}
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title="Move up"
                    disabled={index === 0 || disabled}
                    onClick={() => handleMoveItem(index, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)] disabled:opacity-30"
                  >
                    <i className="pi pi-chevron-up text-[10px]" />
                  </button>
                  <button
                    type="button"
                    title="Move down"
                    disabled={index === items.length - 1 || disabled}
                    onClick={() => handleMoveItem(index, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)] disabled:opacity-30"
                  >
                    <i className="pi pi-chevron-down text-[10px]" />
                  </button>
                  <button
                    type="button"
                    title="Delete item"
                    disabled={items.length <= 1 || disabled}
                    onClick={() => handleRemoveItem(index)}
                    className="w-6 h-6 rounded flex items-center justify-center text-[var(--nm-text-muted)] hover:text-[var(--nm-error)] disabled:opacity-30"
                  >
                    <i className="pi pi-trash text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Expanded Item Form */}
              {isExpanded && (
                <div className="p-3 border-t border-[var(--nm-border-subtle)] flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-[var(--nm-text-secondary)]">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                      disabled={disabled}
                      placeholder="e.g. High Performance"
                      className="w-full px-2.5 py-1.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-[var(--nm-text-secondary)]">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={item.description || item.content || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      disabled={disabled}
                      placeholder="Card body text..."
                      className="w-full px-2.5 py-1.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-[var(--nm-text-secondary)]">
                        Icon
                      </label>
                      <select
                        value={item.icon || ''}
                        onChange={(e) => handleItemChange(index, 'icon', e.target.value)}
                        disabled={disabled}
                        className="w-full px-2 py-1.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-[11px] focus:outline-none focus:border-[var(--nm-accent)]"
                      >
                        {POPULAR_CARD_ICONS.map((ic) => (
                          <option key={ic.value} value={ic.value}>
                            {ic.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-[var(--nm-text-secondary)]">
                        Badge Chip
                      </label>
                      <input
                        type="text"
                        value={item.badge || ''}
                        onChange={(e) => handleItemChange(index, 'badge', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g. Beta"
                        className="w-full px-2.5 py-1.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Card Button */}
      <button
        type="button"
        onClick={handleAddItem}
        disabled={disabled}
        className="w-full py-2 px-3 rounded-[var(--nm-radius-sm)] border border-dashed border-[var(--nm-border)] bg-[rgba(108,99,255,0.05)] text-[var(--nm-accent-light)] hover:bg-[var(--nm-accent-glow)] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
      >
        <i className="pi pi-plus text-xs" />
        <span>Add Card Item</span>
      </button>
    </div>
  );
};

export default CardsEditor;

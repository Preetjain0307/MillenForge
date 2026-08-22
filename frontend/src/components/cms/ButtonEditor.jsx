/**
 * ButtonEditor — CMS Editor for Button Elements
 *
 * Supports editing:
 * - Button Label
 * - Link / URL (href)
 * - Variant (primary, secondary, ghost, danger)
 * - Icon (PrimeIcons class)
 * - Fallback text
 */

import React from 'react';
import { resolveCmsContent } from '../../types/cms.js';

const VARIANTS = [
  { label: 'Primary (Accent)', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Ghost (Outline/Text)', value: 'ghost' },
  { label: 'Danger', value: 'danger' },
];

const POPULAR_ICONS = [
  { label: 'None', value: '' },
  { label: '⚡ Bolt', value: 'pi pi-bolt' },
  { label: '✨ Sparkles', value: 'pi pi-sparkles' },
  { label: '➡️ Arrow Right', value: 'pi pi-arrow-right' },
  { label: '📥 Download', value: 'pi pi-download' },
  { label: '🔍 Search', value: 'pi pi-search' },
  { label: '⭐ Star', value: 'pi pi-star' },
  { label: '🚀 Send', value: 'pi pi-send' },
];

/**
 * @param {object} props
 * @param {import('../../types/cms.js').CmsElement} props.element
 * @param {function} props.onUpdate - (updatedData) => void
 * @param {boolean} [props.disabled=false]
 */
const ButtonEditor = ({ element, onUpdate, disabled = false }) => {
  if (!element || typeof element !== 'object') {
    return (
      <div className="p-4 text-xs text-[var(--nm-text-muted)] text-center">
        No button element provided.
      </div>
    );
  }

  const rawContent = element.content;
  const currentLabel = resolveCmsContent(rawContent, element.fallback || 'Button', 'label');
  const currentFallback = element.fallback || '';
  const currentVariant = element.props?.variant || 'primary';
  const currentIcon = element.props?.icon || '';
  const currentHref = element.props?.href || (rawContent && typeof rawContent === 'object' ? rawContent.href : '') || '';

  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    if (rawContent && typeof rawContent === 'object') {
      onUpdate?.({
        content: {
          ...rawContent,
          label: newLabel,
        },
      });
    } else {
      onUpdate?.({
        content: newLabel,
      });
    }
  };

  const handleHrefChange = (e) => {
    const newHref = e.target.value;
    onUpdate?.({
      props: {
        ...(element.props || {}),
        href: newHref,
      },
    });
  };

  const handleVariantChange = (e) => {
    onUpdate?.({
      props: {
        ...(element.props || {}),
        variant: e.target.value,
      },
    });
  };

  const handleIconChange = (e) => {
    onUpdate?.({
      props: {
        ...(element.props || {}),
        icon: e.target.value || undefined,
      },
    });
  };

  const handleFallbackChange = (e) => {
    onUpdate?.({
      fallback: e.target.value,
    });
  };

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Button Label */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-btn-label" className="font-medium text-[var(--nm-text-primary)]">
          Button Label
        </label>
        <input
          id="cms-btn-label"
          type="text"
          value={currentLabel}
          onChange={handleLabelChange}
          disabled={disabled}
          placeholder="e.g. Get Started Free"
          className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] transition-all"
        />
      </div>

      {/* Button Link / Destination */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-btn-href" className="text-xs font-medium text-[var(--nm-text-secondary)] flex items-center justify-between">
          <span>Destination Link (Optional)</span>
          <span className="text-[10px] text-[var(--nm-text-muted)]">URL or path e.g. /generate</span>
        </label>
        <div className="relative flex items-center">
          <i className="pi pi-link absolute left-3 text-xs text-[var(--nm-text-muted)]" />
          <input
            id="cms-btn-href"
            type="text"
            value={currentHref}
            onChange={handleHrefChange}
            disabled={disabled}
            placeholder="https://... or /path"
            className="w-full pl-8 pr-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all font-mono"
          />
        </div>
      </div>

      {/* Variant & Icon Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Style Variant */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-btn-variant" className="text-xs font-medium text-[var(--nm-text-secondary)]">
            Button Style
          </label>
          <select
            id="cms-btn-variant"
            value={currentVariant}
            onChange={handleVariantChange}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all cursor-pointer"
          >
            {VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Icon Preset */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-btn-icon" className="text-xs font-medium text-[var(--nm-text-secondary)]">
            Button Icon
          </label>
          <select
            id="cms-btn-icon"
            value={currentIcon}
            onChange={handleIconChange}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all cursor-pointer"
          >
            {POPULAR_ICONS.map((ic) => (
              <option key={ic.value} value={ic.value}>
                {ic.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fallback Value */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-btn-fallback" className="text-xs font-medium text-[var(--nm-text-secondary)]">
          Fallback Label
        </label>
        <input
          id="cms-btn-fallback"
          type="text"
          value={currentFallback}
          onChange={handleFallbackChange}
          disabled={disabled}
          placeholder="Default button label"
          className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
        />
      </div>
    </div>
  );
};

export default ButtonEditor;

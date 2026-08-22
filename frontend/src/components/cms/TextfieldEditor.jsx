/**
 * TextfieldEditor — CMS Editor for Input and Textfield Elements
 *
 * Supports editing:
 * - Field Label
 * - Placeholder text
 * - Input Type (text, email, password, number, tel)
 * - Multiline toggle (textarea)
 * - Fallback text
 */

import React from 'react';

const INPUT_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Password', value: 'password' },
  { label: 'Number', value: 'number' },
  { label: 'Phone (tel)', value: 'tel' },
];

/**
 * @param {object} props
 * @param {import('../../types/cms.js').CmsElement} props.element
 * @param {function} props.onUpdate - (updatedData) => void
 * @param {boolean} [props.disabled=false]
 */
const TextfieldEditor = ({ element, onUpdate, disabled = false }) => {
  if (!element || typeof element !== 'object') {
    return (
      <div className="p-4 text-xs text-[var(--nm-text-muted)] text-center">
        No input/textfield element provided.
      </div>
    );
  }

  const rawContent = element.content;
  let currentLabel = element.props?.label || '';
  let currentPlaceholder = element.props?.placeholder || '';
  const currentFallback = element.fallback || '';
  const currentInputType = element.props?.inputType || 'text';
  const isMultiline = Boolean(element.props?.multiline);

  if (typeof rawContent === 'string' && rawContent.trim() !== '') {
    currentPlaceholder = currentPlaceholder || rawContent;
  } else if (rawContent && typeof rawContent === 'object') {
    currentLabel = rawContent.label || currentLabel;
    currentPlaceholder = rawContent.placeholder || currentPlaceholder;
  }

  if (!currentLabel) {
    currentLabel = currentFallback || 'Field Label';
  }

  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    onUpdate?.({
      content: {
        ...(typeof rawContent === 'object' ? rawContent : {}),
        label: newLabel,
        placeholder: currentPlaceholder,
      },
      props: {
        ...(element.props || {}),
        label: newLabel,
      },
    });
  };

  const handlePlaceholderChange = (e) => {
    const newPlaceholder = e.target.value;
    onUpdate?.({
      content: {
        ...(typeof rawContent === 'object' ? rawContent : {}),
        label: currentLabel,
        placeholder: newPlaceholder,
      },
      props: {
        ...(element.props || {}),
        placeholder: newPlaceholder,
      },
    });
  };

  const handleInputTypeChange = (e) => {
    onUpdate?.({
      props: {
        ...(element.props || {}),
        inputType: e.target.value,
      },
    });
  };

  const handleMultilineToggle = (e) => {
    onUpdate?.({
      props: {
        ...(element.props || {}),
        multiline: e.target.checked,
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
      {/* Field Label */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-input-label" className="font-medium text-[var(--nm-text-primary)]">
          Field Label
        </label>
        <input
          id="cms-input-label"
          type="text"
          value={currentLabel}
          onChange={handleLabelChange}
          disabled={disabled}
          placeholder="e.g. Email Address"
          className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] transition-all"
        />
      </div>

      {/* Placeholder Text */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-input-placeholder" className="text-xs font-medium text-[var(--nm-text-secondary)]">
          Placeholder Hint
        </label>
        <input
          id="cms-input-placeholder"
          type="text"
          value={currentPlaceholder}
          onChange={handlePlaceholderChange}
          disabled={disabled}
          placeholder="e.g. name@company.com"
          className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
        />
      </div>

      {/* Input Type & Multiline Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        {/* Type selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-input-type" className="text-xs font-medium text-[var(--nm-text-secondary)]">
            Input Data Type
          </label>
          <select
            id="cms-input-type"
            value={currentInputType}
            onChange={handleInputTypeChange}
            disabled={disabled || isMultiline}
            className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all cursor-pointer disabled:opacity-50"
          >
            {INPUT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Multiline Toggle */}
        <div className="flex items-center gap-2 p-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
          <input
            id="cms-input-multiline"
            type="checkbox"
            checked={isMultiline}
            onChange={handleMultilineToggle}
            disabled={disabled}
            className="w-4 h-4 rounded border-[var(--nm-border)] bg-[var(--nm-bg-primary)] accent-[var(--nm-accent)] cursor-pointer"
          />
          <label htmlFor="cms-input-multiline" className="text-xs font-medium text-[var(--nm-text-secondary)] cursor-pointer select-none">
            Multiline Textarea
          </label>
        </div>
      </div>

      {/* Fallback */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cms-input-fallback" className="text-xs font-medium text-[var(--nm-text-secondary)]">
          Fallback Text
        </label>
        <input
          id="cms-input-fallback"
          type="text"
          value={currentFallback}
          onChange={handleFallbackChange}
          disabled={disabled}
          placeholder="Default field label"
          className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
        />
      </div>
    </div>
  );
};

export default TextfieldEditor;

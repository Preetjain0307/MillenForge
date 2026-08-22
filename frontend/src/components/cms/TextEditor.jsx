/**
 * TextEditor — CMS Editor for Text Elements
 *
 * Supports editing:
 * - Text content (string or structured object { text: '...' })
 * - Fallback text
 * - HTML Tag (p, h1, h2, h3, h4, span, label)
 */

import React from 'react';
import { resolveCmsContent } from '../../types/cms.js';

const ALLOWED_TAGS = [
  { label: 'Paragraph (p)', value: 'p' },
  { label: 'Heading 1 (h1)', value: 'h1' },
  { label: 'Heading 2 (h2)', value: 'h2' },
  { label: 'Heading 3 (h3)', value: 'h3' },
  { label: 'Heading 4 (h4)', value: 'h4' },
  { label: 'Span (inline)', value: 'span' },
];

/**
 * @param {object} props
 * @param {import('../../types/cms.js').CmsElement} props.element - Current element
 * @param {function} props.onUpdate - Callback invoked with updated content/props: (updatedData) => void
 * @param {boolean} [props.disabled=false]
 */
const TextEditor = ({ element, onUpdate, disabled = false }) => {
  if (!element || typeof element !== 'object') {
    return (
      <div className="p-4 text-xs text-[var(--nm-text-muted)] text-center">
        No text element provided.
      </div>
    );
  }

  const rawContent = element.content;
  const currentText = resolveCmsContent(rawContent, element.fallback || '', 'text');
  const currentFallback = element.fallback || '';
  const currentTag = element.props?.tag || 'p';

  const handleTextChange = (e) => {
    const newText = e.target.value;
    // If content was structured, preserve object structure; otherwise pass string
    if (rawContent && typeof rawContent === 'object') {
      onUpdate?.({
        content: {
          ...rawContent,
          text: newText,
        },
      });
    } else {
      onUpdate?.({
        content: newText,
      });
    }
  };

  const handleFallbackChange = (e) => {
    onUpdate?.({
      fallback: e.target.value,
    });
  };

  const handleTagChange = (e) => {
    onUpdate?.({
      props: {
        ...(element.props || {}),
        tag: e.target.value,
      },
    });
  };

  const isMultiline = currentText.length > 60 || currentTag === 'p';

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Primary Text Content Field */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="cms-text-content" className="font-medium text-[var(--nm-text-primary)]">
            Text Content
          </label>
          <span className="text-xs text-[var(--nm-text-muted)]">
            {currentText.length} chars
          </span>
        </div>

        {isMultiline ? (
          <textarea
            id="cms-text-content"
            rows={4}
            value={currentText}
            onChange={handleTextChange}
            disabled={disabled}
            placeholder="Enter display text..."
            className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] transition-all resize-y"
          />
        ) : (
          <input
            id="cms-text-content"
            type="text"
            value={currentText}
            onChange={handleTextChange}
            disabled={disabled}
            placeholder="Enter display text..."
            className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] transition-all"
          />
        )}
      </div>

      {/* Typography Tag & Fallback Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Semantic Tag */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-text-tag" className="text-xs font-medium text-[var(--nm-text-secondary)]">
            Typography Tag
          </label>
          <select
            id="cms-text-tag"
            value={currentTag}
            onChange={handleTagChange}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all cursor-pointer"
          >
            {ALLOWED_TAGS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fallback Text */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cms-text-fallback" className="text-xs font-medium text-[var(--nm-text-secondary)]">
            Fallback Value
          </label>
          <input
            id="cms-text-fallback"
            type="text"
            value={currentFallback}
            onChange={handleFallbackChange}
            disabled={disabled}
            placeholder="Default text if empty"
            className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;

/**
 * PreviewContainer — Reusable preview wrapper component
 * Used by PreviewPage and future editor views.
 */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {string} props.pageName
 * @param {React.ReactNode} [props.children]  - Rendered UI
 * @param {boolean} [props.isEmpty]
 */
const PreviewContainer = ({ pageName, children, isEmpty = true }) => {
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  const getViewportWidthClass = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto border-x border-[var(--nm-border)] shadow-xl nm-viewport-mobile';
      case 'tablet':
        return 'max-w-[768px] mx-auto border-x border-[var(--nm-border)] shadow-xl nm-viewport-tablet';
      case 'desktop':
      default:
        return 'w-full nm-viewport-desktop';
    }
  };

  return (
    <div className="flex-1 flex flex-col rounded-[var(--nm-radius-lg)] overflow-hidden border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)]">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-b border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)]">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <span className="w-3 h-3 rounded-full bg-[var(--nm-error)] opacity-70" />
          <span className="w-3 h-3 rounded-full bg-[var(--nm-warning)] opacity-70" />
          <span className="w-3 h-3 rounded-full bg-[var(--nm-success)] opacity-70" />
          <div className="text-xs font-mono text-[var(--nm-text-muted)] px-2.5 py-0.5 rounded bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] hidden sm:block">
            /preview/{pageName}
          </div>
        </div>

        {/* Responsive Viewport Switcher Controls */}
        <div className="flex items-center gap-1 bg-[var(--nm-bg-primary)] p-0.5 rounded-lg border border-[var(--nm-border-subtle)]" role="group" aria-label="Viewport Mode Switcher">
          <button
            type="button"
            onClick={() => setViewportMode('desktop')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
              viewportMode === 'desktop'
                ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)]'
            }`}
            title="Desktop view (100% width)"
            aria-label="Desktop view"
          >
            <i className="pi pi-desktop text-xs" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('tablet')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
              viewportMode === 'tablet'
                ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)]'
            }`}
            title="Tablet view (768px width)"
            aria-label="Tablet view"
          >
            <i className="pi pi-tablet text-xs" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('mobile')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
              viewportMode === 'mobile'
                ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)]'
            }`}
            title="Mobile view (375px width)"
            aria-label="Mobile view"
          >
            <i className="pi pi-mobile text-xs" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        <div className="text-xs text-[var(--nm-text-muted)] flex items-center gap-1 hidden md:flex">
          <i className="pi pi-eye text-[var(--nm-accent)] text-xs" />
          <span>Interactive Preview</span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 transition-all duration-300 bg-[var(--nm-bg-primary)]">
        <div className={`${getViewportWidthClass()} transition-all duration-300`}>
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-16">
              <div
                className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--nm-border)]
                           flex items-center justify-center"
                style={{ animation: 'nm-pulse-glow 2s ease infinite' }}
              >
                <i className="pi pi-desktop text-[var(--nm-accent)] text-2xl" />
              </div>
              <div className="text-center">
                <p className="text-[var(--nm-text-primary)] font-medium mb-1">
                  Generated UI will appear here
                </p>
                <p className="text-sm text-[var(--nm-text-muted)]">
                  Use the generate page to create a UI, then preview it here.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewContainer;

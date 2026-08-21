/**
 * PreviewContainer — Reusable preview wrapper component
 * Used by PreviewPage and future editor views.
 */

/**
 * @param {object} props
 * @param {string} props.pageName
 * @param {React.ReactNode} [props.children]  - Rendered UI (future use)
 * @param {boolean} [props.isEmpty]
 */
const PreviewContainer = ({ pageName, children, isEmpty = true }) => {
  return (
    <div className="flex-1 flex flex-col rounded-[var(--nm-radius-lg)] overflow-hidden border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)]">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)]">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <span className="w-3 h-3 rounded-full bg-[var(--nm-error)] opacity-70" />
          <span className="w-3 h-3 rounded-full bg-[var(--nm-warning)] opacity-70" />
          <span className="w-3 h-3 rounded-full bg-[var(--nm-success)] opacity-70" />
        </div>
        <div className="text-xs font-mono text-[var(--nm-text-muted)] px-3 py-1 rounded bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)]">
          /preview/{pageName}
        </div>
        <div className="text-xs text-[var(--nm-text-muted)] flex items-center gap-1">
          <i className="pi pi-eye text-[var(--nm-accent)] text-xs" />
          Preview
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-6">
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
  );
};

export default PreviewContainer;

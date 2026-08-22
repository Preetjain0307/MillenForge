/**
 * HistoryPage — Generation History & Saved UIPages
 *
 * Displays generated pages stored in Redux state, with graceful fallback
 * when backend API is unavailable or returns 501.
 */

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActivePage, removePage } from '../features/pages/pagesSlice';
import NmButton from '../components/NmButton';

const HistoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const pagesMap = useSelector((state) => state.pages.pages);
  const activePage = useSelector((state) => state.pages.activePage);

  const pageEntries = Object.entries(pagesMap || {});

  const handleOpenPage = (pageName) => {
    dispatch(setActivePage(pageName));
    navigate(`/preview/${encodeURIComponent(pageName)}`);
  };

  const handleRemovePage = (pageName) => {
    dispatch(removePage(pageName));
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6 nm-animate-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            Generation History
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-history text-[var(--nm-accent-light)]" />
            <span>Generated UI History</span>
          </h1>
        </div>

        <NmButton
          variant="primary"
          label="New Generation"
          icon="pi pi-sparkles"
          onClick={() => navigate('/generate')}
        />
      </div>

      {/* Info Banner */}
      <div className="px-4 py-3 rounded-lg bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.25)] text-xs text-[var(--nm-accent-light)] flex items-center gap-2">
        <i className="pi pi-info-circle text-base shrink-0" />
        <span>
          Generations in your current session are stored live in Redux. Click any card to load its preview and CMS editor.
        </span>
      </div>

      {/* History Grid or Empty State */}
      {pageEntries.length === 0 ? (
        <div className="nm-card flex flex-col items-center justify-center text-center p-12 gap-4 my-6 border border-dashed border-[var(--nm-border)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center justify-center text-[var(--nm-text-muted)]">
            <i className="pi pi-inbox text-2xl" />
          </div>
          <div className="max-w-sm">
            <h3 className="text-lg font-bold text-[var(--nm-text-primary)] mb-1">
              No Generated Pages Found
            </h3>
            <p className="text-xs text-[var(--nm-text-secondary)]">
              You haven't generated any UI layouts in this session yet. Use the AI Generator to create your first component.
            </p>
          </div>
          <NmButton
            variant="primary"
            label="Generate First UI"
            icon="pi pi-plus"
            onClick={() => navigate('/generate')}
            className="mt-2"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageEntries.map(([name, data]) => {
            const isCurrentlyActive = activePage === name;
            const sectionsCount = data?.sections?.length ?? 0;
            const title = data?.meta?.title || data?.page || name;
            const description = data?.meta?.description || `Generated ${sectionsCount}-section React layout`;

            return (
              <div
                key={name}
                className={`nm-card flex flex-col justify-between gap-4 border transition-all ${
                  isCurrentlyActive
                    ? 'border-[var(--nm-accent)] shadow-[0_0_16px_var(--nm-accent-glow)]'
                    : 'border-[var(--nm-border-subtle)] hover:border-[var(--nm-border)]'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--nm-bg-surface)] text-[var(--nm-accent-light)] border border-[var(--nm-border-subtle)]">
                      UIPage
                    </span>
                    {isCurrentlyActive && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] border border-[rgba(34,197,94,0.3)]">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--nm-text-primary)] leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs text-[var(--nm-text-secondary)] line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--nm-border-subtle)] text-xs text-[var(--nm-text-muted)]">
                  <span>{sectionsCount} section{sectionsCount !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemovePage(name)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                      title="Remove from history"
                    >
                      <i className="pi pi-trash text-xs" />
                    </button>
                    <NmButton
                      variant="primary"
                      label="Open Preview"
                      icon="pi pi-external-link"
                      onClick={() => handleOpenPage(name)}
                      className="text-xs px-3 py-1.5"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default HistoryPage;

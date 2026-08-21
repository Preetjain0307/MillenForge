/**
 * PreviewPage — /preview/:pageName
 *
 * Displays the preview container for a named page.
 * AI-generated content will be rendered here in a future task.
 */
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectPageByName } from '../features/pages/pagesSlice';
import PreviewContainer from '../components/PreviewContainer';
import NmButton from '../components/NmButton';

const PreviewPage = () => {
  const { pageName } = useParams();
  const decodedName = decodeURIComponent(pageName || 'Untitled');
  const pageData = useSelector(selectPageByName(decodedName));

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8 gap-6 nm-animate-in">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            Preview
          </p>
          <h1 className="text-2xl font-bold text-[var(--nm-text-primary)]">{decodedName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/generate">
            <NmButton
              variant="ghost"
              label="Back to Generate"
              icon="pi pi-arrow-left"
            />
          </Link>
          <NmButton
            variant="secondary"
            label="Export Code"
            icon="pi pi-download"
            disabled
            title="Export not yet implemented"
          />
        </div>
      </div>

      {/* Page metadata badge */}
      <div className="flex items-center gap-2">
        <span className="nm-glass text-xs px-2.5 py-1 rounded-full text-[var(--nm-text-secondary)] flex items-center gap-1">
          <i className="pi pi-file text-[var(--nm-accent)] text-xs" />
          {decodedName}
        </span>
        {pageData ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] border border-[rgba(34,197,94,0.3)]">
            Sections loaded: {pageData.sections?.length ?? 0}
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] border border-[var(--nm-border-subtle)]">
            No data yet
          </span>
        )}
      </div>

      {/* Preview container */}
      <div className="flex-1 flex" style={{ minHeight: '500px' }}>
        <PreviewContainer pageName={decodedName} isEmpty={!pageData} />
      </div>
    </main>
  );
};

export default PreviewPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectPageByName,
  selectSelectedElementId,
  setSelectedElementId,
  updateElement,
  setPage,
} from '../features/pages/pagesSlice';
import PreviewContainer from '../components/PreviewContainer';
import UIRenderer from '../components/UIRenderer';
import NmButton from '../components/NmButton';
import { CmsEditorPanel } from '../components/cms/index.js';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples.js';

const PreviewPage = () => {
  const { pageName } = useParams();
  const decodedName = decodeURIComponent(pageName || 'Home');
  const dispatch = useDispatch();

  const pageData = useSelector(selectPageByName(decodedName));
  const selectedElementId = useSelector(selectSelectedElementId);

  const [isCmsOpen, setIsCmsOpen] = useState(true);

  // Auto-initialize sample page data if page is missing from Redux (e.g. cold load of /preview/Home)
  useEffect(() => {
    if (!pageData && (decodedName === 'Home' || decodedName === 'Landing Page' || decodedName === 'Untitled')) {
      dispatch(setPage({ pageName: decodedName, data: { ...EXAMPLE_CMS_BOUND_PAGE, page: decodedName } }));
    }
  }, [pageData, decodedName, dispatch]);

  // Handler to load demo UI into Redux
  const handleLoadDemoUi = () => {
    dispatch(setPage({ pageName: decodedName, data: { ...EXAMPLE_CMS_BOUND_PAGE, page: decodedName } }));
  };

  // Handler for CMS content updates -> dispatches to Redux pagesSlice
  const handleUpdateContent = (elementId, updatedPayload) => {
    dispatch(
      updateElement({
        pageName: decodedName,
        elementId,
        newContent: updatedPayload,
      })
    );
  };

  // Click handler on preview container to pick clicked element for editing
  const handlePreviewClick = (e) => {
    if (!isCmsOpen) return;
    const target = e.target.closest('[id]');
    if (target && target.id && target.id !== 'root' && !target.id.startsWith('nm-')) {
      dispatch(setSelectedElementId(target.id));
    }
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6 nm-animate-in">
      {/* Judge Demo Banner */}
      <div
        role="note"
        className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-[var(--nm-radius-sm)] bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.3)] text-[var(--nm-accent-light)] text-xs sm:text-sm shadow-md"
      >
        <div className="flex items-center gap-2.5">
          <i className="pi pi-bolt text-base text-[var(--nm-accent-light)] animate-pulse" aria-hidden="true" />
          <div>
            <strong>AI Generated UI & CMS Live Editor</strong> — Click any element in the preview or select from the CMS panel to edit content live without touching JSX.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCmsOpen(!isCmsOpen)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCmsOpen
                ? 'bg-[var(--nm-accent)] text-white shadow-[0_0_12px_var(--nm-accent-glow)]'
                : 'bg-[var(--nm-bg-surface)] text-[var(--nm-text-secondary)] border border-[var(--nm-border-subtle)] hover:text-[var(--nm-text-primary)]'
            }`}
          >
            <i className="pi pi-sliders-h text-xs" />
            <span>{isCmsOpen ? 'CMS Editor Active' : 'Enable CMS Editor'}</span>
          </button>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            Generated UI Preview
          </p>
          <h1 className="text-2xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <span>{decodedName}</span>
            {selectedElementId && isCmsOpen && (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)]">
                Selected: {selectedElementId}
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/generate">
            <NmButton
              variant="ghost"
              label="Back to Generate"
              icon="pi pi-arrow-left"
            />
          </Link>
          {!pageData && (
            <NmButton
              variant="primary"
              label="Load Demo UI"
              icon="pi pi-play"
              onClick={handleLoadDemoUi}
            />
          )}
          <NmButton
            variant="secondary"
            label="Export Code"
            icon="pi pi-download"
            disabled
            title="Export available in production bundle"
          />
        </div>
      </div>

      {/* Page metadata badge & status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="nm-glass text-xs px-2.5 py-1 rounded-full text-[var(--nm-text-secondary)] flex items-center gap-1">
            <i className="pi pi-file text-[var(--nm-accent)] text-xs" />
            {decodedName}
          </span>
          {pageData ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] border border-[rgba(34,197,94,0.3)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--nm-success)] animate-pulse" />
              {pageData.sections?.length ?? 0} section{pageData.sections?.length !== 1 ? 's' : ''} · AI generated
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] border border-[var(--nm-border-subtle)]">
              No page data loaded
            </span>
          )}
        </div>

        {/* Live Redux sync indicator */}
        <div className="text-xs font-mono text-[var(--nm-text-muted)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--nm-accent-light)] animate-ping" />
          <span>Redux Live Binding Active</span>
        </div>
      </div>

      {/* Main Content Area: Responsive Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Page Preview */}
        <div className={`${isCmsOpen ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-4 transition-all duration-300`}>
          <div
            onClick={handlePreviewClick}
            className="flex-1 flex flex-col"
            style={{ minHeight: '520px' }}
          >
            <PreviewContainer pageName={decodedName} isEmpty={!pageData}>
              {pageData && <UIRenderer pageData={pageData} />}
            </PreviewContainer>
          </div>
        </div>

        {/* Right Column: CMS Content Editor Panel */}
        {isCmsOpen && (
          <div className="lg:col-span-5 sticky top-20">
            <CmsEditorPanel
              selectedElementId={selectedElementId}
              pageData={pageData}
              onUpdateContent={handleUpdateContent}
              onSelectElement={(id) => dispatch(setSelectedElementId(id))}
              onClose={() => setIsCmsOpen(false)}
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default PreviewPage;

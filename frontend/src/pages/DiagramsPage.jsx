/**
 * DiagramsPage — Visual Design Intelligence & Diagram Tools Workbench
 *
 * Combines:
 * 1. Pattern Diagram → UIPage Compilation (PatternToUiPanel)
 * 2. UIPage → Component & Navigation Flow Visualization (FlowDiagram)
 * 3. Draw-to-Modify Targeted Element Editing (DrawModifyPanel)
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPage, setActivePage } from '../features/pages/pagesSlice';
import { PatternToUiPanel, FlowDiagram, DrawModifyPanel } from '../components/diagrams/index.js';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples.js';
import NmButton from '../components/NmButton';

const DiagramsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activePageName = useSelector((state) => state.pages.activePage) || 'Home';
  const currentPageData = useSelector((state) => state.pages.pages[activePageName]) || EXAMPLE_CMS_BOUND_PAGE;

  const [activeTab, setActiveTab] = useState('pattern'); // 'pattern' | 'flow' | 'modify'
  const [latestCompiledPage, setLatestCompiledPage] = useState(currentPageData);

  const handleCompileUipage = (compiledPage) => {
    setLatestCompiledPage(compiledPage);
    const pageName = compiledPage.page || 'Pattern Page';
    dispatch(setPage({ pageName, data: compiledPage }));
    dispatch(setActivePage(pageName));
  };

  const handleApplyModification = (updatedPage) => {
    setLatestCompiledPage(updatedPage);
    const pageName = updatedPage.page || activePageName;
    dispatch(setPage({ pageName, data: updatedPage }));
  };

  const handlePreviewPage = () => {
    const pageName = latestCompiledPage.page || activePageName;
    navigate(`/preview/${encodeURIComponent(pageName)}`);
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6 nm-animate-in">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            Visual Design Intelligence
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-sitemap text-[var(--nm-accent-light)]" />
            <span>Pattern & Flow Diagram Workbench</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <NmButton
            variant="secondary"
            label="Open Live Preview"
            icon="pi pi-desktop"
            onClick={handlePreviewPage}
          />
          <NmButton
            variant="primary"
            label="AI Generator"
            icon="pi pi-sparkles"
            onClick={() => navigate('/generate')}
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-[var(--nm-border-subtle)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pattern')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'pattern'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-th-large text-xs" />
          <span>1. Pattern Diagram → UI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flow')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'flow'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-share-alt text-xs" />
          <span>2. UI → Basic Flow Diagram</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modify')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'modify'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-pencil text-xs" />
          <span>3. Draw-to-Modify Tool</span>
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === 'pattern' && (
        <PatternToUiPanel onCompileUipage={handleCompileUipage} />
      )}

      {activeTab === 'flow' && (
        <div className="flex flex-col gap-6">
          <FlowDiagram uiPage={latestCompiledPage} />
        </div>
      )}

      {activeTab === 'modify' && (
        <DrawModifyPanel
          uiPage={latestCompiledPage}
          onApplyModification={handleApplyModification}
        />
      )}
    </main>
  );
};

export default DiagramsPage;

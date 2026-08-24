/**
 * DiagramsPage — Visual Design Intelligence & Diagram Tools Workbench
 *
 * Combines:
 * 1. Any Software Diagram → Live UI Builder (DiagramToUiBuilder)
 * 2. Pattern Diagram → UIPage Compilation (PatternToUiPanel)
 * 3. UIPage → Component & Navigation Flow Visualization (FlowDiagram)
 * 4. Draw-to-Modify Targeted Element Editing (DrawModifyPanel)
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPage, setActivePage } from '../features/pages/pagesSlice';
import {
  DiagramToUiBuilder,
  FlowDiagram,
  DrawModifyPanel,
} from '../components/diagrams/index.js';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples.js';
import NmButton from '../components/NmButton';

const DiagramsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activePageName = useSelector((state) => state.pages.activePage) || 'Home';
  const currentPageData = useSelector((state) => state.pages.pages[activePageName]) || EXAMPLE_CMS_BOUND_PAGE;

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'flow' | 'modify'
  const [latestCompiledPage, setLatestCompiledPage] = useState(currentPageData);

  const handleUiGenerated = (newPage) => {
    setLatestCompiledPage(newPage);
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
            <span>Software Diagram &amp; Flow Workbench</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--nm-text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
            Update individual sections of your generated website using natural-language instructions. Modify only what you select without regenerating the complete UI.
          </p>
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
            label="AI Wireframe Generator"
            icon="pi pi-sparkles"
            onClick={() => navigate('/generate')}
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-[var(--nm-border-subtle)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === 'builder'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-bolt text-xs" />
          <span>1. Software Diagram → Live UI (Upload &amp; Build)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flow')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === 'flow'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-share-alt text-xs" />
          <span>2. UI → Flow Diagram</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modify')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === 'modify'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-pencil text-xs" />
          <span>3. Draw-to-Modify Tool</span>
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === 'builder' && (
        <DiagramToUiBuilder onUiGenerated={handleUiGenerated} />
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

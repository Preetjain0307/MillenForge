/**
 * WorkspacePage — Unified NeuraMindss Product Workbench & Dashboard
 *
 * Unites:
 * 1. Generate UI (/generate)
 * 2. Live Preview & CMS Editing (/preview/:pageName)
 * 3. Pattern & Flow Diagrams (/diagrams)
 * 4. AI Product Intelligence (/intelligence)
 * 5. AI Multi-Agent Review & Self-Healing (/review)
 * 6. Session Generation History (/history)
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setActivePage, setPage } from '../features/pages/pagesSlice';
import { validateUiPage } from '../utils/validateUi';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples';
import NmButton from '../components/NmButton';

const WORKFLOW_STEPS = [
  { step: '01', label: 'Wireframe + Prompt', icon: 'pi pi-file-edit', path: '/generate' },
  { step: '02', label: 'AI Generation', icon: 'pi pi-sparkles', path: '/generate' },
  { step: '03', label: 'Live Preview', icon: 'pi pi-desktop', path: '/preview/Home' },
  { step: '04', label: 'CMS Content Edit', icon: 'pi pi-sliders-h', path: '/preview/Home' },
  { step: '05', label: 'UI Quality Score', icon: 'pi pi-chart-line', path: '/intelligence' },
  { step: '06', label: 'Requirement Intelligence', icon: 'pi pi-brain', path: '/intelligence' },
  { step: '07', label: 'AI Review & Healing', icon: 'pi pi-shield', path: '/review' },
  { step: '08', label: 'Save / History', icon: 'pi pi-history', path: '/history' },
];

const WorkspacePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const pagesMap = useSelector((state) => state.pages.pages);
  const activePageName = useSelector((state) => state.pages.activePage) || 'Home';
  const currentPageData = pagesMap[activePageName] || EXAMPLE_CMS_BOUND_PAGE;

  const pageEntries = Object.entries(pagesMap || {});
  const totalPages = pageEntries.length;

  // Calculate live quality score for current active page
  const qualityResult = validateUiPage(currentPageData);
  const qualityScore = qualityResult.score ?? 95;

  const handleOpenPreview = (pageName) => {
    dispatch(setActivePage(pageName));
    navigate(`/preview/${encodeURIComponent(pageName)}`);
  };

  const handleOpenIntelligence = (pageName) => {
    dispatch(setActivePage(pageName));
    navigate('/intelligence');
  };

  const handleOpenReview = (pageName) => {
    dispatch(setActivePage(pageName));
    navigate('/review');
  };

  const handleLoadDemo = () => {
    dispatch(setPage({ pageName: 'Home', data: EXAMPLE_CMS_BOUND_PAGE }));
    dispatch(setActivePage('Home'));
    navigate('/preview/Home');
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-8 nm-animate-in">
      {/* ── 1. HEADER & QUICK WORKBENCH ACTIONS ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--nm-border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(108,99,255,0.15)] text-[var(--nm-accent-light)] uppercase tracking-wider border border-[rgba(108,99,255,0.3)]">
              Unified Workbench
            </span>
            <span className="text-xs text-[var(--nm-text-muted)]">
              Active Page: <strong className="text-[var(--nm-text-primary)]">{activePageName}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--nm-text-primary)] tracking-tight">
            NeuraMindss <span className="nm-gradient-text">Product Workspace</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <NmButton
            variant="primary"
            label="Generate UI"
            icon="pi pi-sparkles"
            onClick={() => navigate('/generate')}
            className="text-xs px-4 py-2 shadow-[0_0_16px_var(--nm-accent-glow)]"
          />
          <NmButton
            variant="secondary"
            label="Diagram Tools"
            icon="pi pi-sitemap"
            onClick={() => navigate('/diagrams')}
            className="text-xs px-3.5 py-2"
          />
          <NmButton
            variant="secondary"
            label="AI Intelligence"
            icon="pi pi-brain"
            onClick={() => navigate('/intelligence')}
            className="text-xs px-3.5 py-2"
          />
          <NmButton
            variant="secondary"
            label="Review & Healing"
            icon="pi pi-shield"
            onClick={() => navigate('/review')}
            className="text-xs px-3.5 py-2"
          />
        </div>
      </div>

      {/* ── 2. PRODUCT JOURNEY WORKFLOW BANNER ──────────────────────────────── */}
      <div className="nm-glass p-4 rounded-[var(--nm-radius-lg)] border border-[var(--nm-border-subtle)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--nm-text-muted)] flex items-center gap-1.5">
            <i className="pi pi-compass text-[var(--nm-accent-light)]" />
            End-to-End Product Lifecycle
          </span>
          <span className="text-[11px] font-mono text-[var(--nm-success)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nm-success)] animate-pulse" />
            All Modules Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {WORKFLOW_STEPS.map((step) => (
            <Link
              key={step.step}
              to={step.path}
              className="p-2.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] hover:border-[var(--nm-accent)] hover:bg-[rgba(108,99,255,0.1)] transition-all flex flex-col gap-1.5 group no-underline"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[var(--nm-accent-light)]">
                  {step.step}
                </span>
                <i className={`${step.icon} text-xs text-[var(--nm-text-muted)] group-hover:text-[var(--nm-accent-light)]`} />
              </div>
              <span className="text-[11px] font-medium text-[var(--nm-text-primary)] leading-tight line-clamp-2">
                {step.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 3. METRICS DASHBOARD CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="nm-card p-4 flex items-center justify-between border border-[var(--nm-border-subtle)]">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--nm-text-muted)] font-medium">Session Pages</span>
            <span className="text-2xl font-bold text-[var(--nm-text-primary)] mt-1">{totalPages}</span>
            <span className="text-[10px] font-mono text-[var(--nm-accent-light)] mt-0.5">Active in Redux</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center text-[var(--nm-accent-light)]">
            <i className="pi pi-file text-lg" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="nm-card p-4 flex items-center justify-between border border-[var(--nm-border-subtle)]">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--nm-text-muted)] font-medium">UI Quality Score</span>
            <span className="text-2xl font-bold text-[var(--nm-success)] mt-1">{qualityScore} / 100</span>
            <span className="text-[10px] font-mono text-[var(--nm-success)] mt-0.5">Validated Contract</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] flex items-center justify-center text-[var(--nm-success)]">
            <i className="pi pi-chart-line text-lg" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="nm-card p-4 flex items-center justify-between border border-[var(--nm-border-subtle)]">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--nm-text-muted)] font-medium">Active Page</span>
            <span className="text-lg font-bold text-[var(--nm-text-primary)] truncate max-w-[140px] mt-1">
              {activePageName}
            </span>
            <span className="text-[10px] font-mono text-[var(--nm-text-muted)] mt-0.5">
              {currentPageData.sections?.length ?? 0} Sections
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center justify-center text-[var(--nm-text-primary)]">
            <i className="pi pi-desktop text-lg" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="nm-card p-4 flex items-center justify-between border border-[var(--nm-border-subtle)]">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--nm-text-muted)] font-medium">Self-Healing</span>
            <span className="text-2xl font-bold text-[var(--nm-accent-light)] mt-1">Ready</span>
            <span className="text-[10px] font-mono text-[var(--nm-accent-light)] mt-0.5">Multi-Agent Review</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center text-[var(--nm-accent-light)]">
            <i className="pi pi-shield text-lg" />
          </div>
        </div>
      </div>

      {/* ── 4. RECENT GENERATED PAGES WORKSPACE SECTION ─────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-list text-[var(--nm-accent-light)]" />
            <span>Session UIPage Workspaces</span>
          </h3>

          {totalPages === 0 && (
            <NmButton
              variant="secondary"
              label="Load Demo UI"
              icon="pi pi-play"
              onClick={handleLoadDemo}
              className="text-xs px-3 py-1.5"
            />
          )}
        </div>

        {totalPages === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--nm-border)] bg-[var(--nm-bg-card)] text-center flex flex-col items-center justify-center gap-3">
            <i className="pi pi-inbox text-3xl text-[var(--nm-text-muted)]" />
            <div className="max-w-sm">
              <h4 className="text-sm font-bold text-[var(--nm-text-primary)] mb-1">No Active Pages in Session</h4>
              <p className="text-xs text-[var(--nm-text-muted)]">
                Generate a new layout or click "Load Demo UI" to explore NeuraMindss workspace tools.
              </p>
            </div>
            <div className="flex gap-2">
              <NmButton variant="primary" label="Generate UI" icon="pi pi-sparkles" onClick={() => navigate('/generate')} className="text-xs px-4 py-1.5" />
              <NmButton variant="secondary" label="Load Demo UI" icon="pi pi-play" onClick={handleLoadDemo} className="text-xs px-4 py-1.5" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageEntries.map(([name, data]) => {
              const isCurrentlyActive = activePageName === name;
              const sectionsCount = data?.sections?.length ?? 0;
              const pageVal = validateUiPage(data);

              return (
                <div
                  key={name}
                  className={`nm-card flex flex-col justify-between gap-4 border transition-all ${
                    isCurrentlyActive
                      ? 'border-[var(--nm-accent)] shadow-[0_0_16px_var(--nm-accent-glow)] bg-[var(--nm-bg-card)]'
                      : 'border-[var(--nm-border-subtle)] hover:border-[var(--nm-border)] bg-[var(--nm-bg-card)]'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nm-bg-surface)] text-[var(--nm-accent-light)] border border-[var(--nm-border-subtle)]">
                        {data?.page || name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] border border-[rgba(34,197,94,0.3)]">
                        Score: {pageVal.score ?? 95}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[var(--nm-text-primary)] leading-snug">
                      {name}
                    </h4>

                    <p className="text-xs text-[var(--nm-text-secondary)] line-clamp-2 leading-relaxed">
                      {data?.meta?.description || `Generated ${sectionsCount}-section UI layout with reusable contracts.`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--nm-border-subtle)] text-xs">
                    <span className="text-[11px] font-mono text-[var(--nm-text-muted)]">
                      {sectionsCount} section{sectionsCount !== 1 ? 's' : ''}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenIntelligence(name)}
                        className="px-2 py-1 rounded bg-[rgba(108,99,255,0.15)] text-[var(--nm-accent-light)] text-[11px] font-medium hover:bg-[var(--nm-accent)] hover:text-white transition-colors"
                        title="Open AI Product Intelligence"
                      >
                        <i className="pi pi-brain text-xs" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReview(name)}
                        className="px-2 py-1 rounded bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] text-[11px] font-medium hover:bg-[var(--nm-success)] hover:text-white transition-colors"
                        title="Open AI Review & Self Healing"
                      >
                        <i className="pi pi-shield text-xs" />
                      </button>

                      <NmButton
                        variant="primary"
                        label="Preview & CMS"
                        icon="pi pi-external-link"
                        onClick={() => handleOpenPreview(name)}
                        className="text-xs px-2.5 py-1"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default WorkspacePage;

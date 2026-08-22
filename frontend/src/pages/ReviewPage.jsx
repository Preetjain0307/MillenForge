/**
 * ReviewPage — AI Multi-Agent Review & Self-Healing Workbench
 *
 * Integrates:
 * 1. AI Multi-Agent Review Panel (AiReviewPanel)
 * 2. Self-Healing Controls (SelfHealingPanel)
 * 3. Refactoring Assistant (RefactoringAssistant)
 * 4. Feature Recommendations (FeatureRecommendations)
 * 5. Repair History Timeline (RepairHistory)
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPage, setActivePage } from '../features/pages/pagesSlice';
import AiReviewPanel from '../components/AiReviewPanel';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples';
import NmButton from '../components/NmButton';

const ReviewPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activePageName = useSelector((state) => state.pages.activePage) || 'Home';
  const pageData = useSelector((state) => state.pages.pages[activePageName]) || EXAMPLE_CMS_BOUND_PAGE;

  const handlePageUpdate = (updatedPage) => {
    const pageName = updatedPage.page || activePageName;
    dispatch(setPage({ pageName, data: updatedPage }));
    dispatch(setActivePage(pageName));
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6 nm-animate-in">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            AI Multi-Agent Review & Self-Healing
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-shield text-[var(--nm-accent-light)]" />
            <span>AI Self-Healing Workbench</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <NmButton
            variant="secondary"
            label="Open Live Preview"
            icon="pi pi-desktop"
            onClick={() => navigate(`/preview/${encodeURIComponent(activePageName)}`)}
          />
          <NmButton
            variant="primary"
            label="AI Product Intelligence"
            icon="pi pi-brain"
            onClick={() => navigate('/intelligence')}
          />
        </div>
      </div>

      {/* Main Review Component */}
      <AiReviewPanel
        page={pageData}
        onPageUpdate={handlePageUpdate}
        userPrompt={`Optimizing generated ${activePageName} layout for visual quality & accessibility.`}
      />
    </main>
  );
};

export default ReviewPage;

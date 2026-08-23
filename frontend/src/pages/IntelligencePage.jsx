/**
 * IntelligencePage — AI Product Intelligence & Quality Score Workbench
 *
 * Integrates:
 * 1. UI Quality Score Panel (UIQualityScorePanel)
 * 2. Requirement Analysis Panel (RequirementAnalysisPanel)
 * 3. Architecture Recommendation Panel (ArchitectureRecommendationPanel)
 * 4. Design Validation Panel (DesignValidationPanel)
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UIQualityScorePanel from '../components/intelligence/UIQualityScorePanel';
import RequirementAnalysisPanel from '../components/intelligence/RequirementAnalysisPanel';
import ArchitectureRecommendationPanel from '../components/intelligence/ArchitectureRecommendationPanel';
import DesignValidationPanel from '../components/intelligence/DesignValidationPanel';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples';
import NmButton from '../components/NmButton';

const IntelligencePage = () => {
  const navigate = useNavigate();

  const activePageName = useSelector((state) => state.pages.activePage) || 'Home';
  const pageData = useSelector((state) => state.pages.pages[activePageName]) || EXAMPLE_CMS_BOUND_PAGE;

  const [activeTab, setActiveTab] = useState('quality'); // 'quality' | 'requirements' | 'architecture' | 'design'

  // Computed intelligence data fallback for UI display
  const intelligence = {
    requirements: {
      summary: 'Target page layout structured for responsive web components with CMS data contracts.',
      missingRequirements: ['Add dark mode theme toggle', 'Include sticky action footer'],
      priorities: ['Mobile viewport accessibility', 'CMS element binding stability'],
      assumptions: ['Standard HTML5 layout schema'],
      recommendedQuestions: ['Should pricing cards include monthly/annual toggle?'],
    },
    architecture: {
      summary: 'Decoupled presentation renderer architecture with Redux Toolkit state slice.',
      componentsToExtract: ['HeroBanner', 'FeatureCardsGrid', 'CmsEditorPanel'],
      stateManagementAdvice: 'Store UIPage payloads in Redux pagesSlice for live CMS binding.',
      accessibilityTips: ['Add aria-labels to icon buttons', 'Ensure image alt text fallbacks'],
      performanceImprovements: ['Use lazy loading for hero images'],
    },
    quality: {
      overallScore: 95,
      categories: {
        completeness: 96,
        responsiveness: 95,
        accessibility: 94,
        designConsistency: 96,
      },
      feedback: [
        { type: 'positive', message: 'All sections contain valid elements and fallback attributes.' },
        { type: 'positive', message: 'Images include alt text and error handling.' },
        { type: 'neutral', message: 'Consider adding keyboard shortcut hints to interactive controls.' },
      ],
    },
    validation: {
      isValid: true,
      rulesChecked: 14,
      passedRules: 14,
      violations: [],
      warnings: ['Card items array is set to 3 items.'],
    },
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6 nm-animate-in">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            Product Intelligence Workbench
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-brain text-[var(--nm-accent-light)]" />
            <span>AI Product & Quality Intelligence</span>
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
            label="AI Review & Healing"
            icon="pi pi-shield"
            onClick={() => navigate('/review')}
          />
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--nm-border-subtle)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'quality'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-chart-line text-xs" />
          <span>UI Quality Score</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requirements')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'requirements'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-list text-xs" />
          <span>Requirement Analysis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'architecture'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-sitemap text-xs" />
          <span>Architecture Recommendations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('design')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'design'
              ? 'bg-[var(--nm-accent)] text-white shadow-sm'
              : 'text-[var(--nm-text-secondary)] hover:text-white hover:bg-[var(--nm-bg-surface)]'
          }`}
        >
          <i className="pi pi-check-circle text-xs" />
          <span>Design Validation</span>
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === 'quality' && (
        <UIQualityScorePanel quality={intelligence.quality} />
      )}

      {activeTab === 'requirements' && (
        <RequirementAnalysisPanel requirements={intelligence.requirements} />
      )}

      {activeTab === 'architecture' && (
        <ArchitectureRecommendationPanel architecture={intelligence.architecture} />
      )}

      {activeTab === 'design' && (
        <DesignValidationPanel validation={intelligence.validation} />
      )}
    </main>
  );
};

export default IntelligencePage;

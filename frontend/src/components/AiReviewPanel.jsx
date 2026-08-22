/**
 * AiReviewPanel — Unified AI Review & Self-Improvement Dashboard Panel
 *
 * Integrates:
 * - Overall Score Chip
 * - Critical Issues List
 * - Multi-Agent Review Cards (UX, Visual, Accessibility, Engineering, Product)
 * - Self-Healing Controls & Audit Logs
 * - Refactoring Assistant
 * - Feature Recommendations
 * - Repair History Timeline
 */

import React, { useState } from 'react';
import AgentReviewCard from './AgentReviewCard';
import SelfHealingPanel from './SelfHealingPanel';
import RefactoringAssistant from './RefactoringAssistant';
import FeatureRecommendations from './FeatureRecommendations';
import RepairHistory from './RepairHistory';

const AiReviewPanel = ({ page, onPageUpdate, userPrompt = '' }) => {
  const [reviewData, setReviewData] = useState(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [repairs, setRepairs] = useState([]);
  const [isHealing, setIsHealing] = useState(false);

  const handleRunReview = async () => {
    if (!page) return;
    setIsLoadingReview(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewData(data.review);
      }
    } catch (err) {
      console.error('Review request failed:', err);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleRunHealing = async () => {
    if (!page) return;
    setIsHealing(true);
    try {
      const res = await fetch('/api/review/heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
      const data = await res.json();
      if (data.success && data.healedPage) {
        setRepairs((prev) => [...prev, ...(data.repairs || [])]);
        if (onPageUpdate) onPageUpdate(data.healedPage);
      }
    } catch (err) {
      console.error('Healing request failed:', err);
    } finally {
      setIsHealing(false);
    }
  };

  const getScoreColor = (val) => {
    if (val >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (val >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-[var(--nm-radius-lg)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)]">
      <div className="flex items-center justify-between border-b border-[var(--nm-border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <i className="pi pi-shield text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--nm-text-primary)]">AI Review & Self-Improvement Engine</h2>
            <p className="text-xs text-[var(--nm-text-secondary)]">Multi-agent evaluation, automatic contract healing, and refactoring advisor</p>
          </div>
        </div>

        <button
          onClick={handleRunReview}
          disabled={isLoadingReview}
          className="px-4 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-accent)] hover:bg-[var(--nm-accent-hover)] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2"
        >
          <i className={`pi ${isLoadingReview ? 'pi-spin pi-spinner' : 'pi-refresh'}`} />
          {isLoadingReview ? 'Evaluating...' : 'Run Multi-Agent Review'}
        </button>
      </div>

      {reviewData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-[var(--nm-radius-sm)] border ${getScoreColor(reviewData.overallScore)} flex flex-col items-center justify-center text-center gap-1`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--nm-text-secondary)]">Overall Score</span>
            <span className="text-3xl font-extrabold font-mono">{reviewData.overallScore}</span>
            <span className="text-[10px] text-[var(--nm-text-muted)]">5 Agent Evaluation Average</span>
          </div>

          <div className="md:col-span-3 p-4 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
              <i className="pi pi-exclamation-triangle text-amber-400" />
              Critical Findings ({reviewData.criticalIssues?.length || 0})
            </span>
            {reviewData.criticalIssues?.length === 0 ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <i className="pi pi-check text-xs" /> Zero critical issues detected.
              </span>
            ) : (
              <ul className="list-disc list-inside text-xs text-[var(--nm-text-secondary)] space-y-1 max-h-24 overflow-y-auto">
                {reviewData.criticalIssues?.map((iss, i) => (
                  <li key={i} className="truncate">{iss}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {reviewData?.agents && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-[var(--nm-text-secondary)] uppercase tracking-wider">Agent Evaluation Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {reviewData.agents.map((ag, idx) => (
              <AgentReviewCard key={idx} agentData={ag} />
            ))}
          </div>
        </div>
      )}

      <SelfHealingPanel repairs={repairs} onTriggerHealing={handleRunHealing} isHealing={isHealing} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RefactoringAssistant recommendations={[]} />
        <FeatureRecommendations features={[]} />
      </div>

      <RepairHistory repairs={repairs} />
    </div>
  );
};

export default AiReviewPanel;

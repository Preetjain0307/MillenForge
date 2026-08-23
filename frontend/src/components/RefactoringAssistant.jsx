/**
 * RefactoringAssistant — Refactoring advisor component
 */

import React from 'react';

const RefactoringAssistant = ({ recommendations = [], onApplyRefactor }) => {
  const getRiskBadge = (risk) => {
    if (risk === 'low') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (risk === 'medium') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="p-5 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <i className="pi pi-sliders-h text-purple-400 text-lg" />
        <h3 className="font-semibold text-base text-[var(--nm-text-primary)]">AI Refactoring Assistant</h3>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-xs text-[var(--nm-text-muted)] italic">
          No refactoring suggestions available for current layout structure.
        </p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-xs flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--nm-text-primary)] text-sm">
                  {rec.changes?.[0] || 'Layout Refactoring'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getRiskBadge(rec.risk)}`}>
                  {rec.risk || 'low'} risk
                </span>
              </div>
              <p className="text-[var(--nm-text-secondary)]">{rec.reason}</p>

              {rec.targetElementIds?.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--nm-text-muted)] font-mono">
                  <span>Targets:</span>
                  <span className="truncate">{rec.targetElementIds.join(', ')}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onApplyRefactor && onApplyRefactor(rec)}
                  className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <i className="pi pi-bolt text-[10px]" /> Apply Refactor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RefactoringAssistant;

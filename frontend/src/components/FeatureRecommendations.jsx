/**
 * FeatureRecommendations — Displays domain feature recommendations
 */

import React from 'react';

const FeatureRecommendations = ({ features = [] }) => {
  const getPriorityBadge = (prio) => {
    if (prio === 'high') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (prio === 'medium') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="p-5 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <i className="pi pi-lightbulb text-amber-400 text-lg" />
        <h3 className="font-semibold text-base text-[var(--nm-text-primary)]">Feature Recommendation Engine</h3>
      </div>

      {features.length === 0 ? (
        <p className="text-xs text-[var(--nm-text-muted)] italic">
          No additional feature recommendations for current requirement context.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-xs flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--nm-text-primary)] text-sm">{feat.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPriorityBadge(feat.priority)}`}>
                  {feat.priority || 'medium'}
                </span>
              </div>
              <p className="text-[var(--nm-text-secondary)] leading-relaxed">{feat.reason}</p>
              {feat.confidence && (
                <span className="text-[10px] font-mono text-[var(--nm-text-muted)]">
                  Confidence: {Math.round(feat.confidence * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeatureRecommendations;

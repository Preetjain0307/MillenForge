import React from 'react';

const UIQualityScorePanel = ({ qualityData }) => {
  if (!qualityData) {
    return (
      <div className="p-4 rounded-lg bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] text-sm border border-[var(--nm-border-subtle)]">
        No UI Quality score available.
      </div>
    );
  }

  const { score = 85, grade = 'A', categories = [], issues = [], recommendations = [] } = qualityData;

  const gradeColors = {
    A: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    B: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    C: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    D: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    F: 'text-red-400 bg-red-500/15 border-red-500/30',
  };

  return (
    <div className="flex flex-col gap-6 text-sm text-[var(--nm-text-primary)]">
      {/* Overall Score Badge */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--nm-bg-surface)] to-[rgba(108,99,255,0.1)] border border-[var(--nm-border)] flex items-center justify-between flex-wrap gap-4 shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-widest text-[var(--nm-text-muted)] font-semibold block mb-1">
            Overall UI Quality Score
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-[var(--nm-text-primary)] tracking-tight">{score}</span>
            <span className="text-sm font-semibold text-[var(--nm-text-muted)]">/ 100 Points</span>
          </div>
        </div>

        <div className={`px-5 py-2.5 rounded-xl border flex items-center gap-3 ${gradeColors[grade] || gradeColors.B}`}>
          <span className="text-3xl font-extrabold">{grade}</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider">Quality Grade</span>
            <span className="text-xs font-medium">
              {score >= 90 ? 'Production Ready' : score >= 80 ? 'High Quality' : score >= 70 ? 'Acceptable' : 'Needs Polish'}
            </span>
          </div>
        </div>
      </div>

      {/* 10 Category Breakdown Bars */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--nm-text-muted)] flex items-center gap-2">
            <i className="pi pi-chart-bar text-[var(--nm-accent-light)]" />
            Quality Category Breakdown (10 Metrics)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--nm-text-secondary)]">{cat.name}</span>
                  <span className="font-bold text-[var(--nm-accent-light)]">{cat.score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--nm-accent)] to-[var(--nm-accent-light)] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <i className="pi pi-[var(--nm-warning)]" />
            Detected Quality Issues ({issues.length})
          </h5>
          <ul className="space-y-1.5 text-xs text-[var(--nm-text-secondary)]">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <i className="pi pi-check-circle" />
            Actionable Recommendations ({recommendations.length})
          </h5>
          <ul className="space-y-1.5 text-xs text-[var(--nm-text-secondary)]">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UIQualityScorePanel;

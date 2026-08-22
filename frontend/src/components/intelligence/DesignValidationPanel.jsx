import React from 'react';

const DesignValidationPanel = ({ designData }) => {
  if (!designData) {
    return (
      <div className="p-4 rounded-lg bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] text-sm border border-[var(--nm-border-subtle)]">
        No design-to-code validation data available.
      </div>
    );
  }

  const {
    matchScore = 90,
    missingSections = [],
    missingCTAs = [],
    missingImages = [],
    elementMismatchCount = 0,
    semanticFindings = [],
  } = designData;

  return (
    <div className="flex flex-col gap-5 text-sm text-[var(--nm-text-primary)]">
      {/* Design Match Score Banner */}
      <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[rgba(108,99,255,0.15)] border border-[rgba(108,99,255,0.3)] flex items-center justify-center text-[var(--nm-accent-light)] font-extrabold text-lg">
            {matchScore}%
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">Semantic Design-to-Code Match</h4>
            <p className="text-xs text-[var(--nm-text-muted)]">
              Compares prompt intent against generated UIPage layout contract.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--nm-text-muted)]">Mismatches:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${elementMismatchCount === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
            {elementMismatchCount} item{elementMismatchCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Missing Elements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)] tracking-wider block">Missing Sections</span>
          <span className="text-xs font-semibold text-[var(--nm-text-primary)]">
            {missingSections.length === 0 ? '✓ None (All present)' : missingSections.join(', ')}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)] tracking-wider block">Missing CTAs</span>
          <span className="text-xs font-semibold text-[var(--nm-text-primary)]">
            {missingCTAs.length === 0 ? '✓ None (All present)' : missingCTAs.join(', ')}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)] tracking-wider block">Missing Visuals</span>
          <span className="text-xs font-semibold text-[var(--nm-text-primary)]">
            {missingImages.length === 0 ? '✓ None (All present)' : missingImages.join(', ')}
          </span>
        </div>
      </div>

      {/* Semantic Findings List */}
      <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--nm-accent-light)] flex items-center gap-1.5">
          <i className="pi pi-search text-xs" />
          Semantic Intent Analysis
        </h5>
        <ul className="space-y-1.5 text-xs text-[var(--nm-text-secondary)]">
          {semanticFindings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[var(--nm-accent)] font-bold">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DesignValidationPanel;

import React from 'react';

const ArchitectureRecommendationPanel = ({ architectureData, patternData }) => {
  const arch = architectureData || {};
  const pattern = patternData || {};

  return (
    <div className="flex flex-col gap-6 text-sm text-[var(--nm-text-primary)]">
      {/* 1. Frontend Architecture Recommendation */}
      <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="pi pi-sitemap text-lg text-[var(--nm-accent-light)]" />
            <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">
              Recommended Architecture Pattern
            </h4>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)] uppercase tracking-wide">
            {arch.architecture || 'feature-based'}
          </span>
        </div>

        <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
          {arch.reason || 'Optimal structure determined based on domain component density and page requirements.'}
        </p>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--nm-text-muted)] font-medium">State Management:</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono text-[11px] border border-purple-500/30">
            {arch.stateManagement || 'Redux Toolkit'}
          </span>
        </div>

        {/* Directory Structure */}
        {arch.recommendedStructure?.length > 0 && (
          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-[var(--nm-text-muted)] mb-2">
              Recommended Directory Organization
            </h5>
            <div className="p-3 rounded-lg bg-black/40 border border-[var(--nm-border-subtle)] font-mono text-[11px] text-[var(--nm-text-secondary)] space-y-1">
              {arch.recommendedStructure.map((path, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <i className="pi pi-folder text-amber-400 text-xs" />
                  <span>{path}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. MVC vs MVVM Pattern Recommendation */}
      <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="pi pi-box text-lg text-emerald-400" />
            <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">
              Application Design Pattern
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--nm-text-muted)]">Confidence:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {Math.round((pattern.confidence || 0.9) * 100)}% {pattern.recommendedPattern || 'MVVM'}
            </span>
          </div>
        </div>

        <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
          {pattern.reason || 'Pattern decouples UI state management from presentation components.'}
        </p>

        {/* Layers Table */}
        {pattern.layers?.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[var(--nm-border-subtle)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/30 text-[var(--nm-text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--nm-border-subtle)]">
                  <th className="p-2.5">Layer</th>
                  <th className="p-2.5">Responsibility & Implementation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nm-border-subtle)]">
                {pattern.layers.map((layer, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-2.5 font-bold font-mono text-[var(--nm-accent-light)]">{layer.name}</td>
                    <td className="p-2.5 text-[var(--nm-text-secondary)]">{layer.responsibility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
          <i className="pi pi-info-circle text-xs" />
          <span>This recommendation is advisory for developers and does not mutate active codebase structure.</span>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureRecommendationPanel;

import React from 'react';

const RequirementAnalysisPanel = ({ data }) => {
  if (!data) {
    return (
      <div className="p-4 rounded-lg bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] text-sm border border-[var(--nm-border-subtle)]">
        No requirement analysis data available.
      </div>
    );
  }

  const { summary, missingRequirements = [], priorities = [], assumptions = [], recommendedQuestions = [] } = data;

  return (
    <div className="flex flex-col gap-6 text-sm text-[var(--nm-text-primary)]">
      {/* Executive Summary */}
      <div className="p-4 rounded-xl bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.25)]">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--nm-accent-light)] mb-1 flex items-center gap-2">
          <i className="pi pi-compass text-sm" />
          AI Requirement Analysis Summary
        </h4>
        <p className="text-xs sm:text-sm text-[var(--nm-text-secondary)] leading-relaxed">
          {summary || 'Analysis complete.'}
        </p>
      </div>

      {/* Missing Requirements List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--nm-text-muted)] mb-3 flex items-center gap-2">
          <i className="pi pi-exclamation-triangle text-amber-400" />
          Identified Requirement Gaps ({missingRequirements.length})
        </h4>
        {missingRequirements.length === 0 ? (
          <p className="text-xs text-[var(--nm-success)] flex items-center gap-1.5">
            <i className="pi pi-check-circle" />
            No critical requirement gaps detected in prompt scope.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {missingRequirements.map((item, idx) => {
              const severityColor =
                item.severity === 'high' || item.severity === 'critical'
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : item.severity === 'medium'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex flex-col gap-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-xs text-[var(--nm-text-primary)]">{item.title}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${severityColor}`}>
                      {item.severity || 'medium'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--nm-text-secondary)]">{item.description}</p>
                  {item.reason && (
                    <p className="text-[11px] font-mono text-[var(--nm-text-muted)] italic">
                      Rationale: {item.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Requirement Prioritization Table */}
      {priorities.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--nm-text-muted)] mb-3 flex items-center gap-2">
            <i className="pi pi-list-check text-[var(--nm-accent-light)]" />
            Prioritization Matrix
          </h4>
          <div className="overflow-x-auto rounded-lg border border-[var(--nm-border-subtle)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--nm-border-subtle)]">
                  <th className="p-2.5">Requirement</th>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Impact</th>
                  <th className="p-2.5">Effort</th>
                  <th className="p-2.5">Confidence</th>
                  <th className="p-2.5">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nm-border-subtle)]">
                {priorities.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-2.5 font-medium font-mono text-[11px] text-[var(--nm-accent-light)]">{p.requirementId || `req-${idx + 1}`}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 text-[10px] rounded-full font-bold uppercase bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)]">
                        {p.priority || 'high'}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-[var(--nm-text-primary)]">{p.impact}/10</td>
                    <td className="p-2.5 text-[var(--nm-text-secondary)]">{p.effort}/10</td>
                    <td className="p-2.5 text-[var(--nm-success)]">{Math.round((p.confidence || 0.9) * 100)}%</td>
                    <td className="p-2.5 text-[var(--nm-text-secondary)] max-w-xs truncate">{p.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assumptions & Recommended Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assumptions.length > 0 && (
          <div className="p-3.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
            <h5 className="text-xs font-semibold text-[var(--nm-text-secondary)] mb-2 flex items-center gap-1.5">
              <i className="pi pi-info-circle text-blue-400" />
              Labeled Assumptions
            </h5>
            <ul className="space-y-1 list-disc list-inside text-xs text-[var(--nm-text-muted)]">
              {assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {recommendedQuestions.length > 0 && (
          <div className="p-3.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
            <h5 className="text-xs font-semibold text-[var(--nm-text-secondary)] mb-2 flex items-center gap-1.5">
              <i className="pi pi-question-circle text-purple-400" />
              Recommended Clarifying Questions
            </h5>
            <ul className="space-y-1 list-disc list-inside text-xs text-[var(--nm-text-muted)]">
              {recommendedQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementAnalysisPanel;

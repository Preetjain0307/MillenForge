/**
 * AgentReviewCard — Renders individual AI Reviewer Agent findings
 *
 * Roles: UX, Visual, Accessibility, Engineering, Product
 */

import React from 'react';

const AGENT_META = {
  ux: { label: 'UX Reviewer', icon: 'pi pi-user', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  visual: { label: 'Visual Reviewer', icon: 'pi pi-palette', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  accessibility: { label: 'Accessibility Reviewer', icon: 'pi pi-eye', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  engineering: { label: 'Engineering Reviewer', icon: 'pi pi-cog', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  product: { label: 'Product Reviewer', icon: 'pi pi-chart-line', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
};

const AgentReviewCard = ({ agentData }) => {
  if (!agentData) return null;

  const { agent, score = 0, issues = [], recommendations = [] } = agentData;
  const meta = AGENT_META[agent?.toLowerCase()] || {
    label: `${agent?.toUpperCase()} Reviewer`,
    icon: 'pi pi-shield',
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  const getScoreBadgeClass = (val) => {
    if (val >= 85) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (val >= 70) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  return (
    <div className={`p-4 rounded-[var(--nm-radius-sm)] border bg-[var(--nm-bg-surface)] ${meta.color} flex flex-col gap-3 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`${meta.icon} text-base`} />
          <span className="font-medium text-sm text-[var(--nm-text-primary)]">{meta.label}</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${getScoreBadgeClass(score)}`}>
          {score} / 100
        </span>
      </div>

      {issues.length > 0 && (
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-rose-400/90 flex items-center gap-1">
            <i className="pi pi-exclamation-circle text-[10px]" /> Issues ({issues.length})
          </span>
          <ul className="list-disc list-inside text-[var(--nm-text-secondary)] space-y-0.5">
            {issues.map((iss, idx) => (
              <li key={idx} className="truncate">{iss}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-emerald-400/90 flex items-center gap-1">
            <i className="pi pi-check-circle text-[10px]" /> Recommendations ({recommendations.length})
          </span>
          <ul className="list-disc list-inside text-[var(--nm-text-secondary)] space-y-0.5">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="truncate">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AgentReviewCard;

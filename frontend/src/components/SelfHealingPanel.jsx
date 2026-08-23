/**
 * SelfHealingPanel — Displays self-healing status, confidence, and repair details
 */

import React from 'react';

const SelfHealingPanel = ({ repairs = [], onTriggerHealing, isHealing = false }) => {
  return (
    <div className="p-5 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="pi pi-shield text-indigo-400 text-lg" />
          <h3 className="font-semibold text-base text-[var(--nm-text-primary)]">Self-Healing UI Engine</h3>
        </div>
        <button
          onClick={onTriggerHealing}
          disabled={isHealing}
          className="px-3 py-1.5 rounded-[var(--nm-radius-sm)] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <i className={`pi ${isHealing ? 'pi-spin pi-spinner' : 'pi-wrench'}`} />
          {isHealing ? 'Healing Page...' : 'Run Self-Healing Pass'}
        </button>
      </div>

      {repairs.length === 0 ? (
        <div className="p-4 rounded-[var(--nm-radius-sm)] bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <i className="pi pi-check-circle text-sm text-emerald-400" />
          <span>UIPage structure is fully healthy. Zero schema or contract repairs required.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-[var(--nm-text-secondary)]">
            Applied Repairs ({repairs.length})
          </span>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {repairs.map((rep, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--nm-text-primary)] flex items-center gap-1.5">
                    <i className="pi pi-cog text-indigo-400 text-xs" />
                    {rep.repair}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                    Confidence: {Math.round((rep.confidence || 0.95) * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-[var(--nm-border-subtle)] text-[var(--nm-text-muted)]">
                  <div className="truncate">
                    <span className="text-rose-400 font-semibold">Before:</span> {String(rep.before)}
                  </div>
                  <div className="truncate">
                    <span className="text-emerald-400 font-semibold">After:</span> {String(rep.after)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfHealingPanel;

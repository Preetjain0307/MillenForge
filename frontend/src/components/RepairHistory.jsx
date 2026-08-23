/**
 * RepairHistory — Audit trail timeline of applied UIPage repairs
 */

import React from 'react';

const RepairHistory = ({ repairs = [] }) => {
  if (!repairs || repairs.length === 0) return null;

  return (
    <div className="p-4 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex flex-col gap-3">
      <h4 className="font-semibold text-xs text-[var(--nm-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
        <i className="pi pi-history text-indigo-400 text-sm" />
        Repair History Log ({repairs.length})
      </h4>
      <div className="space-y-2">
        {repairs.map((rep, idx) => (
          <div key={idx} className="p-2.5 rounded bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-xs flex items-center justify-between">
            <span className="text-[var(--nm-text-secondary)] font-medium">{rep.repair}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              OK
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepairHistory;

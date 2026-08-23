/**
 * DiagramEdge — Visual component representing a edge connection between two nodes
 */

import React from 'react';

const DiagramEdge = ({ edge, sourceNode, targetNode, onRemove }) => {
  const sourceName = sourceNode?.label || edge.source;
  const targetName = targetNode?.label || edge.target;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-xs text-[var(--nm-text-secondary)]">
      <div className="flex items-center gap-2 font-mono flex-wrap">
        <span className="px-2 py-0.5 rounded bg-[var(--nm-bg-primary)] text-[var(--nm-text-primary)] border border-[var(--nm-border-subtle)]">
          {sourceName}
        </span>
        <i className="pi pi-arrow-right text-[var(--nm-accent-light)] text-[10px]" />
        <span className="px-2 py-0.5 rounded bg-[var(--nm-bg-primary)] text-[var(--nm-text-primary)] border border-[var(--nm-border-subtle)]">
          {targetName}
        </span>
        {edge.label && (
          <span className="text-[11px] text-[var(--nm-text-muted)] italic">
            ({edge.label})
          </span>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(edge.id)}
          className="p-1 rounded text-[var(--nm-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remove connection"
        >
          <i className="pi pi-times text-xs" />
        </button>
      )}
    </div>
  );
};

export default DiagramEdge;

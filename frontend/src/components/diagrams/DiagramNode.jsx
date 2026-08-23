/**
 * DiagramNode — Visual component for a single node in PatternDiagramEditor
 */

import React from 'react';

const NODE_ICON_MAP = {
  page: 'pi pi-file',
  section: 'pi pi-th-large',
  container: 'pi pi-box',
  navbar: 'pi pi-bars',
  hero: 'pi pi-star-fill',
  form: 'pi pi-file-edit',
  card: 'pi pi-credit-card',
  list: 'pi pi-list',
  button: 'pi pi-circle-fill',
  footer: 'pi pi-window-maximize',
  modal: 'pi pi-clone',
  dashboard: 'pi pi-chart-line',
};

const DiagramNode = ({
  node,
  isSelected,
  onSelect,
  onRemove,
  onConnectStart,
  isConnectSource,
}) => {
  const iconClass = NODE_ICON_MAP[node.type] || 'pi pi-box';

  return (
    <div
      onClick={() => onSelect && onSelect(node.id)}
      className={`
        p-3.5 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer select-none relative group
        ${isSelected
          ? 'bg-[rgba(108,99,255,0.2)] border-[var(--nm-accent)] shadow-[0_0_16px_var(--nm-accent-glow)]'
          : isConnectSource
          ? 'bg-[rgba(34,197,94,0.15)] border-[var(--nm-success)] ring-2 ring-[var(--nm-success)]'
          : 'bg-[var(--nm-bg-card)] border-[var(--nm-border-subtle)] hover:border-[var(--nm-border)] hover:bg-[var(--nm-bg-surface)]'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center justify-center text-[var(--nm-accent-light)]">
            <i className={`${iconClass} text-xs`} />
          </div>
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[var(--nm-bg-primary)] text-[var(--nm-text-muted)] border border-[var(--nm-border-subtle)]">
            {node.type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onConnectStart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConnectStart(node.id);
              }}
              className="p-1 rounded text-xs text-[var(--nm-text-muted)] hover:text-[var(--nm-success)] hover:bg-[rgba(34,197,94,0.1)] transition-colors"
              title="Connect to another node"
            >
              <i className="pi pi-share-alt text-xs" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(node.id);
              }}
              className="p-1 rounded text-xs text-[var(--nm-text-muted)] hover:text-[var(--nm-error)] hover:bg-red-500/10 transition-colors"
              title="Delete node"
            >
              <i className="pi pi-trash text-xs" />
            </button>
          )}
        </div>
      </div>

      <h4 className="text-sm font-bold text-[var(--nm-text-primary)] leading-tight">
        {node.label || node.id}
      </h4>
    </div>
  );
};

export default DiagramNode;

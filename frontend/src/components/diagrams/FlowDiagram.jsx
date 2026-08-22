/**
 * FlowDiagram — Visual Flowchart Representation of a Generated UIPage Structure
 */

import React from 'react';
import { uiPageToFlowDiagram } from '../../types/diagram.js';

const FlowDiagram = ({ uiPage }) => {
  const flow = uiPageToFlowDiagram(uiPage);

  return (
    <div className="nm-card flex flex-col gap-4 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] p-5 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-sitemap text-[var(--nm-accent-light)]" />
            <span>UI Navigation & Component Flow</span>
          </h4>
          <p className="text-xs text-[var(--nm-text-muted)]">
            Inferred flow representation of section hierarchy and interactive button CTAs.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border-subtle)]">
          {flow.nodes.length} Nodes · {flow.edges.length} Links
        </span>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {flow.nodes.map((node) => {
            const isPage = node.type === 'page';
            const isAction = node.type === 'action';

            return (
              <div
                key={node.id}
                className={`p-3 rounded-lg border flex flex-col gap-1 text-xs transition-all ${
                  isPage
                    ? 'bg-[rgba(108,99,255,0.15)] border-[var(--nm-accent)] text-[var(--nm-accent-light)] font-bold'
                    : isAction
                    ? 'bg-[rgba(34,197,94,0.15)] border-[var(--nm-success)] text-[var(--nm-success)] font-semibold'
                    : 'bg-[var(--nm-bg-surface)] border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase opacity-70">
                    {node.type}
                  </span>
                  <i
                    className={
                      isPage ? 'pi pi-file text-xs' : isAction ? 'pi pi-bolt text-xs' : 'pi pi-th-large text-xs'
                    }
                  />
                </div>
                <span className="truncate">{node.label}</span>
              </div>
            );
          })}
        </div>

        {flow.edges.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 border-t border-[var(--nm-border-subtle)]">
            <span className="text-[11px] font-mono uppercase text-[var(--nm-text-muted)]">
              Inferred Interactions & Transitions
            </span>
            <div className="flex flex-wrap gap-2">
              {flow.edges.map((edge) => {
                const srcNode = flow.nodes.find((n) => n.id === edge.source);
                const tgtNode = flow.nodes.find((n) => n.id === edge.target);

                return (
                  <div
                    key={edge.id}
                    className="px-2.5 py-1 rounded bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[11px] font-mono text-[var(--nm-text-secondary)] flex items-center gap-1.5"
                  >
                    <span>{srcNode?.label || edge.source}</span>
                    <i className="pi pi-arrow-right text-[10px] text-[var(--nm-accent-light)]" />
                    <span>{tgtNode?.label || edge.target}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowDiagram;

/**
 * PatternToUiPanel — Preset Pattern Selector & Diagram Converter Panel
 */

import React, { useState } from 'react';
import PatternDiagramEditor from './PatternDiagramEditor.jsx';
import { patternToUiPage, DIAGRAM_NODE_TYPES } from '../../types/diagram.js';

const PRESET_PATTERNS = [
  {
    id: 'preset-landing',
    name: 'SaaS Landing Page Flow',
    description: 'Navbar → Hero → Feature Cards → Pricing → Footer',
    nodes: [
      { id: 'n1', label: 'Main Header Nav', type: DIAGRAM_NODE_TYPES.NAVBAR },
      { id: 'n2', label: 'Split Hero CTA', type: DIAGRAM_NODE_TYPES.HERO },
      { id: 'n3', label: 'Feature Cards Grid', type: DIAGRAM_NODE_TYPES.CARD },
      { id: 'n4', label: 'Footer Links', type: DIAGRAM_NODE_TYPES.FOOTER },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', label: 'scroll' },
      { id: 'e2', source: 'n2', target: 'n3', label: 'explore' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'footer' },
    ],
  },
  {
    id: 'preset-dashboard',
    name: 'Analytics Dashboard Flow',
    description: 'Header → KPI Cards → Data Table → Quick Form',
    nodes: [
      { id: 'd1', label: 'Dashboard Top Bar', type: DIAGRAM_NODE_TYPES.NAVBAR },
      { id: 'd2', label: 'MRR & User Metrics', type: DIAGRAM_NODE_TYPES.DASHBOARD },
      { id: 'd3', label: 'Recent Transactions List', type: DIAGRAM_NODE_TYPES.LIST },
    ],
    edges: [
      { id: 'de1', source: 'd1', target: 'd2', label: 'view' },
      { id: 'de2', source: 'd2', target: 'd3', label: 'drilldown' },
    ],
  },
  {
    id: 'preset-auth',
    name: 'Authentication & Portal Flow',
    description: 'Login Form → Profile Dashboard',
    nodes: [
      { id: 'a1', label: 'Account Sign In Form', type: DIAGRAM_NODE_TYPES.FORM },
      { id: 'a2', label: 'User Profile Portal', type: DIAGRAM_NODE_TYPES.CARD },
    ],
    edges: [
      { id: 'ae1', source: 'a1', target: 'a2', label: 'submit auth' },
    ],
  },
];

const PatternToUiPanel = ({ onCompileUipage }) => {
  const [activeDiagram, setActiveDiagram] = useState(PRESET_PATTERNS[0]);

  const handleSelectPreset = (preset) => {
    setActiveDiagram({
      name: preset.name,
      nodes: [...preset.nodes],
      edges: [...preset.edges],
    });
  };

  const handleCompile = (diagramToCompile) => {
    const compiledUipage = patternToUiPage(diagramToCompile || activeDiagram);
    if (onCompileUipage) onCompileUipage(compiledUipage);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Preset Pattern Cards */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-bold text-[var(--nm-text-primary)] uppercase tracking-wider">
          Quick Preset Pattern Flow Templates
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRESET_PATTERNS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="p-4 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] hover:border-[var(--nm-accent)] hover:bg-[var(--nm-bg-surface)] cursor-pointer transition-all flex flex-col gap-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--nm-accent-light)]">
                  {preset.nodes.length} Nodes
                </span>
                <i className="pi pi-arrow-right text-xs text-[var(--nm-text-muted)] group-hover:text-[var(--nm-accent-light)] group-hover:translate-x-1 transition-all" />
              </div>
              <h5 className="text-sm font-bold text-[var(--nm-text-primary)]">
                {preset.name}
              </h5>
              <p className="text-xs text-[var(--nm-text-muted)] leading-relaxed">
                {preset.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Component */}
      <PatternDiagramEditor
        initialDiagram={activeDiagram}
        onDiagramChange={setActiveDiagram}
        onConvertToUi={handleCompile}
      />
    </div>
  );
};

export default PatternToUiPanel;

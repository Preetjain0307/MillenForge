/**
 * PatternDiagramEditor — Interactive Lightweight Pattern Diagram Editor Component
 *
 * Actions:
 * - Add Node (page, section, navbar, hero, form, card, button, footer, etc.)
 * - Rename & Edit Node Label
 * - Connect Nodes (Source -> Target)
 * - Remove Node & Remove Edge
 * - Export JSON / Import JSON
 * - Convert Diagram → UIPage
 */

import React, { useState } from 'react';
import DiagramNode from './DiagramNode.jsx';
import DiagramEdge from './DiagramEdge.jsx';
import {
  DIAGRAM_NODE_TYPES,
  createEmptyDiagram,
  addNode as addNodeHelper,
  removeNode as removeNodeHelper,
  addEdge as addEdgeHelper,
  removeEdge as removeEdgeHelper,
  exportDiagram,
  importDiagram,
} from '../../types/diagram.js';
import NmButton from '../NmButton.jsx';

const PatternDiagramEditor = ({
  initialDiagram,
  onDiagramChange,
  onConvertToUi,
}) => {
  const [diagram, setDiagram] = useState(() => initialDiagram || createEmptyDiagram('My Custom UI Diagram'));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectSourceId, setConnectSourceId] = useState(null);
  const [newNodeType, setNewNodeType] = useState(DIAGRAM_NODE_TYPES.SECTION);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const updateDiagram = (nextDiagram) => {
    setDiagram(nextDiagram);
    if (onDiagramChange) onDiagramChange(nextDiagram);
  };

  const handleAddNode = (e) => {
    e.preventDefault();
    const label = newNodeLabel.trim() || `${newNodeType.toUpperCase()} Node`;
    const updated = addNodeHelper(diagram, { type: newNodeType, label });
    updateDiagram(updated);
    setNewNodeLabel('');
  };

  const handleRemoveNode = (id) => {
    const updated = removeNodeHelper(diagram, id);
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (connectSourceId === id) setConnectSourceId(null);
    updateDiagram(updated);
  };

  const handleConnectStart = (nodeId) => {
    if (!connectSourceId) {
      setConnectSourceId(nodeId);
    } else if (connectSourceId === nodeId) {
      setConnectSourceId(null);
    } else {
      const updated = addEdgeHelper(diagram, { source: connectSourceId, target: nodeId });
      updateDiagram(updated);
      setConnectSourceId(null);
    }
  };

  const handleRemoveEdge = (edgeId) => {
    const updated = removeEdgeHelper(diagram, edgeId);
    updateDiagram(updated);
  };

  const handleExportJson = () => {
    const jsonStr = exportDiagram(diagram);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagram.name || 'diagram'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = importDiagram(importJsonText);
    if (res.valid || res.diagram) {
      updateDiagram(res.diagram);
      setShowImportModal(false);
      setImportJsonText('');
    } else {
      setErrorMsg(res.errors?.join(', ') || 'Invalid JSON format');
    }
  };

  const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeId);

  const handleRenameNode = (newLabel) => {
    if (!selectedNodeId) return;
    const updatedNodes = diagram.nodes.map((n) => (n.id === selectedNodeId ? { ...n, label: newLabel } : n));
    updateDiagram({ ...diagram, nodes: updatedNodes });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Editor Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-[var(--nm-radius-md)] nm-glass border border-[var(--nm-border-subtle)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-sitemap text-[var(--nm-accent-light)]" />
            <span>Pattern Diagram Editor</span>
          </h3>
          <p className="text-xs text-[var(--nm-text-secondary)]">
            Define system & layout nodes, connect relationships, and convert into a canonical UIPage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <NmButton
            variant="ghost"
            label="Import JSON"
            icon="pi pi-upload"
            onClick={() => setShowImportModal(!showImportModal)}
            className="text-xs px-3 py-1.5"
          />
          <NmButton
            variant="ghost"
            label="Export JSON"
            icon="pi pi-download"
            onClick={handleExportJson}
            className="text-xs px-3 py-1.5"
          />
          {onConvertToUi && (
            <NmButton
              variant="primary"
              label="Compile to UIPage"
              icon="pi pi-bolt"
              onClick={() => onConvertToUi(diagram)}
              className="text-xs px-4 py-1.5 shadow-[0_0_12px_var(--nm-accent-glow)]"
            />
          )}
        </div>
      </div>

      {/* Import Modal / Panel */}
      {showImportModal && (
        <form onSubmit={handleImportJsonSubmit} className="nm-card flex flex-col gap-3 border border-[var(--nm-border)] bg-[var(--nm-bg-surface)] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">Import Diagram JSON</h4>
            <button type="button" onClick={() => setShowImportModal(false)} className="text-xs text-[var(--nm-text-muted)] hover:text-white">
              <i className="pi pi-times" />
            </button>
          </div>
          <textarea
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Paste raw diagram JSON ({ nodes: [], edges: [] })..."
            className="w-full h-32 p-3 font-mono text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
          />
          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
          <div className="flex justify-end gap-2">
            <NmButton variant="secondary" label="Cancel" onClick={() => setShowImportModal(false)} className="text-xs px-3 py-1" />
            <NmButton variant="primary" label="Validate & Load" type="submit" className="text-xs px-3 py-1" />
          </div>
        </form>
      )}

      {/* Add Node Controls */}
      <form onSubmit={handleAddNode} className="flex items-center gap-3 flex-wrap p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[11px] font-medium text-[var(--nm-text-muted)] uppercase tracking-wider">Node Type</label>
          <select
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
          >
            {Object.values(DIAGRAM_NODE_TYPES).map((type) => (
              <option key={type} value={type}>{type.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
          <label className="text-[11px] font-medium text-[var(--nm-text-muted)] uppercase tracking-wider">Node Label</label>
          <input
            type="text"
            value={newNodeLabel}
            onChange={(e) => setNewNodeLabel(e.target.value)}
            placeholder="e.g. Hero Banner, Product Grid, Auth Form..."
            className="px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
          />
        </div>

        <div className="flex items-end pt-5">
          <NmButton variant="secondary" label="Add Node" icon="pi pi-plus" type="submit" className="text-xs px-4 py-2" />
        </div>
      </form>

      {/* Node Connection Prompt Banner */}
      {connectSourceId && (
        <div className="p-3 rounded-lg bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-xs text-[var(--nm-success)] flex items-center justify-between">
          <span>Click target node to connect edge from <strong>"{diagram.nodes.find(n => n.id === connectSourceId)?.label}"</strong>.</span>
          <button type="button" onClick={() => setConnectSourceId(null)} className="underline font-bold">Cancel</button>
        </div>
      )}

      {/* Nodes Canvas Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[var(--nm-text-primary)] uppercase tracking-wider">
            Diagram Nodes ({diagram.nodes.length})
          </h4>
          {selectedNode && (
            <div className="flex items-center gap-2 text-xs text-[var(--nm-text-secondary)]">
              <span>Rename selected:</span>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => handleRenameNode(e.target.value)}
                className="px-2 py-1 text-xs rounded bg-[var(--nm-bg-primary)] border border-[var(--nm-border)] text-[var(--nm-text-primary)]"
              />
            </div>
          )}
        </div>

        {diagram.nodes.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--nm-border)] text-center text-xs text-[var(--nm-text-muted)]">
            No nodes added yet. Use the control panel above to add section & flow nodes.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {diagram.nodes.map((node) => (
              <DiagramNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isConnectSource={connectSourceId === node.id}
                onSelect={setSelectedNodeId}
                onRemove={handleRemoveNode}
                onConnectStart={handleConnectStart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Connections List */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[var(--nm-border-subtle)]">
        <h4 className="text-sm font-bold text-[var(--nm-text-primary)] uppercase tracking-wider">
          Node Connections / Edges ({diagram.edges.length})
        </h4>

        {diagram.edges.length === 0 ? (
          <p className="text-xs text-[var(--nm-text-muted)] italic">
            No node connections. Click the share icon on a node to link it to another node.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {diagram.edges.map((edge) => (
              <DiagramEdge
                key={edge.id}
                edge={edge}
                sourceNode={diagram.nodes.find((n) => n.id === edge.source)}
                targetNode={diagram.nodes.find((n) => n.id === edge.target)}
                onRemove={handleRemoveEdge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternDiagramEditor;

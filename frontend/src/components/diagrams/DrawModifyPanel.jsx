/**
 * DrawModifyPanel — Draw-to-Modify Visual Modification Workflow Panel
 *
 * Allows users to select a target element ID, pick an operation (update, insert, delete, move),
 * specify target properties, and apply structured immutable updates to Redux pagesSlice!
 */

import React, { useState } from 'react';
import { applyDrawModification } from '../../types/diagram.js';
import NmButton from '../NmButton.jsx';

const DrawModifyPanel = ({ uiPage, onApplyModification, selectedElementId }) => {
  const [targetId, setTargetId] = useState(selectedElementId || '');
  const [operation, setOperation] = useState('update');
  const [promptText, setPromptText] = useState('');
  const [newContent, setNewContent] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  // Extract all available element IDs from uiPage
  const availableElements = (() => {
    if (!uiPage || !Array.isArray(uiPage.sections)) return [];
    const list = [];
    uiPage.sections.forEach((sec) => {
      list.push({ id: sec.id, label: `Section: ${sec.id} (${sec.type})`, isSec: true });
      if (Array.isArray(sec.elements)) {
        sec.elements.forEach((el) => {
          list.push({ id: el.id, label: `Element: ${el.id} (${el.type})`, isSec: false });
        });
      }
    });
    return list;
  })();

  const handleSubmitMod = (e) => {
    e.preventDefault();
    if (!targetId) {
      setStatusMsg({ type: 'error', text: 'Please select a target element ID.' });
      return;
    }

    const modRequest = {
      targetElementId: targetId,
      operation,
      changes: {
        content: newContent || undefined,
        reason: promptText,
        movePosition: operation === 'move' ? 'below-hero' : undefined,
      },
      reason: promptText || `User ${operation} action on ${targetId}`,
    };

    const updatedPage = applyDrawModification(uiPage, modRequest);
    setStatusMsg({ type: 'success', text: `Successfully applied "${operation}" modification to ${targetId}.` });

    if (onApplyModification) {
      onApplyModification(updatedPage, modRequest);
    }
  };

  return (
    <div className="nm-card flex flex-col gap-4 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] p-5 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-pencil text-[var(--nm-accent-light)]" />
            <span>Draw-to-Modify Layout & Content Tool</span>
          </h4>
          <p className="text-xs text-[var(--nm-text-muted)]">
            Perform targeted structural edits (update, insert, delete, move) on canonical UIPage data.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitMod} className="flex flex-col gap-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--nm-text-muted)] uppercase tracking-wider">
              Target Element / Section ID
            </label>
            <select
              value={targetId || selectedElementId || ''}
              onChange={(e) => setTargetId(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
            >
              <option value="">-- Select Target ID --</option>
              {availableElements.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--nm-text-muted)] uppercase tracking-wider">
              Operation Type
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
            >
              <option value="update">UPDATE (Modify content/props)</option>
              <option value="insert">INSERT (Add element to section)</option>
              <option value="delete">DELETE (Remove element/section)</option>
              <option value="move">MOVE (Reorder section position)</option>
            </select>
          </div>
        </div>

        {operation === 'update' && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--nm-text-muted)] uppercase tracking-wider">
              New Content String
            </label>
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Updated Headline or Button Label..."
              className="px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[var(--nm-text-muted)] uppercase tracking-wider">
            Natural Instruction / Reason
          </label>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder='e.g. "Make this heading bold", "Move section below hero"...'
            className="px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)]"
          />
        </div>

        {statusMsg && (
          <div
            className={`p-2.5 rounded-lg text-xs ${
              statusMsg.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] border border-[rgba(34,197,94,0.3)]'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <NmButton
            variant="primary"
            label="Apply Structured Modification"
            icon="pi pi-check"
            type="submit"
            className="text-xs px-4 py-2"
          />
        </div>
      </form>
    </div>
  );
};

export default DrawModifyPanel;

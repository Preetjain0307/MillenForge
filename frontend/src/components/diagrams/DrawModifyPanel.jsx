/**
 * DrawModifyPanel ΓÇö Draw-to-Modify Visual & Targeted Modification Workflow Panel
 * Owner: Preet Jain
 *
 * Communicates: "Edit with instructions instead of rebuilding."
 * Allows users to update individual sections, buttons, headings, cards, or images of their
 * generated website using natural-language instructions without regenerating the entire UI.
 */

import React, { useState } from 'react';
import { applyDrawModification } from '../../types/diagram.js';
import NmButton from '../NmButton.jsx';

// 4-Step How It Works Walkthrough Cards
const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Select Element',
    caption: 'Choose the section, button, image, card, or heading to edit.',
    icon: 'pi pi-bullseye',
    badgeColor: 'text-[var(--nm-accent-light)] bg-[var(--nm-accent-glow)] border-[var(--nm-border)]',
  },
  {
    step: 2,
    title: 'Choose Operation',
    caption: 'Update, Insert, Delete, or Move content.',
    icon: 'pi pi-sliders-h',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    step: 3,
    title: 'Describe the Change',
    caption: 'Write a simple instruction like a prompt.',
    icon: 'pi pi-pencil',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    step: 4,
    title: 'Apply Changes',
    caption: 'Only the selected part is updated while preserving the rest of the design.',
    icon: 'pi pi-check-circle',
    badgeColor: 'text-[var(--nm-success)] bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.25)]',
  },
];

// Clickable Example Instructions
const EXAMPLE_INSTRUCTION_CHIPS = [
  { label: 'Change hero title', prompt: "Change title to 'Fresh Meals Delivered in 30 Minutes'", operation: 'update' },
  { label: 'Replace food image', prompt: 'Replace with high quality organic sushi dish image', operation: 'update' },
  { label: 'Add pricing card', prompt: 'Add a new Pro Tier pricing card with $29/mo price', operation: 'insert' },
  { label: 'Move CTA button', prompt: 'Move the primary CTA button directly below heading', operation: 'move' },
  { label: 'Delete testimonials', prompt: 'Remove outdated customer testimonials section', operation: 'delete' },
  { label: 'Make heading bold', prompt: 'Make the section header text extra bold and vibrant', operation: 'update' },
];

// Operation Explanations
const OPERATION_EXPLANATIONS = {
  update: {
    label: 'UPDATE',
    tagline: 'Edit existing content or properties.',
    desc: 'Modifies text, labels, images, or styling on the targeted element.',
    color: 'text-[var(--nm-accent-light)] border-[var(--nm-accent)]/40 bg-[var(--nm-accent-glow)]',
  },
  insert: {
    label: 'INSERT',
    tagline: 'Add a new section or component.',
    desc: 'Injects a new element, card, or block into the chosen section.',
    color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  },
  delete: {
    label: 'DELETE',
    tagline: 'Remove the selected component.',
    desc: 'Removes the targeted element or section completely.',
    color: 'text-red-400 border-red-500/40 bg-red-500/10',
  },
  move: {
    label: 'MOVE',
    tagline: 'Change the position of the selected component.',
    desc: 'Reorders or shifts the position of the component in layout.',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  },
};

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

  // Handle clicking on an example instruction chip (Fills fields without auto-submitting)
  const handleChipClick = (chip) => {
    setPromptText(chip.prompt);
    if (chip.operation) {
      setOperation(chip.operation);
    }
  };

  const handleSubmitMod = (e) => {
    e.preventDefault();
    if (!targetId) {
      setStatusMsg({ type: 'error', text: 'Please choose the component you want to edit (Target Element ID).' });
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
    setStatusMsg({
      type: 'success',
      text: `Successfully applied "${operation.toUpperCase()}" modification to ${targetId}. The rest of the design was preserved intact!`,
    });

    if (onApplyModification) {
      onApplyModification(updatedPage, modRequest);
    }
  };

  const currentOpInfo = OPERATION_EXPLANATIONS[operation] || OPERATION_EXPLANATIONS.update;

  return (
    <div className="flex flex-col gap-6 w-full nm-animate-in">

      {/* ΓöÇΓöÇ 1. Hero Description & Purpose Banner ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div className="nm-card p-6 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] rounded-xl flex flex-col gap-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)]">
              Edit with instructions instead of rebuilding
            </span>
          </div>
          <span className="text-[11px] text-[var(--nm-text-muted)] font-mono">
            Targeted Precision Editing
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-pencil text-[var(--nm-accent-light)]" />
            <span>Draw-to-Modify ΓÇö Targeted Element Editor</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--nm-text-secondary)] mt-1 leading-relaxed max-w-3xl">
            Update individual sections of your generated website using natural-language instructions. Modify only what you select without regenerating the complete UI.
          </p>
        </div>

        {/* Workflow Pipeline Breadcrumbs */}
        <div className="pt-2 border-t border-[var(--nm-border-subtle)] flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] font-mono text-[var(--nm-text-muted)]">
          <span className="text-[var(--nm-text-secondary)] font-semibold">Workflow:</span>
          <span>Generate Website</span>
          <i className="pi pi-arrow-right text-[8px] text-[var(--nm-accent-light)]" />
          <span>Open Diagrams</span>
          <i className="pi pi-arrow-right text-[8px] text-[var(--nm-accent-light)]" />
          <span className="text-[var(--nm-accent-light)] font-bold">Select Target Element</span>
          <i className="pi pi-arrow-right text-[8px] text-[var(--nm-accent-light)]" />
          <span className="text-[var(--nm-accent-light)] font-bold">Choose Operation</span>
          <i className="pi pi-arrow-right text-[8px] text-[var(--nm-accent-light)]" />
          <span className="text-[var(--nm-accent-light)] font-bold">Write Instruction</span>
          <i className="pi pi-arrow-right text-[8px] text-[var(--nm-accent-light)]" />
          <span className="text-[var(--nm-success)] font-bold">Apply Change</span>
          <i className="pi pi-arrow-right text-[8px] text-[var(--nm-accent-light)]" />
          <span>Live Preview Updates</span>
        </div>
      </div>

      {/* ΓöÇΓöÇ 2. How It Works (4 Numbered Cards) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--nm-text-muted)] flex items-center gap-1.5">
          <i className="pi pi-info-circle text-[var(--nm-accent-light)]" />
          How It Works
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {HOW_IT_WORKS_STEPS.map((s) => (
            <div
              key={s.step}
              className="p-4 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] flex flex-col justify-between gap-3 relative overflow-hidden hover:border-[var(--nm-border)] transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${s.badgeColor}`}>
                  STEP {s.step}
                </span>
                <i className={`${s.icon} text-xs text-[var(--nm-text-muted)] group-hover:text-[var(--nm-accent-light)] transition-colors`} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[var(--nm-text-primary)] mb-1">
                  {s.title}
                </h4>
                <p className="text-xs text-[var(--nm-text-muted)] leading-relaxed">
                  {s.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ΓöÇΓöÇ 3. Compact Before / After Visual Example ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div className="nm-card p-4 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--nm-accent-light)] flex items-center gap-1.5">
            <i className="pi pi-sparkles" />
            Visual Example (Illustration)
          </span>
          <span className="text-[10px] text-[var(--nm-text-muted)]">
            Only the selected part changes ┬╖ All other components remain identical
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Before */}
          <div className="p-3 rounded-lg bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[var(--nm-text-muted)] font-bold">
              Before Modification
            </span>
            <div className="text-xs font-semibold text-[var(--nm-text-primary)]">
              Hero Heading: <span className="text-red-400 font-normal">"Welcome to FoodHub"</span>
            </div>
          </div>

          {/* Instruction */}
          <div className="p-3 rounded-lg bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.3)] flex flex-col gap-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[var(--nm-accent-light)] font-bold">
                Natural Instruction
              </span>
              <i className="pi pi-arrow-right text-[10px] text-[var(--nm-accent-light)] hidden md:block" />
            </div>
            <div className="text-xs font-mono text-[var(--nm-text-primary)]">
              "Change title to 'Fresh Meals Delivered in 30 Minutes'"
            </div>
          </div>

          {/* After */}
          <div className="p-3 rounded-lg bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.3)] flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[var(--nm-success)] font-bold">
              After Modification
            </span>
            <div className="text-xs font-semibold text-[var(--nm-text-primary)]">
              Hero Heading: <span className="text-[var(--nm-success)] font-bold">"Fresh Meals Delivered in 30 Minutes"</span>
            </div>
          </div>
        </div>
      </div>

      {/* ΓöÇΓöÇ 4. Main Interactive Modification Workbench Form ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div className="nm-card p-6 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] rounded-xl flex flex-col gap-5">
        <div>
          <h3 className="text-sm font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
            <i className="pi pi-sliders-h text-[var(--nm-accent-light)]" />
            <span>Target Element Modification Form</span>
          </h3>
          <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
            Configure the target element, pick what operation should happen, and describe your change.
          </p>
        </div>

        {/* ΓöÇΓöÇ Clickable Example Chips ΓöÇΓöÇ */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
              <i className="pi pi-tag text-[var(--nm-accent-light)] text-[10px]" />
              Clickable Example Instructions (Click to fill field)
            </span>
            <span className="text-[10px] text-[var(--nm-text-muted)]">Clicking fills the instruction below</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_INSTRUCTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] hover:text-white hover:border-[var(--nm-accent)] hover:bg-[var(--nm-accent-glow)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <i className="pi pi-plus text-[9px] text-[var(--nm-accent-light)]" />
                <span>"{chip.label}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* ΓöÇΓöÇ Main Form ΓöÇΓöÇ */}
        <form onSubmit={handleSubmitMod} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Field 1: Target Element */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                  <i className="pi pi-bullseye text-[var(--nm-accent-light)] text-xs" />
                  Target Element / Section ID
                </label>
                <span className="text-[10px] text-[var(--nm-text-muted)] font-mono">
                  {availableElements.length} elements available
                </span>
              </div>
              <select
                value={targetId || selectedElementId || ''}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)] transition-all"
              >
                <option value="">-- Choose the component you want to edit --</option>
                {availableElements.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--nm-text-muted)]">
                Choose the component you want to edit.
              </p>
            </div>

            {/* Field 2: Operation Type with Explanations */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                  <i className="pi pi-cog text-[var(--nm-accent-light)] text-xs" />
                  Operation Type
                </label>
                <span className="text-[10px] font-mono text-[var(--nm-text-muted)] uppercase">
                  Select what should happen
                </span>
              </div>

              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)] transition-all"
              >
                <option value="update">UPDATE ΓÇö Edit existing content or properties</option>
                <option value="insert">INSERT ΓÇö Add a new section or component</option>
                <option value="delete">DELETE ΓÇö Remove the selected component</option>
                <option value="move">MOVE ΓÇö Change the position of the selected component</option>
              </select>

              <p className="text-[11px] text-[var(--nm-text-muted)]">
                Select what should happen.
              </p>
            </div>
          </div>

          {/* ΓöÇΓöÇ Operation Explanation Banner Beside/Under Selector ΓöÇΓöÇ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {Object.entries(OPERATION_EXPLANATIONS).map(([key, op]) => {
              const isCurrent = operation === key;
              return (
                <div
                  key={key}
                  onClick={() => setOperation(key)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 ${
                    isCurrent
                      ? `${op.color} shadow-sm ring-1 ring-[var(--nm-accent)]`
                      : 'bg-[var(--nm-bg-surface)] border-[var(--nm-border-subtle)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">{op.label}</span>
                    {isCurrent && <i className="pi pi-check text-[10px]" />}
                  </div>
                  <p className="text-[11px] font-medium text-[var(--nm-text-primary)]">
                    {op.tagline}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Field 3: Content String (For Update or Insert) */}
          {(operation === 'update' || operation === 'insert') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                <i className="pi pi-file-edit text-[var(--nm-accent-light)] text-xs" />
                New Content String / Value
              </label>
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Fresh Meals Delivered in 30 Minutes"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)] transition-all"
              />
              <p className="text-[11px] text-[var(--nm-text-muted)]">
                New text or value.
              </p>
            </div>
          )}

          {/* Field 4: Natural Instruction Guidance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--nm-text-primary)] flex items-center gap-1.5">
              <i className="pi pi-comment text-[var(--nm-accent-light)] text-xs" />
              Instruction / Reason
            </label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Change title to 'Fresh Meals Delivered in 30 Minutes', or Make heading bold..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] focus:outline-none focus:border-[var(--nm-accent)] transition-all"
            />
            <p className="text-[11px] text-[var(--nm-text-muted)]">
              Optional AI guidance.
            </p>
          </div>

          {/* Status Message Banner */}
          {statusMsg && (
            <div
              role="alert"
              className={`p-3.5 rounded-lg text-xs flex items-start gap-2 ${
                statusMsg.type === 'error'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-[rgba(34,197,94,0.15)] text-[var(--nm-success)] border border-[rgba(34,197,94,0.3)]'
              }`}
            >
              <i className={`mt-0.5 ${statusMsg.type === 'error' ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'}`} />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[var(--nm-border-subtle)]">
            <span className="text-[11px] text-[var(--nm-text-muted)]">
              Selected: <strong className="text-[var(--nm-text-primary)] font-mono">{targetId || 'None'}</strong> ┬╖ Operation: <strong className="text-[var(--nm-accent-light)] font-mono">{operation.toUpperCase()}</strong>
            </span>

            <NmButton
              variant="primary"
              label="Apply Structured Modification"
              icon="pi pi-check"
              type="submit"
              className="text-xs px-5 py-2.5 shadow-[0_0_16px_rgba(108,99,255,0.35)]"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default DrawModifyPanel;

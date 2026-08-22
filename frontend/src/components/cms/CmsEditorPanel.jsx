/**
 * CmsEditorPanel — Master CMS Content Editor Panel
 *
 * Provides a clean, modern interface for live content editing of generated UI elements.
 *
 * Core Concept:
 *   SELECT ELEMENT  ->  VIEW CONTENT  ->  EDIT CONTENT  ->  UPDATE PREVIEW
 *
 * Dispatches to specialized type editors:
 * - TextEditor (text)
 * - ButtonEditor (button)
 * - ImageEditor (image)
 * - TextfieldEditor (input, textfield)
 * - CardsEditor (cards, card)
 * - Safe fallback for unknown element types
 */

import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor.jsx';
import ButtonEditor from './ButtonEditor.jsx';
import ImageEditor from './ImageEditor.jsx';
import TextfieldEditor from './TextfieldEditor.jsx';
import CardsEditor from './CardsEditor.jsx';
import ElementSelector from './ElementSelector.jsx';
import { ELEMENT_TYPES } from '../../types/ui.js';

/**
 * @param {object} props
 * @param {import('../../types/cms.js').CmsElement} [props.selectedElement] - Currently active element
 * @param {string} [props.selectedElementId] - ID of currently active element
 * @param {import('../../types/ui.js').UIPage} [props.pageData] - Full page data (for element selection list)
 * @param {import('../../types/cms.js').CmsElement[]} [props.elements] - Flat elements array (alternate to pageData)
 * @param {(elementId: string, updatedContentOrElement: any) => void} [props.onUpdateContent] - Callback when content updates
 * @param {(elementId: string) => void} [props.onSelectElement] - Callback when user switches element
 * @param {() => void} [props.onClose] - Optional close panel callback
 * @param {boolean} [props.disabled=false] - Readonly/disabled mode
 * @param {string} [props.className=''] - Custom container class
 */
const CmsEditorPanel = ({
  selectedElement,
  selectedElementId,
  pageData,
  elements,
  onUpdateContent,
  onSelectElement,
  onClose,
  disabled = false,
  className = '',
}) => {
  // Determine active element: prefer selectedElement object, or find by selectedElementId in pageData/elements
  const activeElement = (() => {
    if (selectedElement && typeof selectedElement === 'object') {
      return selectedElement;
    }

    const targetId = selectedElementId || (selectedElement && selectedElement.id);
    if (!targetId) return null;

    if (Array.isArray(elements)) {
      const found = elements.find((el) => el.id === targetId);
      if (found) return found;
    }

    if (pageData && Array.isArray(pageData.sections)) {
      for (const sec of pageData.sections) {
        if (Array.isArray(sec.elements)) {
          const found = sec.elements.find((el) => el.id === targetId);
          if (found) return found;
        }
      }
    }

    return null;
  })();

  // UI state: 'edit' or 'browse' tabs
  const [activeTab, setActiveTab] = useState('edit');
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Switch to edit tab whenever an element is explicitly selected
  useEffect(() => {
    if (activeElement) {
      setActiveTab('edit');
    }
  }, [activeElement?.id]);

  // Handler for content update dispatch
  const handleUpdate = (updatedFields) => {
    if (!activeElement || !activeElement.id) return;
    setLastSavedTime(new Date());

    // Send payload matching the element update contract
    const updatedPayload = {
      ...activeElement,
      ...updatedFields,
      content: updatedFields.content !== undefined ? updatedFields.content : activeElement.content,
      items: updatedFields.items !== undefined ? updatedFields.items : activeElement.items,
      props: {
        ...(activeElement.props || {}),
        ...(updatedFields.props || {}),
        ...(updatedFields.items ? { items: updatedFields.items } : {}),
      },
    };

    onUpdateContent?.(activeElement.id, updatedPayload);
  };

  // Reset content to fallback value
  const handleResetToFallback = () => {
    if (!activeElement || !activeElement.fallback) return;
    handleUpdate({
      content: activeElement.fallback,
    });
  };

  const elementType = activeElement?.type ? String(activeElement.type).toLowerCase().trim() : '';

  // Render the appropriate type-specific editor
  const renderEditorContent = () => {
    if (!activeElement) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center justify-center mb-3 text-[var(--nm-accent)] shadow-[0_0_16px_var(--nm-accent-glow)]">
            <i className="pi pi-sliders-h text-xl" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--nm-text-primary)] mb-1">
            No Element Selected
          </h4>
          <p className="text-xs text-[var(--nm-text-muted)] max-w-[240px] mb-4">
            Select an element from the page or switch to the elements list to edit content.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className="px-3 py-1.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Browse Page Elements
          </button>
        </div>
      );
    }

    switch (elementType) {
      case ELEMENT_TYPES.TEXT:
        return <TextEditor element={activeElement} onUpdate={handleUpdate} disabled={disabled} />;

      case ELEMENT_TYPES.BUTTON:
        return <ButtonEditor element={activeElement} onUpdate={handleUpdate} disabled={disabled} />;

      case ELEMENT_TYPES.IMAGE:
        return <ImageEditor element={activeElement} onUpdate={handleUpdate} disabled={disabled} />;

      case ELEMENT_TYPES.INPUT:
      case ELEMENT_TYPES.TEXTFIELD:
        return <TextfieldEditor element={activeElement} onUpdate={handleUpdate} disabled={disabled} />;

      case ELEMENT_TYPES.CARDS:
      case ELEMENT_TYPES.CARD:
        return <CardsEditor element={activeElement} onUpdate={handleUpdate} disabled={disabled} />;

      default:
        // Graceful fallback for custom / other element types
        return (
          <div className="flex flex-col gap-3 text-sm">
            <div className="p-3 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-dashed border-[var(--nm-border)] text-xs text-[var(--nm-text-secondary)]">
              <p className="font-medium text-[var(--nm-text-primary)] mb-1">
                Generic Element Editor ({elementType || 'custom'})
              </p>
              <p className="text-[11px] text-[var(--nm-text-muted)]">
                Editing generic content string for this element.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cms-generic-content" className="text-xs font-medium text-[var(--nm-text-secondary)]">
                Element Content
              </label>
              <textarea
                id="cms-generic-content"
                rows={4}
                value={typeof activeElement.content === 'string' ? activeElement.content : JSON.stringify(activeElement.content || '', null, 2)}
                onChange={(e) => handleUpdate({ content: e.target.value })}
                disabled={disabled}
                placeholder="Content string or JSON..."
                className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--nm-accent)]"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <aside
      id="nm-cms-editor-panel"
      aria-label="CMS Content Editor Panel"
      className={`flex flex-col rounded-[var(--nm-radius)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] shadow-2xl overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--nm-accent-glow)] border border-[var(--nm-border)] flex items-center justify-center flex-shrink-0 text-[var(--nm-accent-light)]">
            <i className="pi pi-pencil text-xs" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--nm-text-primary)] truncate">
              Content Editor
            </h3>
            {activeElement ? (
              <p className="text-[10px] font-mono text-[var(--nm-text-muted)] truncate">
                ID: {activeElement.id}
              </p>
            ) : (
              <p className="text-[10px] text-[var(--nm-text-muted)]">
                CMS Panel
              </p>
            )}
          </div>
        </div>

        {/* Status / Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live Sync Badge */}
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-[var(--nm-success)] border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nm-success)] animate-pulse" />
            Live Sync
          </span>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center text-[var(--nm-text-muted)] hover:text-[var(--nm-text-primary)] hover:bg-[var(--nm-bg-primary)] transition-colors"
              aria-label="Close editor panel"
            >
              <i className="pi pi-times text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* ── Sub Navigation Tabs ────────────────────────────────────────────── */}
      <div className="flex border-b border-[var(--nm-border-subtle)] bg-[rgba(17,17,24,0.6)] px-4 pt-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`pb-2 px-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'edit'
              ? 'border-[var(--nm-accent)] text-[var(--nm-accent-light)]'
              : 'border-transparent text-[var(--nm-text-muted)] hover:text-[var(--nm-text-secondary)]'
          }`}
        >
          <i className="pi pi-sliders-h text-[11px]" />
          <span>Edit Content</span>
          {activeElement && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] uppercase font-semibold">
              {activeElement.type}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('browse')}
          className={`pb-2 px-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'browse'
              ? 'border-[var(--nm-accent)] text-[var(--nm-accent-light)]'
              : 'border-transparent text-[var(--nm-text-muted)] hover:text-[var(--nm-text-secondary)]'
          }`}
        >
          <i className="pi pi-list text-[11px]" />
          <span>Elements List</span>
        </button>
      </div>

      {/* ── Main Panel Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 min-h-[260px] max-h-[520px]">
        {activeTab === 'browse' ? (
          <ElementSelector
            pageData={pageData}
            elements={elements}
            selectedElementId={activeElement?.id}
            onSelectElement={(id) => {
              onSelectElement?.(id);
              setActiveTab('edit');
            }}
          />
        ) : (
          renderEditorContent()
        )}
      </div>

      {/* ── Bottom Action Footer ───────────────────────────────────────────── */}
      {activeTab === 'edit' && activeElement && (
        <div className="px-4 py-2.5 border-t border-[var(--nm-border-subtle)] bg-[var(--nm-bg-surface)] flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleResetToFallback}
            disabled={!activeElement.fallback || disabled}
            className="text-[11px] text-[var(--nm-text-muted)] hover:text-[var(--nm-text-secondary)] disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <i className="pi pi-refresh text-[10px]" />
            <span>Reset to fallback</span>
          </button>

          {lastSavedTime && (
            <span className="text-[10px] text-[var(--nm-text-muted)]">
              Updated {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      )}
    </aside>
  );
};

export default CmsEditorPanel;

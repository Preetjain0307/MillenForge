/**
 * CmsEditorTestPage — /cms-editor-test
 *
 * Standalone demo & test harness for the CMS Editor UI Layer.
 *
 * Verifies:
 * 1. CmsEditorPanel renders
 * 2. TextEditor renders & updates live
 * 3. ButtonEditor renders & updates live
 * 4. ImageEditor renders & updates live
 * 5. TextfieldEditor renders & updates live
 * 6. CardsEditor renders & updates live (with add/remove/reorder)
 * 7. Empty / missing content has safe UI
 * 8. Unknown element type has safe fallback
 * 9. Live preview binding using NmCmsElement
 * 10. Responsive layout
 */

import React, { useState } from 'react';
import { CmsEditorPanel } from '../components/cms/index.js';
import NmCmsElement from '../components/NmCmsElement.jsx';
import { EXAMPLE_CMS_BOUND_PAGE } from '../types/cmsExamples.js';
import { updateElementContent } from '../types/cms.js';

const CmsEditorTestPage = () => {
  // Local state harness for live preview verification
  const [pageData, setPageData] = useState(EXAMPLE_CMS_BOUND_PAGE);
  const [selectedElementId, setSelectedElementId] = useState('hero-title');

  // Find currently selected element from pageData
  const getSelectedElement = () => {
    if (!pageData || !Array.isArray(pageData.sections)) return null;
    for (const sec of pageData.sections) {
      if (Array.isArray(sec.elements)) {
        const found = sec.elements.find((el) => el.id === selectedElementId);
        if (found) return found;
      }
    }
    return null;
  };

  const currentElement = getSelectedElement();

  // Handler for CMS updates
  const handleUpdateContent = (elementId, updatedElement) => {
    setPageData((prevPage) => {
      if (!prevPage || !Array.isArray(prevPage.sections)) return prevPage;

      return {
        ...prevPage,
        sections: prevPage.sections.map((sec) => ({
          ...sec,
          elements: Array.isArray(sec.elements)
            ? sec.elements.map((el) => {
                if (el.id !== elementId) return el;
                return {
                  ...el,
                  ...updatedElement,
                  content: updatedElement.content !== undefined ? updatedElement.content : el.content,
                  items: updatedElement.items !== undefined ? updatedElement.items : el.items,
                  props: {
                    ...(el.props || {}),
                    ...(updatedElement.props || {}),
                  },
                };
              })
            : [],
        })),
      };
    });
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-6 nm-animate-in">
      {/* Dev Banner */}
      <div
        role="note"
        className="flex items-center gap-3 px-4 py-3 rounded-[var(--nm-radius-sm)] bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.3)] text-[var(--nm-accent-light)] text-xs sm:text-sm"
      >
        <i className="pi pi-bolt text-base" aria-hidden="true" />
        <div>
          <strong>Task E2: CMS Editor UI Test Harness</strong> — Live validation of
          <code className="mx-1 font-mono text-xs bg-[rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded">
            CmsEditorPanel
          </code>
          with all element types (Text, Button, Image, Textfield, Cards Loop, Fallbacks).
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[var(--nm-text-muted)] uppercase tracking-widest font-medium mb-1">
            CMS Content Editor Demo
          </p>
          <h1 className="text-2xl font-bold text-[var(--nm-text-primary)]">
            Live Visual Editor & CMS Panel
          </h1>
        </div>

        {/* Workflow indicator */}
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)]">
          <span className="text-[var(--nm-accent-light)]">SELECT</span>
          <span>→</span>
          <span className="text-[var(--nm-accent-light)]">EDIT</span>
          <span>→</span>
          <span className="text-[var(--nm-success)] font-semibold">PREVIEW</span>
        </div>
      </div>

      {/* Main Split Layout: Live Preview on Left / Editor Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Page Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--nm-text-muted)]">
              Interactive Preview (Click element to select)
            </span>
            <span className="text-xs text-[var(--nm-text-muted)] font-mono">
              Selected: <strong className="text-[var(--nm-accent-light)]">{selectedElementId || 'None'}</strong>
            </span>
          </div>

          <div className="rounded-[var(--nm-radius-lg)] border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] p-6 flex flex-col gap-6 shadow-xl">
            {pageData.sections.map((section) => (
              <section
                key={section.id}
                className="p-5 rounded-[var(--nm-radius)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex flex-col gap-4 relative group"
              >
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--nm-text-muted)]">
                  Section: {section.type} ({section.id})
                </span>

                <div className="flex flex-col gap-4">
                  {section.elements.map((el) => {
                    const isSelected = el.id === selectedElementId;

                    return (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`p-3 rounded-[var(--nm-radius-sm)] border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-[var(--nm-accent)] bg-[rgba(108,99,255,0.08)] ring-2 ring-[var(--nm-accent-glow)]'
                            : 'border-transparent hover:border-[var(--nm-border)] hover:bg-[rgba(255,255,255,0.02)]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-[var(--nm-accent)] text-white text-[9px] font-mono font-bold tracking-wide uppercase flex items-center gap-1 shadow-md">
                            <i className="pi pi-pencil text-[8px]" />
                            Editing {el.type}
                          </div>
                        )}
                        <NmCmsElement element={el} />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Right Column: CMS Editor Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <CmsEditorPanel
            selectedElement={currentElement}
            selectedElementId={selectedElementId}
            pageData={pageData}
            onUpdateContent={handleUpdateContent}
            onSelectElement={(id) => setSelectedElementId(id)}
          />
        </div>
      </div>
    </main>
  );
};

export default CmsEditorTestPage;

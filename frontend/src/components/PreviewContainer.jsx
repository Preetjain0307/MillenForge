/**
 * PreviewContainer — Reusable browser-like preview wrapper component for NeuroMinds
 * Includes Viewport Switcher, Zoom Controls, Fullscreen Mode, and Interactive View Code Modal.
 */

import { useState, useEffect } from 'react';
import { generateReactCode, generateHtmlCode } from '../utils/codeGenerator';

/**
 * @param {object} props
 * @param {string} props.pageName
 * @param {object} [props.pageResult] - Full generated UIPage JSON schema
 * @param {React.ReactNode} [props.children]  - Rendered UI
 * @param {boolean} [props.isEmpty]
 * @param {function} [props.onRefresh]
 */
const PreviewContainer = ({ pageName, pageResult, children, isEmpty = true, onRefresh }) => {
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [zoomLevel, setZoomLevel] = useState(100); // 50 | 75 | 100
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeTab, setCodeTab] = useState('react'); // 'react' | 'html' | 'json'
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: Press ESC to exit full screen or code modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCodeModal) setShowCodeModal(false);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showCodeModal]);

  const getActiveCodeString = () => {
    if (codeTab === 'react') return generateReactCode(pageResult);
    if (codeTab === 'html') return generateHtmlCode(pageResult);
    return pageResult ? JSON.stringify(pageResult, null, 2) : '// No JSON available';
  };

  const handleCopy = () => {
    const code = getActiveCodeString();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getActiveCodeString();
    const ext = codeTab === 'react' ? 'jsx' : codeTab === 'html' ? 'html' : 'json';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(pageName || 'GeneratedUI').toLowerCase()}_code.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getViewportWidthClass = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto border-x border-[#2A2A30] shadow-2xl rounded-b-xl overflow-hidden';
      case 'tablet':
        return 'max-w-[768px] mx-auto border-x border-[#2A2A30] shadow-2xl rounded-b-xl overflow-hidden';
      case 'desktop':
      default:
        return 'w-full max-w-7xl mx-auto';
    }
  };

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-[9999] bg-[#09090B] flex flex-col w-screen h-screen overflow-hidden'
    : 'flex-1 flex flex-col rounded-xl overflow-hidden border border-[#2A2A30] bg-[#111113] shadow-2xl min-h-[600px]';

  return (
    <div className={containerClasses}>
      {/* Browser Toolbar Frame Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-b border-[#2A2A30] bg-[#18181B] shrink-0">
        {/* Left: Window Traffic Lights & Address Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              onClick={() => isFullscreen && setIsFullscreen(false)}
              className="w-3 h-3 rounded-full bg-[#FB7185]/80 hover:bg-[#FB7185] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Close'}
            />
            <span className="w-3 h-3 rounded-full bg-[#FBBF24]/80 hover:bg-[#FBBF24] transition-colors" title="Minimize" />
            <span
              onClick={() => setIsFullscreen(prev => !prev)}
              className="w-3 h-3 rounded-full bg-[#34D399]/80 hover:bg-[#34D399] transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#09090B] border border-[#2A2A30] text-xs font-mono text-[#CBD5E1]">
            <i className="pi pi-lock text-[10px] text-[#34D399]" />
            <span className="text-[#94A3B8]">https://neurominds.local/preview/</span>
            <span className="text-[#A78BFA] font-semibold">{pageName || 'Home'}</span>
          </div>
        </div>

        {/* Center: Responsive Viewport Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#09090B] p-1 rounded-lg border border-[#2A2A30]" role="group" aria-label="Viewport Switcher">
          <button
            type="button"
            onClick={() => setViewportMode('desktop')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewportMode === 'desktop'
                ? 'bg-[#8B5CF6] text-white shadow-sm font-semibold'
                : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#18181B]'
            }`}
            title="Desktop Viewport (100%)"
          >
            <i className="pi pi-desktop text-xs" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setViewportMode('tablet')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewportMode === 'tablet'
                ? 'bg-[#8B5CF6] text-white shadow-sm font-semibold'
                : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#18181B]'
            }`}
            title="Tablet Viewport (768px)"
          >
            <i className="pi pi-tablet text-xs" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setViewportMode('mobile')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewportMode === 'mobile'
                ? 'bg-[#8B5CF6] text-white shadow-sm font-semibold'
                : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#18181B]'
            }`}
            title="Mobile Viewport (375px)"
          >
            <i className="pi pi-mobile text-xs" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Zoom, View Code, Fullscreen & Refresh Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-[#94A3B8] bg-[#09090B] px-2 py-1 rounded border border-[#2A2A30]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
              className="hover:text-[#F8FAFC] px-1"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-[#A78BFA] px-1">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(100, prev + 25))}
              className="hover:text-[#F8FAFC] px-1"
              title="Zoom in"
            >
              +
            </button>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 rounded-md bg-[#09090B] border border-[#2A2A30] text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#8B5CF6] transition-colors"
              title="Refresh canvas"
            >
              <i className="pi pi-refresh text-xs" />
            </button>
          )}

          {/* View Code Button */}
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all bg-[#18181B] text-[#A78BFA] border border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6] shadow-sm cursor-pointer"
            title="View Generated React & HTML Code"
          >
            <i className="pi pi-code text-xs text-[#8B5CF6]" />
            <span>View Code</span>
          </button>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              isFullscreen
                ? 'bg-[#EF4444] text-white border-[#EF4444] hover:bg-[#DC2626]'
                : 'bg-[#8B5CF6] text-white border-[#8B5CF6] hover:bg-[#7C3AED] shadow-[0_0_12px_rgba(139,92,246,0.4)]'
            }`}
            title={isFullscreen ? 'Exit Full Screen (ESC)' : 'Open Full Screen View'}
          >
            <i className={`pi ${isFullscreen ? 'pi-window-minimize' : 'pi-window-maximize'} text-xs`} />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport Workspace */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#09090B]">
        <div
          className={`${getViewportWidthClass()} nm-viewport-${viewportMode} transition-all duration-300 min-h-[600px]`}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-24 bg-[#111113] rounded-xl border border-[#2A2A30]">
              <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.2)]">
                <i className="pi pi-sparkles text-[#8B5CF6] text-2xl" />
              </div>
              <div className="text-center px-4">
                <p className="text-[#F8FAFC] font-semibold text-base mb-1">
                  Ready to Render AI Generated UI
                </p>
                <p className="text-xs text-[#94A3B8] max-w-sm">
                  Enter a prompt or upload a wireframe to generate a full-sized, professional, lovable website layout.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* View Code Interactive Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-4xl max-h-[85vh] bg-[#111113] rounded-2xl border border-[#2A2A30] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A30] bg-[#18181B]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center">
                  <i className="pi pi-code text-[#A78BFA] text-sm" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Generated UI Code Inspection
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    {pageName || 'Home'} Page Component Code & Schema
                  </p>
                </div>
              </div>

              {/* Action Buttons & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <i className={copied ? 'pi pi-check text-xs' : 'pi pi-copy text-xs'} />
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-[#18181B] text-[#A78BFA] border border-[#2A2A30] hover:border-[#8B5CF6] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="pi pi-download text-xs" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2A2A30] transition-colors cursor-pointer ml-2"
                >
                  <i className="pi pi-times text-sm" />
                </button>
              </div>
            </div>

            {/* Code Format Tabs */}
            <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#2A2A30] bg-[#09090B]">
              <button
                onClick={() => setCodeTab('react')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  codeTab === 'react'
                    ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <i className="pi pi-desktop text-xs" />
                <span>React (JSX)</span>
              </button>

              <button
                onClick={() => setCodeTab('html')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  codeTab === 'html'
                    ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <i className="pi pi-code text-xs" />
                <span>HTML & Tailwind</span>
              </button>

              <button
                onClick={() => setCodeTab('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  codeTab === 'json'
                    ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <i className="pi pi-database text-xs" />
                <span>JSON Schema</span>
              </button>
            </div>

            {/* Code Content Container */}
            <div className="flex-1 overflow-auto p-6 bg-[#09090B]">
              <pre className="p-4 rounded-xl bg-[#111113] border border-[#2A2A30] text-[#E2E8F0] font-mono text-xs overflow-auto leading-relaxed max-h-[50vh]">
                {getActiveCodeString()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewContainer;

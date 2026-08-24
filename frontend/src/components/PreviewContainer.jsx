/**
 * PreviewContainer — Reusable browser-like preview wrapper component for NeuraMindss
 */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {string} props.pageName
 * @param {React.ReactNode} [props.children]  - Rendered UI
 * @param {boolean} [props.isEmpty]
 * @param {function} [props.onRefresh]
 */
const PreviewContainer = ({ pageName, children, isEmpty = true, onRefresh }) => {
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [zoomLevel, setZoomLevel] = useState(100); // 50 | 75 | 100

  const getViewportWidthClass = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto border-x border-[#2A2A30] shadow-2xl rounded-b-xl overflow-hidden';
      case 'tablet':
        return 'max-w-[768px] mx-auto border-x border-[#2A2A30] shadow-2xl rounded-b-xl overflow-hidden';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-[#2A2A30] bg-[#111113] shadow-2xl">
      {/* Browser Toolbar Frame Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-b border-[#2A2A30] bg-[#18181B]">
        {/* Left: Window Traffic Lights & Address Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FB7185]/80 hover:bg-[#FB7185] transition-colors" title="Close" />
            <span className="w-3 h-3 rounded-full bg-[#FBBF24]/80 hover:bg-[#FBBF24] transition-colors" title="Minimize" />
            <span className="w-3 h-3 rounded-full bg-[#34D399]/80 hover:bg-[#34D399] transition-colors" title="Expand" />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#09090B] border border-[#2A2A30] text-xs font-mono text-[#CBD5E1]">
            <i className="pi pi-lock text-[10px] text-[#34D399]" />
            <span className="text-[#94A3B8]">https://neuraminds.local/preview/</span>
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

        {/* Right: Zoom & Canvas Actions */}
        <div className="flex items-center gap-2">
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

          <div className="text-xs text-[#A78BFA] bg-[#8B5CF6]/10 px-2.5 py-1 rounded border border-[#8B5CF6]/30 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            <span>Live Canvas</span>
          </div>
        </div>
      </div>

      {/* Canvas Viewport Workspace */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#09090B]">
        <div 
          className={`${getViewportWidthClass()} transition-all duration-300 min-h-[400px]`}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20 bg-[#111113] rounded-xl border border-[#2A2A30]">
              <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.2)]">
                <i className="pi pi-sparkles text-[#8B5CF6] text-2xl" />
              </div>
              <div className="text-center px-4">
                <p className="text-[#F8FAFC] font-semibold text-base mb-1">
                  Ready to Render AI Generated UI
                </p>
                <p className="text-xs text-[#94A3B8] max-w-sm">
                  Upload a wireframe, enter a prompt, or paste existing code to generate live preview components.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewContainer;

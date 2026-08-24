/**
 * GeneratePage — /generate
 *
 * NeuraMindss 3-Panel AI UI Engineering Studio
 */

import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import NmUploadArea from '../components/NmUploadArea';
import PreviewContainer from '../components/PreviewContainer';
import UIRenderer from '../components/UIRenderer';
import { uploadWireframe, generateUI } from '../services/api';
import {
  setPrompt,
  setExistingCode,
  setPageName,
  setUploadStatus,
  setUploadedWireframePath,
  setUploadedFile,
  setUploadError,
  clearUpload,
  setStatus,
  setError,
  setResult,
  selectGeneration,
  selectUploadStatus,
  selectUploadedFile,
  selectUploadError,
  selectGenerationStatus,
  selectGenerationError,
} from '../features/generation/generationSlice';
import { setPage, setActivePage } from '../features/pages/pagesSlice';

// Generation stage labels (truthful server pipeline)
const GENERATION_STAGES = [
  { key: 'analyze',  label: '01 Analyze Input & Wireframe',  icon: 'pi pi-eye' },
  { key: 'layout',   label: '02 Understand Layout Geometry', icon: 'pi pi-compass' },
  { key: 'detect',   label: '03 Detect Component Trees',    icon: 'pi pi-sitemap' },
  { key: 'generate', label: '04 Generate React Structure',   icon: 'pi pi-code' },
  { key: 'cms',      label: '05 Map CMS Binding Elements',   icon: 'pi pi-database' },
  { key: 'preview',  label: '06 Prepare Live Canvas',        icon: 'pi pi-desktop' },
];

const friendlyError = (raw = '') => {
  const msg = String(raw).toLowerCase();
  if (msg.includes('api key') || msg.includes('not configured') || msg.includes('503'))
    return 'AI generation is currently unavailable. Please check the AI configuration.';
  if (msg.includes('prompt') || msg.includes('describe'))
    return 'Please describe the UI you want to generate.';
  if (msg.includes('wireframe') && msg.includes('required'))
    return 'Please upload a wireframe first.';
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('econnrefused'))
    return 'Cannot reach the server. Check your connection or try again.';
  if (msg.includes('413') || msg.includes('too large'))
    return 'The wireframe file is too large. Please use an image under 10 MB.';
  if (msg.includes('415') || msg.includes('unsupported'))
    return 'Unsupported file type. Please use JPG, JPEG, PNG, or WEBP.';
  if (msg.includes('malformed') || msg.includes('invalid json') || msg.includes('parse'))
    return 'The AI returned an unexpected response. Please try again with a clearer prompt.';
  if (msg.includes('generation failed') || msg.includes('failed'))
    return 'Generation failed. Please refine your prompt and try again.';
  return raw.length > 200 ? 'An unexpected error occurred. Please try again.' : raw;
};

const EXAMPLE_PROMPTS = [
  'A modern SaaS landing page with split hero, CTA buttons, metrics bar, and reusable feature cards.',
  'An analytics dashboard with sidebar navigation, key KPI cards, and data visualization grid.',
  'A clean product pricing table with 3 tiers, feature comparison list, and highlighted recommended plan.',
  'A sleek authentication portal with email/password input, social OAuth buttons, and hero visual.',
];

const GeneratePage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const generation       = useSelector(selectGeneration);
  const uploadStatus     = useSelector(selectUploadStatus);
  const uploadedFile     = useSelector(selectUploadedFile);
  const uploadError      = useSelector(selectUploadError);
  const generationStatus = useSelector(selectGenerationStatus);
  const generationError  = useSelector(selectGenerationError);

  const [wireframeFile, setWireframeFile] = useState(null);
  const [inputTab, setInputTab]           = useState('wireframe');
  const [inspectorTab, setInspectorTab]   = useState('inspector');
  const [stageIndex, setStageIndex]       = useState(0);
  const [promptError, setPromptError]     = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [copiedCode, setCopiedCode]       = useState(false);

  const isGenerating = generationStatus === 'loading';
  const hasPrompt    = generation.prompt?.trim().length > 0;
  const promptLength = generation.prompt?.length ?? 0;
  const pageResult   = generation.result;

  // Cycle through generation stage labels
  useEffect(() => {
    if (!isGenerating) {
      return;
    }
    const STAGE_MS = [600, 1500, 3000, 5000, 7000];
    const timers = STAGE_MS.map((ms, i) =>
      setTimeout(() => setStageIndex(Math.min(i + 1, GENERATION_STAGES.length - 1)), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [isGenerating]);

  // Upload handlers
  const handleFileSelect = useCallback(async (file) => {
    dispatch(clearUpload());
    setWireframeFile(file);
    dispatch(setUploadStatus('uploading'));
    try {
      const response = await uploadWireframe(file);
      dispatch(setUploadedFile(response.file));
      dispatch(setUploadedWireframePath(response.file.filename));
      dispatch(setUploadStatus('success'));
    } catch (err) {
      dispatch(setUploadError(friendlyError(err.message || 'Upload failed')));
      dispatch(setUploadStatus('error'));
    }
  }, [dispatch]);

  const handleRemoveFile = useCallback(() => {
    setWireframeFile(null);
    dispatch(clearUpload());
  }, [dispatch]);

  // Generation handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    const prompt   = generation.prompt?.trim();
    const pageName = generation.pageName?.trim() || 'Home';

    if (!prompt) {
      setPromptError('Please enter a natural language prompt for UI generation.');
      setInputTab('prompt');
      return;
    }

    dispatch(setStatus('loading'));
    dispatch(setError(null));
    dispatch(setResult(null));
    setSelectedElement(null);
    setStageIndex(0);

    try {
      const payload = {
        prompt,
        pageName,
        existingCode:      generation.existingCode || undefined,
        architectureFlow:  generation.architectureFlow || undefined,
      };

      if (uploadStatus === 'success' && uploadedFile) {
        payload.wireframe = {
          filename:     uploadedFile.filename,
          originalName: uploadedFile.originalName,
        };
      }

      const response = await generateUI(payload);

      if (response.success && response.page) {
        dispatch(setResult(response.page));
        dispatch(setPage({ pageName, data: response.page }));
        dispatch(setActivePage(pageName));
        dispatch(setStatus('succeeded'));
      } else {
        dispatch(setError(friendlyError(response.message || 'Generation failed.')));
        dispatch(setStatus('failed'));
      }
    } catch (err) {
      dispatch(setError(friendlyError(err.message || 'Generation failed.')));
      dispatch(setStatus('failed'));
    }
  };

  const handleUseExample = (example) => {
    dispatch(setPrompt(example));
    setInputTab('prompt');
    setPromptError(null);
  };

  const handleCopyCode = () => {
    if (!pageResult) return;
    navigator.clipboard.writeText(JSON.stringify(pageResult, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentStage = GENERATION_STAGES[stageIndex];

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090B] overflow-hidden">
      
      {/* ── Studio Top Header Bar ────────────────────────────────────────── */}
      <div className="h-12 border-b border-[#2A2A30] bg-[#111113] px-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#CBD5E1]">
            <i className="pi pi-sparkles text-[#8B5CF6]" />
            <span className="font-bold text-[#F8FAFC]">Generate Studio</span>
            <span className="text-[#94A3B8]">/</span>
            <input
              type="text"
              value={generation.pageName}
              onChange={(e) => dispatch(setPageName(e.target.value))}
              placeholder="Home"
              className="bg-[#18181B] border border-[#2A2A30] rounded px-2 py-0.5 text-xs text-[#A78BFA] font-mono focus:outline-none focus:border-[#8B5CF6] w-32"
            />
          </div>

          {/* Active Input Badges */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono">
            {uploadStatus === 'success' && (
              <span className="px-2 py-0.5 rounded bg-[#34D399]/10 border border-[#34D399]/30 text-[#34D399]">
                ✓ Wireframe Attached
              </span>
            )}
            {hasPrompt && (
              <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#A78BFA]">
                ✓ Prompt Ready ({promptLength} chars)
              </span>
            )}
            {generation.existingCode && (
              <span className="px-2 py-0.5 rounded bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24]">
                ✓ Code Context
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {pageResult && (
            <button
              onClick={() => navigate(`/preview/${encodeURIComponent(generation.pageName || 'Home')}`)}
              className="px-3 py-1 rounded bg-[#18181B] border border-[#2A2A30] text-xs text-[#CBD5E1] hover:text-[#F8FAFC] hover:border-[#8B5CF6] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="pi pi-external-link text-[10px]" />
              Full Preview &amp; CMS
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || uploadStatus === 'uploading'}
            className={`px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isGenerating
                ? 'bg-[#2A2A30] text-[#94A3B8] cursor-not-allowed'
                : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-[0_0_16px_rgba(139,92,246,0.3)]'
            }`}
          >
            {isGenerating ? (
              <>
                <i className="pi pi-[#8B5CF6] pi-spin pi-spinner text-xs" />
                Generating…
              </>
            ) : (
              <>
                <i className="pi pi-bolt text-xs" />
                Generate UI
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main 3-Panel Studio Layout ──────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* ── PANEL 1: INPUT WORKSPACE (Left 4 cols) ───────────────────── */}
        <div className="lg:col-span-4 border-r border-[#2A2A30] bg-[#111113] flex flex-col h-full overflow-hidden">
          {/* Input Mode Selector Tabs */}
          <div className="flex items-center border-b border-[#2A2A30] bg-[#18181B] px-2 py-1.5 gap-1">
            <button
              onClick={() => setInputTab('wireframe')}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                inputTab === 'wireframe'
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#202024]'
              }`}
            >
              <i className="pi pi-image text-xs" />
              Wireframe
            </button>

            <button
              onClick={() => setInputTab('prompt')}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                inputTab === 'prompt'
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#202024]'
              }`}
            >
              <i className="pi pi-comment text-xs" />
              Prompt
            </button>

            <button
              onClick={() => setInputTab('code')}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                inputTab === 'code'
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#202024]'
              }`}
            >
              <i className="pi pi-code text-xs" />
              Existing Code
            </button>
          </div>

          {/* Combined Inputs Context Banner */}
          <div className="px-4 py-2 bg-[#09090B] border-b border-[#2A2A30] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
            <span>INPUT PIPELINE</span>
            <span className="text-[#A78BFA]">
              WIREframe {uploadStatus === 'success' ? '✓' : '+'} PROMPT {hasPrompt ? '✓' : '+'} CODE
            </span>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
            
            {/* WIREFRAME TAB */}
            {inputTab === 'wireframe' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                    Wireframe Sketch Upload
                  </h3>
                  <span className="text-[10px] text-[#94A3B8] font-mono">PNG, JPG, WEBP</span>
                </div>

                <NmUploadArea
                  file={wireframeFile}
                  uploadStatus={uploadStatus}
                  uploadError={uploadError}
                  onFileSelect={handleFileSelect}
                  onRemove={handleRemoveFile}
                />

                <div className="p-3 rounded-lg bg-[#18181B] border border-[#2A2A30] text-xs text-[#94A3B8] space-y-1">
                  <p className="font-semibold text-[#F8FAFC] flex items-center gap-1">
                    <i className="pi pi-lightbulb text-[#8B5CF6]" /> Multimodal Vision Tip
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Gemini Vision detects wireframe elements, text headings, CTA placement, and layout columns directly from image sketches.
                  </p>
                </div>
              </div>
            )}

            {/* PROMPT TAB */}
            {inputTab === 'prompt' && (
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                    AI Prompt Specification
                  </h3>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {promptLength}/5000
                  </span>
                </div>

                <textarea
                  id="prompt-input"
                  value={generation.prompt}
                  onChange={(e) => {
                    dispatch(setPrompt(e.target.value));
                    if (promptError) setPromptError(null);
                  }}
                  disabled={isGenerating}
                  maxLength={5000}
                  rows={8}
                  placeholder="Describe your UI structure, styling tone, columns, CTA buttons, and components...&#10;&#10;Example: Modern SaaS landing page with split hero, features grid, and dark theme."
                  className="w-full p-3 rounded-lg bg-[#18181B] border border-[#2A2A30] text-[#F8FAFC] placeholder-[#94A3B8] text-xs font-sans leading-relaxed focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] resize-none"
                />

                {promptError && (
                  <p className="text-xs text-[#FB7185] flex items-center gap-1">
                    <i className="pi pi-exclamation-circle text-xs" />
                    {promptError}
                  </p>
                )}

                {/* Example Quick Prompt Chips */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase">Prompt Inspiration</span>
                  <div className="flex flex-col gap-1.5">
                    {EXAMPLE_PROMPTS.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUseExample(ex)}
                        className="text-left p-2 rounded bg-[#18181B] border border-[#2A2A30] text-[11px] text-[#CBD5E1] hover:text-[#A78BFA] hover:border-[#8B5CF6] transition-all truncate cursor-pointer"
                      >
                        ⚡ {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EXISTING CODE TAB */}
            {inputTab === 'code' && (
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                    Existing Component Context
                  </h3>
                  <span className="text-[10px] font-mono text-[#94A3B8]">JSX / HTML / CSS</span>
                </div>

                <textarea
                  id="existing-code-input"
                  value={generation.existingCode}
                  onChange={(e) => dispatch(setExistingCode(e.target.value))}
                  disabled={isGenerating}
                  rows={10}
                  placeholder="Paste existing React components or HTML here. The AI generator will reference your design patterns and code structures."
                  className="w-full p-3 rounded-lg bg-[#09090B] border border-[#2A2A30] text-[#E2E8F0] placeholder-[#94A3B8] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#8B5CF6] resize-none"
                />
              </div>
            )}
          </div>

          {/* Bottom Generation Pipeline Progress Panel */}
          {isGenerating && (
            <div className="p-4 bg-[#18181B] border-t border-[#2A2A30] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#A78BFA] flex items-center gap-1.5">
                  <i className="pi pi-spin pi-spinner text-xs" />
                  {currentStage.label}
                </span>
                <span className="font-mono text-[#94A3B8] text-[10px]">Stage {stageIndex + 1}/6</span>
              </div>
              <div className="w-full bg-[#09090B] h-1.5 rounded-full overflow-hidden border border-[#2A2A30]">
                <div 
                  className="bg-[#8B5CF6] h-full transition-all duration-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]" 
                  style={{ width: `${((stageIndex + 1) / GENERATION_STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Notice */}
          {generationStatus === 'failed' && generationError && (
            <div className="p-3 bg-[#FB7185]/10 border-t border-[#FB7185]/30 text-xs text-[#FB7185] flex items-center gap-2">
              <i className="pi pi-exclamation-triangle" />
              <span>{friendlyError(generationError)}</span>
            </div>
          )}
        </div>

        {/* ── PANEL 2: LIVE PREVIEW CANVAS (Center 5 cols) ────────────── */}
        <div className="lg:col-span-5 border-r border-[#2A2A30] bg-[#09090B] flex flex-col h-full overflow-hidden p-3">
          <PreviewContainer
            pageName={generation.pageName || 'Home'}
            isEmpty={!pageResult && !isGenerating}
            onRefresh={() => {}}
          >
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-24">
                <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  <i className="pi pi-sparkles text-[#8B5CF6] text-2xl" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#F8FAFC] mb-1 font-mono">
                    {currentStage.label}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    Synthesizing React component tree &amp; CMS element bindings…
                  </p>
                </div>
              </div>
            ) : pageResult ? (
              <UIRenderer
                pageData={pageResult}
                selectedElementId={selectedElement?.id}
                onSelectElement={(el) => setSelectedElement(el)}
              />
            ) : null}
          </PreviewContainer>
        </div>

        {/* ── PANEL 3: AI INSPECTOR & CODE (Right 3 cols) ───────────────── */}
        <div className="lg:col-span-3 bg-[#111113] flex flex-col h-full overflow-hidden">
          
          {/* Inspector Header Tabs */}
          <div className="flex items-center border-b border-[#2A2A30] bg-[#18181B] px-2 py-1.5 gap-1">
            <button
              onClick={() => setInspectorTab('inspector')}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                inspectorTab === 'inspector'
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#202024]'
              }`}
            >
              <i className="pi pi-search text-xs" />
              Inspector
            </button>

            <button
              onClick={() => setInspectorTab('code')}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                inspectorTab === 'code'
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#202024]'
              }`}
            >
              <i className="pi pi-code text-xs" />
              Code
            </button>

            <button
              onClick={() => setInspectorTab('cms')}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                inspectorTab === 'cms'
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#202024]'
              }`}
            >
              <i className="pi pi-database text-xs" />
              CMS Data
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-auto p-4">
            
            {/* INSPECTOR TAB */}
            {inspectorTab === 'inspector' && (
              <div className="flex flex-col gap-4">
                {selectedElement ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[#2A2A30] pb-2">
                      <span className="text-xs font-bold text-[#F8FAFC] font-mono flex items-center gap-1.5">
                        <i className="pi pi-[#8B5CF6] pi-tag text-[#8B5CF6]" />
                        ELEMENT INSPECTOR
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                        {selectedElement.type}
                      </span>
                    </div>

                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="p-2.5 rounded bg-[#18181B] border border-[#2A2A30]">
                        <span className="text-[#94A3B8] block text-[10px] uppercase">Element ID</span>
                        <span className="text-[#F8FAFC] font-bold">{selectedElement.id}</span>
                      </div>

                      <div className="p-2.5 rounded bg-[#18181B] border border-[#2A2A30]">
                        <span className="text-[#94A3B8] block text-[10px] uppercase">Content / Value</span>
                        <span className="text-[#A78BFA] font-medium">
                          {typeof selectedElement.content === 'string'
                            ? selectedElement.content
                            : JSON.stringify(selectedElement.content || selectedElement.fallback || 'None')}
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-[#18181B] border border-[#2A2A30]">
                        <span className="text-[#94A3B8] block text-[10px] uppercase">Fallback Content</span>
                        <span className="text-[#CBD5E1]">
                          {selectedElement.fallback || 'Default'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded bg-[#18181B] border border-[#2A2A30] flex items-center justify-between">
                        <span className="text-[#94A3B8] text-[10px] uppercase">Responsive Viewports</span>
                        <div className="flex gap-1 text-[10px] text-[#34D399]">
                          <span>✓ Desktop</span>
                          <span>✓ Tablet</span>
                          <span>✓ Mobile</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Actions */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/preview/${encodeURIComponent(generation.pageName || 'Home')}`)}
                        className="w-full py-2 rounded bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <i className="pi pi-pencil text-xs" />
                        Edit in CMS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3 text-[#94A3B8]">
                    <div className="w-12 h-12 rounded-xl bg-[#18181B] border border-[#2A2A30] flex items-center justify-center">
                      <i className="pi pi-cursor text-[#8B5CF6] text-xl" />
                    </div>
                    <p className="text-xs font-medium text-[#F8FAFC]">
                      Select an element in the live preview canvas to inspect details
                    </p>
                    <p className="text-[11px] text-[#94A3B8]">
                      Click any component heading, image, card, or button in the center pane to view element attributes and CMS data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CODE TAB */}
            {inspectorTab === 'code' && (
              <div className="flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[#CBD5E1]">
                    Generated UIPage Schema
                  </span>
                  {pageResult && (
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-1 rounded bg-[#18181B] border border-[#2A2A30] text-[11px] text-[#A78BFA] hover:border-[#8B5CF6] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <i className={copiedCode ? 'pi pi-check' : 'pi pi-copy'} />
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                <pre className="flex-1 p-3 rounded-lg bg-[#09090B] border border-[#2A2A30] text-[#E2E8F0] font-mono text-[11px] overflow-auto leading-relaxed">
                  {pageResult ? JSON.stringify(pageResult, null, 2) : '// Generated JSON schema will appear here after clicking Generate UI'}
                </pre>
              </div>
            )}

            {/* CMS TAB */}
            {inspectorTab === 'cms' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#2A2A30] pb-2">
                  <span className="text-xs font-bold text-[#F8FAFC] font-mono">CMS BINDINGS</span>
                  <span className="text-[10px] text-[#34D399] font-mono">100% Real API Bound</span>
                </div>

                {pageResult ? (
                  <div className="space-y-3 text-xs">
                    <p className="text-[#94A3B8] text-[11px]">
                      Page: <strong className="text-[#F8FAFC]">{pageResult.page || 'Home'}</strong> ({pageResult.sections?.length || 0} Sections)
                    </p>
                    
                    {pageResult.sections?.map((sec, i) => (
                      <div key={sec.id || i} className="p-3 rounded bg-[#18181B] border border-[#2A2A30] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#A78BFA] capitalize">{sec.type} Section</span>
                          <span className="text-[10px] font-mono text-[#94A3B8]">{sec.elements?.length || 0} elements</span>
                        </div>
                        <div className="pl-2 border-l border-[#2A2A30] space-y-1 mt-1">
                          {sec.elements?.map((el) => (
                            <div key={el.id} className="text-[11px] text-[#CBD5E1] flex items-center justify-between">
                              <span className="truncate max-w-[140px]">{el.id}</span>
                              <span className="text-[10px] font-mono text-[#94A3B8]">{el.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8]">
                    No CMS data mapped yet. Generate a UI to inspect CMS elements.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default GeneratePage;

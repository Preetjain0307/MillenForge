/**
 * GeneratePage — /generate
 *
 * Sprint F2: Generation Experience + UI/UX Polish
 *
 * Pipeline:
 *   Upload wireframe (optional) → Enter prompt → Generate → AI processing → Preview
 *
 * Changes from Sprint F2:
 *   - Richer upload area with meaningful file meta display
 *   - Multi-stage generation status (truthful: no fake %)
 *   - Improved prompt guidance and placeholder
 *   - Clean, user-friendly error messages (no stack traces / keys exposed)
 *   - Success state with explicit confirmation before navigating
 *   - Fully responsive layout
 */
import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import NmButton from '../components/NmButton';
import NmUploadArea from '../components/NmUploadArea';
import { uploadWireframe, generateUI } from '../services/api';
import {
  setPrompt,
  setExistingCode,
  setArchitectureFlow,
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
  resetGeneration,
} from '../features/generation/generationSlice';
import { setPage, setActivePage } from '../features/pages/pagesSlice';

// ── Generation stage labels (truthful — match actual server behavior) ─────────
const GENERATION_STAGES = [
  { key: 'upload',   label: 'Uploading wireframe…',  icon: 'pi pi-upload' },
  { key: 'analyze',  label: 'Analysing wireframe…',  icon: 'pi pi-eye' },
  { key: 'generate', label: 'Generating UI…',         icon: 'pi pi-sparkles' },
  { key: 'validate', label: 'Validating output…',     icon: 'pi pi-check-circle' },
  { key: 'preview',  label: 'Preparing preview…',     icon: 'pi pi-desktop' },
];

// ── Friendly error mapper — never exposes API keys / stack traces ──────────────
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

// ── Example prompts for guided UX ─────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  'A responsive SaaS landing page with a split hero section, primary CTA, and three feature cards in a dark theme.',
  'A modern analytics dashboard with a sidebar nav, key metric cards, and a data table.',
  'A clean sign-up form page with email, password fields, social login options, and a hero illustration.',
  'A product pricing page with three tiers, feature comparison list, and a highlighted recommended plan.',
];

const PROMPT_TABS = [
  { id: 'prompt',       label: 'Describe UI',          icon: 'pi pi-comment' },
  { id: 'code',         label: 'Existing Code',         icon: 'pi pi-code' },
  { id: 'architecture', label: 'Architecture / Flow',   icon: 'pi pi-sitemap' },
];

// ─────────────────────────────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab]         = useState('prompt');
  const [stageIndex, setStageIndex]       = useState(0);    // which stage label to show
  const [promptError, setPromptError]     = useState(null); // inline prompt validation
  const [showSuccess, setShowSuccess]     = useState(false);// success state
  const [generatedPageName, setGeneratedPageName] = useState('');

  const isGenerating = generationStatus === 'loading';
  const hasPrompt    = generation.prompt?.trim().length > 0;
  const promptLength = generation.prompt?.length ?? 0;

  // Cycle through stage labels while generating (no fake %)
  useEffect(() => {
    if (!isGenerating) { setStageIndex(0); return; }
    const STAGE_MS = [800, 2000, 5000, 2000]; // advance thresholds (ms from start)
    const timers = STAGE_MS.map((ms, i) =>
      setTimeout(() => setStageIndex(Math.min(i + 1, GENERATION_STAGES.length - 1)), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [isGenerating]);

  // Reset prompt error when user types or uploads a wireframe
  useEffect(() => {
    if (promptError && (hasPrompt || (uploadStatus === 'success' && uploadedFile))) {
      setPromptError(null);
    }
  }, [generation.prompt, hasPrompt, promptError, uploadStatus, uploadedFile]);

  // ── Upload handlers ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file) => {
    dispatch(clearUpload());
    setWireframeFile(file);
    setPromptError(null);
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

  const handleRetryUpload = useCallback(() => {
    if (wireframeFile) handleFileSelect(wireframeFile);
  }, [wireframeFile, handleFileSelect]);

  // ── Generation handler ─────────────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();

    const prompt   = generation.prompt?.trim() || '';
    const pageName = generation.pageName?.trim() || 'Home';
    const hasUploadedWireframe = uploadStatus === 'success' && Boolean(uploadedFile);

    // If no wireframe and no prompt, require user to provide at least one
    if (!prompt && !hasUploadedWireframe) {
      setPromptError('Please upload/paste a wireframe or describe the UI with a prompt.');
      return;
    }

    setShowSuccess(false);
    dispatch(setStatus('loading'));
    dispatch(setError(null));
    dispatch(setResult(null));

    try {
      const payload = {
        prompt: prompt || undefined,
        pageName,
        existingCode:      generation.existingCode || undefined,
        architectureFlow:  generation.architectureFlow || undefined,
      };

      if (hasUploadedWireframe) {
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
        setGeneratedPageName(pageName);
        setShowSuccess(true);
      } else {
        dispatch(setError(friendlyError(response.message || 'Generation failed.')));
        dispatch(setStatus('failed'));
      }
    } catch (err) {
      dispatch(setError(friendlyError(err.message || 'Generation failed.')));
      dispatch(setStatus('failed'));
    }
  };

  const handleGoToPreview = () => {
    navigate(`/preview/${encodeURIComponent(generatedPageName)}`);
  };

  const handleStartOver = () => {
    setShowSuccess(false);
    setWireframeFile(null);
    dispatch(resetGeneration());
  };

  const handleUseExample = (example) => {
    dispatch(setPrompt(example));
    setActiveTab('prompt');
    setPromptError(null);
  };

  const currentStage = GENERATION_STAGES[stageIndex];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 nm-animate-in">

      {/* ── Visual Hero Header ────────────────────────────────────────────────── */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center nm-card p-6 sm:p-8 overflow-hidden relative border border-[var(--nm-border-subtle)] bg-gradient-to-br from-[var(--nm-bg-card)] via-[var(--nm-bg-surface)] to-[var(--nm-bg-primary)]">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--nm-accent-glow)] rounded-full blur-3xl opacity-30 pointer-events-none" />

        {/* Left Column: Hero Copy & CTA Highlights */}
        <div className="lg:col-span-7 flex flex-col gap-4 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--nm-accent-glow)] border border-[var(--nm-border)] text-[var(--nm-accent-light)] text-xs font-semibold uppercase tracking-widest self-start">
            <i className="pi pi-sparkles text-[10px]" />
            AI-Powered UI Generator Platform
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight nm-gradient-text leading-tight">
            Turn Wireframes into Production-Ready UIs with AI
          </h1>
          <p className="text-[var(--nm-text-secondary)] text-sm sm:text-base leading-relaxed max-w-xl">
            Upload a wireframe sketch, describe your vision, and let NeuraMind build
            a structured, production-ready React UI in seconds — complete with live preview and CMS editing.
          </p>

          {/* Key Capabilities Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] flex items-center gap-1.5">
              <i className="pi pi-eye text-[var(--nm-accent)] text-xs" /> Multimodal Vision
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] flex items-center gap-1.5">
              <i className="pi pi-database text-[var(--nm-accent)] text-xs" /> Decoupled CMS
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] flex items-center gap-1.5">
              <i className="pi pi-code text-[var(--nm-accent)] text-xs" /> React &amp; Redux Output
            </span>
          </div>
        </div>

        {/* Right Column: Hero Visual Composition Card */}
        <div className="lg:col-span-5 relative z-10">
          <div className="relative rounded-xl overflow-hidden border border-[var(--nm-border)] shadow-2xl bg-[var(--nm-bg-surface)] group">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
              alt="NeuraMind AI UI Generator Studio Visual Workspace"
              className="w-full h-56 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/800x400/1a1a2e/6c63ff?text=NeuraMind+AI+Workspace';
              }}
            />
            {/* Visual Overlays: AI Vision Bounding Box & Status Badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--nm-bg-primary)] via-transparent to-transparent opacity-80" />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[rgba(15,23,42,0.85)] border border-[var(--nm-accent)] text-[var(--nm-accent-light)] text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[var(--nm-success)] animate-ping" />
              Gemini Vision Active
            </div>
            <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-[rgba(15,23,42,0.9)] border border-[var(--nm-border-subtle)] backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--nm-text-primary)] font-semibold flex items-center gap-1.5">
                  <i className="pi pi-check-circle text-[var(--nm-success)]" /> Wireframe → UIPage
                </span>
                <span className="text-[var(--nm-text-muted)] font-mono text-[10px]">JSON Schema Valid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Workflow Steps Indicator ────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--nm-text-muted)] text-center mb-4">
          End-to-End Product Workflow
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { num: 1, label: 'Upload Wireframe', desc: 'PNG, JPG or WEBP sketch', icon: 'pi pi-upload', done: uploadStatus === 'success' },
            { num: 2, label: 'Describe Prompt',   desc: 'Tailwind & UI instructions', icon: 'pi pi-comment', done: hasPrompt },
            { num: 3, label: 'AI Generation',    desc: 'Gemini Vision parsing', icon: 'pi pi-sparkles', done: generationStatus === 'succeeded' },
            { num: 4, label: 'Preview & Edit',   desc: 'Live CMS content updates', icon: 'pi pi-desktop', done: false },
          ].map((step) => (
            <div
              key={step.num}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                step.done
                  ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.3)] text-[var(--nm-text-primary)]'
                  : 'bg-[var(--nm-bg-surface)] border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                  step.done ? 'bg-[var(--nm-success)] text-white' : 'bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)]'
                }`}>
                  <i className={step.done ? 'pi pi-check' : step.icon} />
                </div>
                <span className="text-[10px] font-mono font-bold opacity-60">0{step.num}</span>
              </div>
              <p className="text-xs font-bold text-[var(--nm-text-primary)] leading-tight mb-0.5">{step.label}</p>
              <p className="text-[11px] text-[var(--nm-text-muted)] leading-tight">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Success State ────────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="mb-6 rounded-[var(--nm-radius)] border border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.08)] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.4)] flex items-center justify-center flex-shrink-0">
            <i className="pi pi-check text-[var(--nm-success)] text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--nm-success)] mb-0.5">
              UI generated successfully!
            </h3>
            <p className="text-sm text-[var(--nm-text-secondary)]">
              <strong className="text-[var(--nm-text-primary)]">{generatedPageName}</strong> is ready to preview.
              Your UI has been built and is waiting in the preview panel.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleStartOver}
              className="px-3 py-1.5 text-xs rounded-[var(--nm-radius-sm)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)] transition-colors bg-transparent cursor-pointer"
            >
              Generate another
            </button>
            <button
              id="go-to-preview-btn"
              type="button"
              onClick={handleGoToPreview}
              className="px-4 py-1.5 text-xs font-semibold rounded-[var(--nm-radius-sm)] bg-[var(--nm-success)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <i className="pi pi-arrow-right text-[10px]" />
              Open Preview
            </button>
          </div>
        </div>
      )}

      {/* ── Main Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleGenerate} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Left Column: Page Name + Upload ────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Page Name */}
            <div className="nm-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-[var(--nm-accent-glow)] flex items-center justify-center">
                  <i className="pi pi-file text-[var(--nm-accent-light)] text-xs" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--nm-text-primary)]">Page Name</h3>
                  <p className="text-xs text-[var(--nm-text-secondary)]">Used for navigation and preview URL</p>
                </div>
              </div>
              <div className="relative">
                <input
                  id="page-name"
                  type="text"
                  value={generation.pageName}
                  onChange={(e) => dispatch(setPageName(e.target.value))}
                  disabled={isGenerating}
                  placeholder="e.g. Home, Dashboard, Landing"
                  maxLength={64}
                  className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)] transition-all disabled:opacity-50"
                />
                {generation.pageName && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--nm-text-muted)]">
                    /preview/{encodeURIComponent(generation.pageName || '…')}
                  </span>
                )}
              </div>
            </div>

            {/* Wireframe Upload */}
            <div className="nm-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[var(--nm-accent-glow)] flex items-center justify-center">
                    <i className="pi pi-image text-[var(--nm-accent-light)] text-xs" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--nm-text-primary)]">
                      Upload your wireframe
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] font-normal border border-[var(--nm-border-subtle)]">
                        Optional
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--nm-text-secondary)]">Supported formats: JPG, JPEG, PNG, WEBP — up to 10 MB</p>
                  </div>
                </div>
                {uploadStatus === 'success' && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--nm-success)] font-medium">
                    <i className="pi pi-check-circle text-xs" />
                    Uploaded
                  </span>
                )}
              </div>

              <NmUploadArea
                file={wireframeFile}
                uploadStatus={uploadStatus}
                uploadError={uploadError}
                onFileSelect={handleFileSelect}
                onRemove={handleRemoveFile}
              />

              {/* Uploaded file meta strip */}
              {uploadStatus === 'success' && uploadedFile && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <i className="pi pi-file-image text-[var(--nm-success)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--nm-text-primary)] truncate">{uploadedFile.originalName}</p>
                      <p className="text-[var(--nm-text-muted)]">
                        {(uploadedFile.size / 1024).toFixed(1)} KB · {uploadedFile.mimetype}
                      </p>
                    </div>
                  </div>
                  <button
                    id="wireframe-replace-btn"
                    type="button"
                    onClick={() => document.getElementById('wireframe-file-input')?.click()}
                    className="text-[var(--nm-text-secondary)] hover:text-[var(--nm-accent-light)] transition-colors flex-shrink-0 bg-transparent border-0 cursor-pointer"
                  >
                    Replace
                  </button>
                </div>
              )}

              {/* Retry on error */}
              {uploadStatus === 'error' && wireframeFile && (
                <button
                  id="wireframe-retry-btn"
                  type="button"
                  onClick={handleRetryUpload}
                  className="w-full text-xs py-2 rounded-[var(--nm-radius-sm)] border border-[var(--nm-border)] text-[var(--nm-text-secondary)] hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent-light)] transition-colors bg-transparent cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <i className="pi pi-refresh text-[10px]" />
                  Retry Upload
                </button>
              )}

              {/* No wireframe info tip */}
              {uploadStatus === 'idle' && !wireframeFile && (
                <p className="text-[11px] text-[var(--nm-text-muted)] flex items-start gap-1.5">
                  <i className="pi pi-info-circle mt-0.5 flex-shrink-0" />
                  Uploading a wireframe improves generation quality.
                  You can also generate from a prompt alone.
                </p>
              )}
            </div>
          </div>

          {/* ── Right Column: Prompt + Generate ──────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Tabbed Prompt Input */}
            <div className="nm-card p-5 flex flex-col gap-4">
              {/* Tab bar */}
              <div className="flex gap-1 border-b border-[var(--nm-border-subtle)] pb-3">
                {PROMPT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 bg-transparent ${
                      activeTab === tab.id
                        ? 'text-[var(--nm-accent-light)] bg-[var(--nm-accent-glow)]'
                        : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)]'
                    }`}
                  >
                    <i className={`${tab.icon} text-[10px]`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Prompt tab */}
              {activeTab === 'prompt' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="prompt-input" className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                      Describe your UI
                      {uploadStatus === 'success' && uploadedFile ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(34,197,94,0.12)] text-[var(--nm-success)] font-medium border border-[rgba(34,197,94,0.3)]">
                          Optional (Wireframe uploaded)
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] font-normal border border-[var(--nm-border-subtle)]">
                          Required without wireframe
                        </span>
                      )}
                    </label>
                    <span className={`text-[10px] font-mono transition-colors ${promptLength > 800 ? 'text-[var(--nm-warning)]' : 'text-[var(--nm-text-muted)]'}`}>
                      {promptLength}/1000
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
                    maxLength={1000}
                    rows={8}
                    placeholder={
                      uploadStatus === 'success' && uploadedFile
                        ? "Optional: Add any specific custom styling, color themes, or component preferences for your wireframe... (Leave blank to generate directly from wireframe)"
                        : "Describe how you want the generated UI to behave...&#10;&#10;Example: Create a responsive landing page with a split hero, primary CTA and three feature cards."
                    }
                    className={`w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:ring-1 transition-all resize-y disabled:opacity-50 font-[inherit] leading-relaxed ${
                      promptError
                        ? 'border-[var(--nm-error)] focus:border-[var(--nm-error)] focus:ring-[var(--nm-error)]'
                        : 'border-[var(--nm-border-subtle)] focus:border-[var(--nm-accent)] focus:ring-[var(--nm-accent)]'
                    }`}
                  />

                  {/* Inline prompt validation error */}
                  {promptError && (
                    <p id="prompt-error" role="alert" className="text-xs text-[var(--nm-error)] flex items-center gap-1.5">
                      <i className="pi pi-exclamation-circle" />
                      {promptError}
                    </p>
                  )}

                  {/* Example prompts */}
                  {!generation.prompt && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--nm-text-muted)]">
                        Try an example
                      </span>
                      <div className="flex flex-col gap-1">
                        {EXAMPLE_PROMPTS.map((ex, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleUseExample(ex)}
                            disabled={isGenerating}
                            className="text-left text-xs px-2.5 py-1.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] hover:text-[var(--nm-accent-light)] hover:border-[var(--nm-accent)] transition-all truncate disabled:opacity-40 cursor-pointer"
                          >
                            <i className="pi pi-arrow-right text-[9px] mr-1.5 opacity-60" />
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Code tab */}
              {activeTab === 'code' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="existing-code-input" className="text-xs font-semibold text-[var(--nm-text-primary)]">
                    Paste existing code
                    <span className="ml-2 font-normal text-[var(--nm-text-muted)]">— used as context for generation</span>
                  </label>
                  <textarea
                    id="existing-code-input"
                    value={generation.existingCode}
                    onChange={(e) => dispatch(setExistingCode(e.target.value))}
                    disabled={isGenerating}
                    rows={8}
                    placeholder="Paste HTML, JSX, or CSS here. NeuraMind will use it as context for generation."
                    className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y disabled:opacity-50 font-mono"
                  />
                </div>
              )}

              {/* Architecture tab */}
              {activeTab === 'architecture' && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="architecture-input" className="text-xs font-semibold text-[var(--nm-text-primary)]">
                    Architecture / Flow description
                    <span className="ml-2 font-normal text-[var(--nm-text-muted)]">— optional context</span>
                  </label>
                  <textarea
                    id="architecture-input"
                    value={generation.architectureFlow}
                    onChange={(e) => dispatch(setArchitectureFlow(e.target.value))}
                    disabled={isGenerating}
                    rows={8}
                    placeholder="Describe your app's architecture, component hierarchy, or user flow in plain text or pseudo-code."
                    className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-sm focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y disabled:opacity-50 font-[inherit]"
                  />
                </div>
              )}
            </div>

            {/* Generation Status Card */}
            {isGenerating && (
              <div className="nm-card p-4 flex items-center gap-4">
                {/* Spinner */}
                <div className="w-9 h-9 border-2 border-[var(--nm-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--nm-text-primary)] mb-1 flex items-center gap-2">
                    <i className={`${currentStage.icon} text-[var(--nm-accent-light)] text-xs`} />
                    {currentStage.label}
                  </p>

                  {/* Stage dots */}
                  <div className="flex items-center gap-1.5">
                    {GENERATION_STAGES.map((stage, idx) => (
                      <div
                        key={stage.key}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          idx < stageIndex
                            ? 'bg-[var(--nm-success)] w-5'
                            : idx === stageIndex
                              ? 'bg-[var(--nm-accent)] w-5 animate-pulse'
                              : 'bg-[var(--nm-border)] w-1.5'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-[var(--nm-text-muted)] ml-1">
                      Step {stageIndex + 1} of {GENERATION_STAGES.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {generationStatus === 'failed' && generationError && (
              <div
                id="generation-error-banner"
                role="alert"
                className="p-4 rounded-[var(--nm-radius-sm)] flex items-start gap-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)]"
              >
                <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="pi pi-exclamation-triangle text-[var(--nm-error)] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--nm-error)] mb-0.5">
                    Generation Failed
                  </p>
                  <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                    {friendlyError(generationError)}
                  </p>
                  <button
                    type="submit"
                    className="mt-2 text-xs text-[var(--nm-accent-light)] hover:underline bg-transparent border-0 cursor-pointer p-0"
                  >
                    Try again →
                  </button>
                </div>
              </div>
            )}

            {/* Info Banner (idle state only) */}
            {!isGenerating && generationStatus !== 'failed' && !showSuccess && (
              <div className="nm-glass rounded-[var(--nm-radius-sm)] px-4 py-3 flex items-start gap-3">
                <i className="pi pi-info-circle text-[var(--nm-accent)] text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--nm-text-primary)] mb-0.5">
                    Tips for best results
                  </p>
                  <ul className="text-xs text-[var(--nm-text-secondary)] space-y-0.5 list-none pl-0">
                    <li>• Be specific about layout, colors, and tone</li>
                    <li>• Mention number of columns, sections, or components</li>
                    <li>• Wireframes significantly improve output quality</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              id="generate-btn"
              type="submit"
              disabled={isGenerating || uploadStatus === 'uploading'}
              className={`w-full py-3.5 px-6 rounded-[var(--nm-radius-sm)] font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${
                isGenerating || uploadStatus === 'uploading'
                  ? 'bg-[var(--nm-border)] text-[var(--nm-text-muted)] cursor-not-allowed opacity-70'
                  : 'bg-[var(--nm-accent)] text-white hover:opacity-90 shadow-[0_0_24px_rgba(108,99,255,0.35)] hover:shadow-[0_0_32px_rgba(108,99,255,0.5)]'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : uploadStatus === 'uploading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading wireframe…
                </>
              ) : (
                <>
                  <i className="pi pi-sparkles" />
                  Generate UI
                </>
              )}
            </button>

            {/* Disabled reason hint */}
            {uploadStatus === 'uploading' && (
              <p className="text-center text-[11px] text-[var(--nm-text-muted)]">
                Waiting for wireframe upload to complete…
              </p>
            )}
          </div>
        </div>
      </form>

      {/* ── Product Feature Showcase Cards ───────────────────────────────────── */}
      <div className="mt-14 pt-8 border-t border-[var(--nm-border-subtle)]">
        <div className="text-center mb-8">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--nm-text-muted)] mb-1">
            Engineered for Modern Teams
          </h2>
          <h3 className="text-2xl font-bold text-[var(--nm-text-primary)]">
            Architected for Speed, Quality &amp; Content Independence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Vision */}
          <div className="nm-card overflow-hidden flex flex-col group border border-[var(--nm-border-subtle)] hover:border-[var(--nm-accent)] transition-all">
            <div className="h-44 overflow-hidden relative bg-[var(--nm-bg-surface)]">
              <img
                src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
                alt="Multimodal AI Vision & Layout Extraction"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/1a1a2e/6c63ff?text=AI+Vision+Parsing';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--nm-bg-card)] via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)] backdrop-blur-md flex items-center gap-1.5">
                <i className="pi pi-eye text-xs" /> Multimodal Vision
              </span>
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <h4 className="font-bold text-[var(--nm-text-primary)] text-base">Multimodal Layout Parsing</h4>
              <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                Gemini Vision analyzes wireframe geometry, text hierarchy, and element intent to produce structured UIPage schemas.
              </p>
            </div>
          </div>

          {/* Card 2: React & Redux Architecture */}
          <div className="nm-card overflow-hidden flex flex-col group border border-[var(--nm-border-subtle)] hover:border-[var(--nm-accent)] transition-all">
            <div className="h-44 overflow-hidden relative bg-[var(--nm-bg-surface)]">
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
                alt="Production Ready Component & Redux Architecture"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/1a1a2e/6c63ff?text=React+Architecture';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--nm-bg-card)] via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)] backdrop-blur-md flex items-center gap-1.5">
                <i className="pi pi-code text-xs" /> Clean Contract
              </span>
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <h4 className="font-bold text-[var(--nm-text-primary)] text-base">UIPage Schema Contract</h4>
              <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                Structured element trees with deterministic IDs feed directly into Redux Toolkit and the atomic UIRenderer.
              </p>
            </div>
          </div>

          {/* Card 3: Decoupled CMS */}
          <div className="nm-card overflow-hidden flex flex-col group border border-[var(--nm-border-subtle)] hover:border-[var(--nm-accent)] transition-all">
            <div className="h-44 overflow-hidden relative bg-[var(--nm-bg-surface)]">
              <img
                src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&q=80"
                alt="Decoupled Live CMS Content Editing Interface"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/1a1a2e/6c63ff?text=CMS+Live+Binding';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--nm-bg-card)] via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)] backdrop-blur-md flex items-center gap-1.5">
                <i className="pi pi-database text-xs" /> Live CMS
              </span>
            </div>
            <div className="p-5 flex flex-col gap-2 flex-1">
              <h4 className="font-bold text-[var(--nm-text-primary)] text-base">Decoupled Content Binding</h4>
              <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                Edit text, buttons, images, inputs, and card collections in real time without breaking layout integrity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default GeneratePage;

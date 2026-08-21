/**
 * GeneratePage — /generate
 *
 * End-to-end pipeline:
 *   Task 2: wireframe upload (preserved)
 *   Task 3: prompt + wireframe → AI → UIPage JSON → Redux → navigate to preview
 */
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import NmCard from '../components/NmCard';
import NmButton from '../components/NmButton';
import NmInput from '../components/NmInput';
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
} from '../features/generation/generationSlice';
import { setPage } from '../features/pages/pagesSlice';

const GeneratePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const generation = useSelector(selectGeneration);
  const uploadStatus = useSelector(selectUploadStatus);
  const uploadedFile = useSelector(selectUploadedFile);
  const uploadError = useSelector(selectUploadError);
  const generationStatus = useSelector(selectGenerationStatus);
  const generationError = useSelector(selectGenerationError);

  // wireframeFile lives in local state — File objects are not serialisable to Redux
  const [wireframeFile, setWireframeFile] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt');

  const isGenerating = generationStatus === 'loading';

  // ── Upload handlers (Task 2 — preserved) ──────────────────────────────────

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
      dispatch(setUploadError(err.message || 'Upload failed. Please try again.'));
      dispatch(setUploadStatus('error'));
    }
  }, [dispatch]);

  const handleRemoveFile = useCallback(() => {
    setWireframeFile(null);
    dispatch(clearUpload());
  }, [dispatch]);

  const handleRetryUpload = useCallback(() => {
    if (wireframeFile) {
      handleFileSelect(wireframeFile);
    }
  }, [wireframeFile, handleFileSelect]);

  // ── Generation handler (Task 3) ───────────────────────────────────────────

  const handleGenerate = async (e) => {
    e.preventDefault();

    const prompt = generation.prompt?.trim();
    if (!prompt) {
      dispatch(setError('Please enter a prompt describing the UI you want to generate.'));
      dispatch(setStatus('failed'));
      return;
    }

    const pageName = generation.pageName?.trim() || 'Home';

    dispatch(setStatus('loading'));
    dispatch(setError(null));
    dispatch(setResult(null));

    try {
      const payload = {
        prompt,
        pageName,
        existingCode: generation.existingCode || undefined,
        architectureFlow: generation.architectureFlow || undefined,
      };

      // Attach wireframe info if uploaded
      if (uploadStatus === 'success' && uploadedFile) {
        payload.wireframe = {
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalName,
        };
      }

      const response = await generateUI(payload);

      if (response.success && response.page) {
        dispatch(setResult(response.page));
        dispatch(setPage({ pageName, data: response.page }));
        dispatch(setStatus('succeeded'));
        navigate(`/preview/${encodeURIComponent(pageName)}`);
      } else {
        dispatch(setError(response.message || 'Generation failed.'));
        dispatch(setStatus('failed'));
      }
    } catch (err) {
      dispatch(setError(err.message || 'Generation failed. Please try again.'));
      dispatch(setStatus('failed'));
    }
  };

  const tabs = [
    { id: 'prompt', label: 'Prompt', icon: 'pi pi-comment' },
    { id: 'code', label: 'Existing Code', icon: 'pi pi-code' },
    { id: 'architecture', label: 'Architecture / Flow', icon: 'pi pi-sitemap' },
  ];

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 nm-animate-in">
      {/* Hero header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight nm-gradient-text mb-3">
          Generate UI with AI
        </h1>
        <p className="text-[var(--nm-text-secondary)] text-lg max-w-xl mx-auto">
          Upload a wireframe, describe your vision, or paste existing code —
          NeuraMind converts it into a production-ready UI.
        </p>
      </div>

      <form onSubmit={handleGenerate} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left column ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Page name */}
            <NmCard title="Page Name" subtitle="Give your generated page a name">
              <NmInput
                id="page-name"
                placeholder="e.g. Home, Dashboard, Landing"
                value={generation.pageName}
                onChange={(e) => dispatch(setPageName(e.target.value))}
                disabled={isGenerating}
              />
            </NmCard>

            {/* Wireframe upload */}
            <NmCard
              title="Wireframe Upload"
              subtitle="JPG, JPEG, PNG or WEBP — up to 10 MB"
            >
              <NmUploadArea
                file={wireframeFile}
                uploadStatus={uploadStatus}
                uploadError={uploadError}
                onFileSelect={handleFileSelect}
                onRemove={handleRemoveFile}
              />

              {uploadStatus === 'success' && uploadedFile && (
                <div
                  id="upload-success-banner"
                  className="
                    mt-3 flex items-center justify-between gap-3
                    rounded-[var(--nm-radius-sm)] px-3 py-2
                    bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)]
                  "
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <i className="pi pi-check-circle text-[var(--nm-success)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--nm-text-primary)] truncate">
                        {uploadedFile.originalName}
                      </p>
                      <p className="text-xs text-[var(--nm-text-muted)]">
                        {(uploadedFile.size / 1024).toFixed(1)} KB · {uploadedFile.mimetype}
                      </p>
                    </div>
                  </div>
                  <button
                    id="wireframe-replace-btn"
                    type="button"
                    onClick={() => document.getElementById('wireframe-file-input')?.click()}
                    className="
                      text-xs text-[var(--nm-text-secondary)] hover:text-[var(--nm-accent-light)]
                      flex-shrink-0 transition-colors border-0 bg-transparent cursor-pointer
                    "
                  >
                    Replace
                  </button>
                </div>
              )}

              {uploadStatus === 'error' && wireframeFile && (
                <button
                  id="wireframe-retry-btn"
                  type="button"
                  onClick={handleRetryUpload}
                  className="
                    mt-2 w-full text-xs py-1.5 rounded-[var(--nm-radius-sm)]
                    border border-[var(--nm-border)] text-[var(--nm-text-secondary)]
                    hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent-light)]
                    transition-colors bg-transparent cursor-pointer
                  "
                >
                  <i className="pi pi-refresh mr-1" />
                  Retry Upload
                </button>
              )}
            </NmCard>

          </div>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Tabbed input area */}
            <NmCard>
              <div className="flex gap-1 mb-5 border-b border-[var(--nm-border-subtle)] pb-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      transition-colors cursor-pointer border-0 bg-transparent
                      ${activeTab === tab.id
                        ? 'text-[var(--nm-accent-light)] bg-[var(--nm-accent-glow)]'
                        : 'text-[var(--nm-text-secondary)] hover:text-[var(--nm-text-primary)]'
                      }
                    `}
                  >
                    <i className={`${tab.icon} text-xs`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'prompt' && (
                <NmInput
                  id="prompt-input"
                  label="Describe your UI"
                  placeholder="e.g. A hero section with a headline, subtitle, and CTA button. Dark theme, modern SaaS style."
                  value={generation.prompt}
                  onChange={(e) => dispatch(setPrompt(e.target.value))}
                  multiline
                  rows={8}
                  disabled={isGenerating}
                />
              )}

              {activeTab === 'code' && (
                <NmInput
                  id="existing-code-input"
                  label="Paste existing code"
                  placeholder="Paste HTML, JSX, or CSS here. NeuraMind will use it as context for generation."
                  value={generation.existingCode}
                  onChange={(e) => dispatch(setExistingCode(e.target.value))}
                  multiline
                  rows={8}
                  disabled={isGenerating}
                />
              )}

              {activeTab === 'architecture' && (
                <NmInput
                  id="architecture-input"
                  label="Architecture / Flow description"
                  placeholder="Describe your app's architecture, component hierarchy, or user flow in plain text or pseudo-code."
                  value={generation.architectureFlow}
                  onChange={(e) => dispatch(setArchitectureFlow(e.target.value))}
                  multiline
                  rows={8}
                  disabled={isGenerating}
                />
              )}
            </NmCard>

            {/* Generation error banner */}
            {generationStatus === 'failed' && generationError && (
              <div
                id="generation-error-banner"
                role="alert"
                className="rounded-[var(--nm-radius-sm)] px-4 py-3 flex items-start gap-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]"
              >
                <i className="pi pi-exclamation-triangle text-[var(--nm-error)] text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--nm-error)] mb-0.5">
                    Generation Failed
                  </p>
                  <p className="text-xs text-[var(--nm-text-secondary)]">
                    {generationError}
                  </p>
                </div>
              </div>
            )}

            {/* Generating indicator */}
            {isGenerating && (
              <div className="nm-glass rounded-[var(--nm-radius-sm)] px-4 py-4 flex items-center gap-4">
                <div className="w-8 h-8 border-2 border-[var(--nm-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--nm-text-primary)] mb-0.5">
                    Generating UI…
                  </p>
                  <p className="text-xs text-[var(--nm-text-muted)]">
                    AI is analysing your inputs and building the page structure. This may take 10–30 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* Info banner (only when idle) */}
            {!isGenerating && generationStatus !== 'failed' && (
              <div className="nm-glass rounded-[var(--nm-radius-sm)] px-4 py-3 flex items-start gap-3">
                <i className="pi pi-sparkles text-[var(--nm-accent)] text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--nm-text-primary)] mb-0.5">
                    AI-Powered Generation
                  </p>
                  <p className="text-xs text-[var(--nm-text-secondary)]">
                    Enter a prompt describing your UI and optionally upload a wireframe.
                    Click Generate to create a structured UI preview.
                  </p>
                </div>
              </div>
            )}

            {/* Generate button */}
            <NmButton
              id="generate-btn"
              variant="primary"
              type="submit"
              label={isGenerating ? 'Generating…' : 'Generate UI'}
              icon={isGenerating ? undefined : 'pi pi-sparkles'}
              loading={isGenerating}
              disabled={isGenerating || uploadStatus === 'uploading'}
              className="w-full justify-center py-3 text-base"
            />

          </div>
        </div>
      </form>
    </main>
  );
};

export default GeneratePage;

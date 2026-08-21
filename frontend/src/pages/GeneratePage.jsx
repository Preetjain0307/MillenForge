/**
 * GeneratePage — /generate
 *
 * Implements end-to-end wireframe upload pipeline (Task 2).
 * AI generation is NOT implemented yet.
 */
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import NmCard from '../components/NmCard';
import NmButton from '../components/NmButton';
import NmInput from '../components/NmInput';
import NmUploadArea from '../components/NmUploadArea';
import { uploadWireframe } from '../services/api';
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
  selectGeneration,
  selectUploadStatus,
  selectUploadedFile,
  selectUploadError,
} from '../features/generation/generationSlice';

const GeneratePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const generation = useSelector(selectGeneration);
  const uploadStatus = useSelector(selectUploadStatus);
  const uploadedFile = useSelector(selectUploadedFile);
  const uploadError = useSelector(selectUploadError);

  // wireframeFile lives in local state — File objects are not serialisable to Redux
  const [wireframeFile, setWireframeFile] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt');

  // ── Upload handlers ──────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file) => {
    // Reset any previous upload state, store the new file locally
    dispatch(clearUpload());
    setWireframeFile(file);

    // Immediately begin upload
    dispatch(setUploadStatus('uploading'));
    try {
      const response = await uploadWireframe(file);
      // response.file = { filename, originalName, mimetype, size, url }
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

  // ── Generate (AI — future task) ──────────────────────────────────────────────

  const handleGenerate = (e) => {
    e.preventDefault();
    const page = generation.pageName || 'Home';
    navigate(`/preview/${encodeURIComponent(page)}`);
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

              {/* File metadata row (shown after successful upload) */}
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

              {/* Retry button on error */}
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
              {/* Tabs */}
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
                />
              )}
            </NmCard>

            {/* Notice banner */}
            <div className="nm-glass rounded-[var(--nm-radius-sm)] px-4 py-3 flex items-start gap-3">
              <i className="pi pi-info-circle text-[var(--nm-accent)] text-lg mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--nm-text-primary)] mb-0.5">
                  AI Generation — Coming Next
                </p>
                <p className="text-xs text-[var(--nm-text-secondary)]">
                  Wireframe upload is live. Full LLM/Vision generation will be wired in a future task.
                  Clicking Generate navigates to the preview placeholder.
                </p>
              </div>
            </div>

            {/* Generate button */}
            <NmButton
              id="generate-btn"
              variant="primary"
              type="submit"
              label="Generate UI"
              icon="pi pi-sparkles"
              loading={uploadStatus === 'uploading'}
              disabled={uploadStatus === 'uploading'}
              className="w-full justify-center py-3 text-base"
            />

          </div>
        </div>
      </form>
    </main>
  );
};

export default GeneratePage;

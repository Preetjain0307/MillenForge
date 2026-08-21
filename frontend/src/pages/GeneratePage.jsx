/**
 * GeneratePage — /generate
 *
 * Foundation placeholder for the NeuraMind generation interface.
 * Contains input areas for: wireframe upload, prompt, existing code, architecture flow.
 * AI generation is NOT implemented yet.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import NmCard from '../components/NmCard';
import NmButton from '../components/NmButton';
import NmInput from '../components/NmInput';
import NmUploadArea from '../components/NmUploadArea';
import {
  setPrompt,
  setExistingCode,
  setArchitectureFlow,
  setPageName,
  setUploadedWireframePath,
  selectGeneration,
} from '../features/generation/generationSlice';

const GeneratePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const generation = useSelector(selectGeneration);

  const [wireframeFile, setWireframeFile] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'code' | 'architecture'

  const handleWireframeSelect = (file) => {
    setWireframeFile(file);
    dispatch(setUploadedWireframePath(file.name));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    // Placeholder: AI generation not yet implemented
    // Navigate to preview with the entered page name or a default
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

          {/* Left column */}
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
              subtitle="Upload a sketch or wireframe image for AI to interpret"
            >
              <NmUploadArea
                onFileSelect={handleWireframeSelect}
                file={wireframeFile}
              />
              {wireframeFile && (
                <p className="text-xs text-[var(--nm-text-muted)] mt-2 flex items-center gap-1">
                  <i className="pi pi-check-circle text-[var(--nm-success)]" />
                  {wireframeFile.name} ({(wireframeFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </NmCard>

          </div>

          {/* Right column */}
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

              {/* Tab panels */}
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
                  Foundation Mode
                </p>
                <p className="text-xs text-[var(--nm-text-secondary)]">
                  AI generation is not yet implemented. Clicking Generate will take you to the
                  preview page placeholder. Full LLM/Vision integration coming soon.
                </p>
              </div>
            </div>

            {/* Generate button */}
            <NmButton
              variant="primary"
              type="submit"
              label="Generate UI"
              icon="pi pi-sparkles"
              className="w-full justify-center py-3 text-base"
            />

          </div>
        </div>
      </form>
    </main>
  );
};

export default GeneratePage;

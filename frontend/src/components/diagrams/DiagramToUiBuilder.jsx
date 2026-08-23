/**
 * DiagramToUiBuilder — Any Software Diagram to Live UI Synthesis Workbench
 *
 * Supports:
 *  - Upload / Paste (Ctrl+V) any software diagram image (Architecture, DFD, Use Case, Sequence, ERD, Microservices)
 *  - Diagram Code / Text Paste (Mermaid, PlantUML, ASCII, Architecture Specs)
 *  - Diagram Pattern Selector (Architecture, Data Flow, Use Case, Sequence, Schema, Workflow, Auto-Detect)
 *  - Preset Blueprints for instant one-click testing
 *  - Full AI Vision & LLM generation compiling directly into canonical UIPage
 */

import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadWireframe, generateUI } from '../../services/api';
import { setPage, setActivePage } from '../../features/pages/pagesSlice';
import NmUploadArea from '../NmUploadArea';
import NmButton from '../NmButton';

export const DIAGRAM_TYPES = [
  {
    id: 'architecture',
    label: 'Architecture & Microservices',
    icon: 'pi pi-cloud',
    badge: 'System Console',
    description: 'Cloud topologies, microservice meshes, API gateways, clusters, and load balancers.',
    placeholderPrompt: 'e.g. Build an operations dashboard visualizing microservice health, latency meters, and ingress routers.',
  },
  {
    id: 'dataflow',
    label: 'Data Flow Diagram (DFD) & ETL',
    icon: 'pi pi-sync',
    badge: 'Pipeline Dashboard',
    description: 'Data ingestion sources, stream processors, queues, transformation stages, and sinks.',
    placeholderPrompt: 'e.g. Build a data pipeline monitor displaying throughput graphs, active Kafka partitions, and batch controls.',
  },
  {
    id: 'usecase',
    label: 'Use Case & User Journey',
    icon: 'pi pi-users',
    badge: 'Functional Portal',
    description: 'Actor roles, permission boundaries, end-user workflows, and functional interactions.',
    placeholderPrompt: 'e.g. Build the end-user portal satisfying these use cases with step-by-step action wizards and forms.',
  },
  {
    id: 'sequence',
    label: 'System Sequence & API Flow',
    icon: 'pi pi-arrows-alt',
    badge: 'Workflow Inspector',
    description: 'Request/response timelines, auth handshakes, webhook lifecycles, and event callbacks.',
    placeholderPrompt: 'e.g. Build an interactive execution viewer with step status indicators, payload cards, and retry triggers.',
  },
  {
    id: 'schema',
    label: 'Entity-Relationship (ERD) / Schema',
    icon: 'pi pi-database',
    badge: 'Data Management UI',
    description: 'Database tables, relational foreign keys, collections, document models, and fields.',
    placeholderPrompt: 'e.g. Build an admin CRUD management interface for exploring and querying these relational entities.',
  },
  {
    id: 'workflow',
    label: 'Process & State Machine Flow',
    icon: 'pi pi-check-square',
    badge: 'Process Manager',
    description: 'Business process lifecycles, order fulfillment states, approval steps, and transitions.',
    placeholderPrompt: 'e.g. Build a visual process manager with state columns, task approval cards, and trigger forms.',
  },
  {
    id: 'auto',
    label: 'Auto-Detect Any Software Diagram',
    icon: 'pi pi-sparkles',
    badge: 'Universal Engine',
    description: 'Automatically analyzes visual topology, boxes, arrows, and labels to synthesize the best UI.',
    placeholderPrompt: 'e.g. Synthesize a production-ready web application based on this software diagram.',
  },
];

export const PRESET_DIAGRAM_BLUEPRINTS = [
  {
    id: 'bp-microservices',
    type: 'architecture',
    title: 'E-Commerce Microservices Architecture',
    summary: 'API Gateway → Order, Payment, Catalog, Notification Services → Kafka & PostgreSQL',
    code: `graph TD
  Client[Web & Mobile Clients] --> Gateway[API Gateway & Auth Proxy]
  Gateway --> OrderSvc[Order Service :8081]
  Gateway --> PaymentSvc[Payment & Stripe Service :8082]
  Gateway --> CatalogSvc[Product Catalog Service :8083]
  OrderSvc --> EventBus[(Kafka Event Bus)]
  EventBus --> NotifySvc[Notification & Email Worker]
  OrderSvc --> OrderDB[(PostgreSQL Primary DB)]
  CatalogSvc --> RedisCache[(Redis In-Memory Cache)]`,
    prompt: 'Create a cloud operations and service monitoring dashboard for this microservices architecture with real-time status metrics and API controls.',
  },
  {
    id: 'bp-dataflow',
    type: 'dataflow',
    title: 'Real-Time Analytics & ETL Pipeline',
    summary: 'IoT Sensors & Webhooks → Ingestion Queue → Spark Stream Engine → TimescaleDB & Analytics',
    code: `graph LR
  A[Sensor Telemetry & Webhooks] -->|JSON Stream| B[Kafka Ingestion Queue]
  B --> C[Spark Streaming Filter & Aggregator]
  C --> D[(TimescaleDB Time-Series Storage)]
  C --> E[Real-Time Alerting Worker]
  D --> F[Live Metric Dashboard & Graph UI]`,
    prompt: 'Build a data pipeline telemetry dashboard displaying live stream throughput, queue lag, error rates, and pipeline restart controls.',
  },
  {
    id: 'bp-auth-seq',
    type: 'sequence',
    title: 'OAuth2 & Multi-Factor Auth Flow',
    summary: 'Client App → Auth Server → MFA Verification → Token Issuance → Protected Resources',
    code: `sequenceDiagram
  autonumber
  User->>ClientApp: Clicks Login
  ClientApp->>AuthServer: GET /oauth/authorize
  AuthServer->>User: Renders Credentials & MFA Prompt
  User->>AuthServer: Submits Password & TOTP Code
  AuthServer->>ClientApp: Returns Auth Code
  ClientApp->>AuthServer: POST /oauth/token (code + secret)
  AuthServer-->>ClientApp: Returns Access Token & Refresh Token
  ClientApp->>ResourceServer: GET /api/user/profile (Bearer Token)
  ResourceServer-->>ClientApp: 200 OK (User Profile Data)`,
    prompt: 'Create an authentication and security management portal displaying active sessions, token inspect tools, and MFA setup options.',
  },
  {
    id: 'bp-usecase-portal',
    type: 'usecase',
    title: 'Healthcare Patient & Doctor Portal',
    summary: 'Patient (Book Appointments, View Records) & Doctor (Review Consultations, Prescribe)',
    code: `graph TD
  Patient((Patient Actor)) --> UC1[Book Telehealth Appointment]
  Patient --> UC2[Access Medical Records & Lab Results]
  Patient --> UC3[Message Care Team]
  Doctor((Doctor Actor)) --> UC4[Review Patient Electronic Health Records]
  Doctor --> UC5[Issue Digital Prescription]
  Doctor --> UC6[Conduct Video Consultation]`,
    prompt: 'Generate an intuitive, accessible patient and doctor healthcare portal with appointment booking, health record lists, and direct doctor communication cards.',
  },
];

const STAGES = [
  { label: 'Reading diagram & visual topology…', icon: 'pi pi-eye' },
  { label: 'Analyzing services, dataflows & entities…', icon: 'pi pi-sitemap' },
  { label: 'Synthesizing UI components & layouts…', icon: 'pi pi-sparkles' },
  { label: 'Running Quality Gate & Self-Healing…', icon: 'pi pi-check-circle' },
  { label: 'Preparing live interactive preview…', icon: 'pi pi-desktop' },
];

const DiagramToUiBuilder = ({ onUiGenerated }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Input states
  const [inputMode, setInputMode] = useState('image'); // 'image' | 'code'
  const [selectedType, setSelectedType] = useState('architecture');
  const [pageName, setPageName] = useState('System Architecture');
  const [customPrompt, setCustomPrompt] = useState('');
  const [diagramCode, setDiagramCode] = useState('');

  // Upload states
  const [diagramFile, setDiagramFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError] = useState(null);

  // Generation states
  const [isBuilding, setIsBuilding] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [generationError, setGenerationError] = useState(null);
  const [successPage, setSuccessPage] = useState(null);

  // ── Handle File Select & Upload ────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file) => {
    setDiagramFile(file);
    setUploadStatus('uploading');
    setUploadError(null);
    try {
      const response = await uploadWireframe(file);
      setUploadedFile(response.file);
      setUploadStatus('success');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload diagram image.');
      setUploadStatus('error');
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setDiagramFile(null);
    setUploadedFile(null);
    setUploadStatus('idle');
    setUploadError(null);
  }, []);

  // ── Load Preset Blueprint ──────────────────────────────────────────────────
  const handleSelectBlueprint = (bp) => {
    setSelectedType(bp.type);
    setPageName(bp.title);
    setDiagramCode(bp.code);
    setCustomPrompt(bp.prompt);
    setInputMode('code');
    setSuccessPage(null);
    setGenerationError(null);
  };

  // ── Build UI from Diagram ──────────────────────────────────────────────────
  const handleBuildUi = async (e) => {
    e?.preventDefault();
    setGenerationError(null);
    setSuccessPage(null);

    const hasImage = uploadStatus === 'success' && uploadedFile;
    const hasCode = diagramCode.trim().length > 0;
    const hasCustomText = customPrompt.trim().length > 0;

    if (!hasImage && !hasCode && !hasCustomText) {
      setGenerationError('Please upload/paste a diagram image, enter diagram code (Mermaid/PlantUML), or select a preset blueprint.');
      return;
    }

    setIsBuilding(true);
    setStageIndex(0);

    // Progress stage timer simulation
    const stageTimers = [1200, 3000, 6000, 2500].map((ms, i) =>
      setTimeout(() => setStageIndex((prev) => Math.min(i + 1, STAGES.length - 1)), ms)
    );

    try {
      const resolvedPageName = pageName.trim() || 'Software Architecture';
      const payload = {
        pageName: resolvedPageName,
        diagramType: selectedType,
        diagramCode: hasCode ? diagramCode.trim() : undefined,
        prompt: customPrompt.trim() || undefined,
      };

      if (hasImage) {
        payload.wireframe = {
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalName,
        };
      }

      const response = await generateUI(payload);

      if (response.success && response.page) {
        const pageData = response.page;
        dispatch(setPage({ pageName: resolvedPageName, data: pageData }));
        dispatch(setActivePage(resolvedPageName));
        setSuccessPage(pageData);
        if (onUiGenerated) onUiGenerated(pageData);
      } else {
        setGenerationError(response.message || 'Failed to generate UI from diagram.');
      }
    } catch (err) {
      setGenerationError(err.message || 'An error occurred while synthesizing the diagram.');
    } finally {
      stageTimers.forEach(clearTimeout);
      setIsBuilding(false);
    }
  };

  const handleOpenPreview = () => {
    const target = successPage?.page || pageName || 'Home';
    navigate(`/preview/${encodeURIComponent(target)}`);
  };

  const currentTypeMeta = DIAGRAM_TYPES.find((t) => t.id === selectedType) || DIAGRAM_TYPES[0];

  return (
    <div className="flex flex-col gap-6 w-full nm-animate-in">

      {/* ── Preset Blueprints Showcase ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--nm-text-muted)] flex items-center gap-1.5">
            <i className="pi pi-bolt text-[var(--nm-accent-light)]" />
            Quick Preset Software Diagram Blueprints
          </h3>
          <span className="text-[11px] text-[var(--nm-text-muted)]">Click any blueprint to instantly load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRESET_DIAGRAM_BLUEPRINTS.map((bp) => (
            <div
              key={bp.id}
              onClick={() => handleSelectBlueprint(bp)}
              className="p-3.5 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] hover:border-[var(--nm-accent)] hover:bg-[var(--nm-bg-surface)] cursor-pointer transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)]">
                  {bp.type.toUpperCase()}
                </span>
                <i className="pi pi-arrow-right text-xs text-[var(--nm-text-muted)] group-hover:text-[var(--nm-accent-light)] group-hover:translate-x-1 transition-all" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--nm-text-primary)] group-hover:text-[var(--nm-accent-light)] transition-colors line-clamp-1 mb-1">
                  {bp.title}
                </h4>
                <p className="text-[11px] text-[var(--nm-text-muted)] leading-relaxed line-clamp-2">
                  {bp.summary}
                </p>
              </div>

              <div className="text-[10px] text-[var(--nm-accent-light)] font-medium flex items-center gap-1">
                <i className="pi pi-file-edit text-[9px]" /> Load Specification
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Diagram Builder Workbench ──────────────────────────────────── */}
      <form onSubmit={handleBuildUi} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Diagram Input (Image / Code) ────────────────────── */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="nm-card p-5 flex flex-col gap-4">
            
            {/* Input Mode Toggle Bar */}
            <div className="flex items-center justify-between border-b border-[var(--nm-border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[var(--nm-accent-glow)] flex items-center justify-center">
                  <i className="pi pi-sitemap text-[var(--nm-accent-light)] text-xs" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--nm-text-primary)]">
                  Provide Software Diagram Pattern
                </h3>
              </div>

              {/* Mode Tabs */}
              <div className="flex gap-1 bg-[var(--nm-bg-surface)] p-1 rounded-lg border border-[var(--nm-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setInputMode('image')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                    inputMode === 'image'
                      ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                      : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
                  }`}
                >
                  <i className="pi pi-image text-[10px]" />
                  Upload / Paste Image (Ctrl+V)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('code')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                    inputMode === 'code'
                      ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                      : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
                  }`}
                >
                  <i className="pi pi-code text-[10px]" />
                  Diagram Code / Text
                </button>
              </div>
            </div>

            {/* Mode 1: Upload / Paste Diagram Image */}
            {inputMode === 'image' && (
              <div className="flex flex-col gap-3">
                <NmUploadArea
                  file={diagramFile}
                  uploadStatus={uploadStatus}
                  uploadError={uploadError}
                  onFileSelect={handleFileSelect}
                  onRemove={handleRemoveFile}
                />

                {uploadStatus === 'success' && uploadedFile && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="pi pi-check-circle text-[var(--nm-success)]" />
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--nm-text-primary)] truncate">
                          {uploadedFile.originalName}
                        </p>
                        <p className="text-[10px] text-[var(--nm-text-muted)]">
                          {(uploadedFile.size / 1024).toFixed(1)} KB · Ready for Multimodal Vision parsing
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-[var(--nm-error)] hover:underline text-xs bg-transparent border-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Paste Diagram Code / Mermaid / PlantUML */}
            {inputMode === 'code' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                    <span>Mermaid, PlantUML, ASCII, or Architecture Spec</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] border border-[var(--nm-border-subtle)]">
                      Code Specification
                    </span>
                  </label>
                  {diagramCode && (
                    <button
                      type="button"
                      onClick={() => setDiagramCode('')}
                      className="text-[10px] text-[var(--nm-text-muted)] hover:text-[var(--nm-error)] bg-transparent border-0 cursor-pointer"
                    >
                      Clear Code
                    </button>
                  )}
                </div>

                <textarea
                  id="diagram-code-input"
                  value={diagramCode}
                  onChange={(e) => setDiagramCode(e.target.value)}
                  disabled={isBuilding}
                  rows={9}
                  placeholder={`Paste Mermaid graph, PlantUML sequence, or architecture flow here:\n\ngraph TD\n  Client[User App] --> Ingress[API Gateway :443]\n  Ingress --> SvcA[Order Microservice]\n  Ingress --> SvcB[Inventory Service]\n  SvcA --> DB[(Postgres Cluster)]`}
                  className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y font-mono leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Diagram Type & Build Actions ─────────────────────── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Configuration Card */}
          <div className="nm-card p-5 flex flex-col gap-4">
            
            {/* Page Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                <i className="pi pi-file text-[var(--nm-accent-light)] text-xs" />
                Target UI Page Name
              </label>
              <input
                id="diagram-page-name"
                type="text"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                disabled={isBuilding}
                placeholder="e.g. System Console, Pipeline Dashboard"
                maxLength={64}
                className="w-full px-3.5 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
              />
            </div>

            {/* Diagram Type Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center justify-between">
                <span>Diagram Architecture Type</span>
                <span className="text-[10px] font-mono text-[var(--nm-accent-light)] font-bold">
                  {currentTypeMeta.badge}
                </span>
              </label>

              <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {DIAGRAM_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      selectedType === t.id
                        ? 'bg-[var(--nm-accent-glow)] border-[var(--nm-accent)] text-white shadow-sm'
                        : 'bg-[var(--nm-bg-surface)] border-[var(--nm-border-subtle)] text-[var(--nm-text-secondary)] hover:text-white hover:border-[var(--nm-border)]'
                    }`}
                  >
                    <i className={`${t.icon} text-xs mt-0.5 ${selectedType === t.id ? 'text-[var(--nm-accent-light)]' : 'opacity-60'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight mb-0.5">{t.label}</p>
                      <p className="text-[10px] text-[var(--nm-text-muted)] leading-tight line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Instructions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                <i className="pi pi-sliders-h text-[var(--nm-accent-light)] text-xs" />
                Custom Design Goals &amp; Instructions
                <span className="text-[10px] text-[var(--nm-text-muted)] font-normal">(Optional)</span>
              </label>
              <textarea
                id="diagram-custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isBuilding}
                rows={3}
                placeholder={currentTypeMeta.placeholderPrompt}
                className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y"
              />
            </div>

            {/* Progress Stage Tracker */}
            {isBuilding && (
              <div className="p-3.5 rounded-lg bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.3)] flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-[var(--nm-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--nm-text-primary)] flex items-center gap-1.5 mb-1 truncate">
                    <i className={`${STAGES[stageIndex]?.icon} text-[var(--nm-accent-light)] text-xs`} />
                    {STAGES[stageIndex]?.label}
                  </p>
                  <div className="w-full bg-[var(--nm-bg-surface)] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--nm-accent)] h-full transition-all duration-500"
                      style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {generationError && (
              <div role="alert" className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[var(--nm-error)] flex items-start gap-2">
                <i className="pi pi-exclamation-triangle mt-0.5 flex-shrink-0" />
                <span>{generationError}</span>
              </div>
            )}

            {/* Success Banner */}
            {successPage && (
              <div className="p-3.5 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="pi pi-check-circle text-[var(--nm-success)] text-base" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--nm-success)] truncate">
                      UI Page Synthesized!
                    </p>
                    <p className="text-[10px] text-[var(--nm-text-muted)]">
                      {successPage.sections?.length || 4} sections generated from diagram
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="px-3 py-1.5 text-xs font-bold rounded bg-[var(--nm-success)] text-white hover:opacity-90 transition-opacity flex items-center gap-1 flex-shrink-0 cursor-pointer border-0"
                >
                  <i className="pi pi-desktop text-[10px]" />
                  Open Preview
                </button>
              </div>
            )}

            {/* Build Action Button */}
            <button
              id="build-diagram-ui-btn"
              type="submit"
              disabled={isBuilding}
              className={`w-full py-3 px-4 rounded-[var(--nm-radius-sm)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-0 ${
                isBuilding
                  ? 'bg-[var(--nm-border)] text-[var(--nm-text-muted)] cursor-not-allowed opacity-70'
                  : 'bg-[var(--nm-accent)] text-white hover:opacity-90 shadow-[0_0_20px_rgba(108,99,255,0.4)]'
              }`}
            >
              {isBuilding ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Software UI…</span>
                </>
              ) : (
                <>
                  <i className="pi pi-bolt" />
                  <span>⚡ Analyze Diagram &amp; Build UI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiagramToUiBuilder;

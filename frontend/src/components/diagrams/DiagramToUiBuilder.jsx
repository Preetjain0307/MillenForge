/**
 * DiagramToUiBuilder — Software Architecture, MVC/MVVM & Flow Diagram Synthesis Workbench
 *
 * Supports:
 *  - System Architecture diagrams (Microservices, Cloud, Layered Architecture)
 *  - MVC Architecture (Model, Controller, View)
 *  - MVVM Architecture (Model, ViewModel, View)
 *  - User / Business Flow diagrams (Step-by-step state machines & journey)
 *  - Live Mermaid SVG rendering with Zoom, Pan, Copy, and SVG Export
 *  - Interactive Connected Nodes graph with node selection & details inspector
 *  - Upload / Paste (Ctrl+V) diagram screenshots with 1-click clipboard paste
 *  - Diagram Code / Text Paste (Mermaid, PlantUML, ASCII, Architecture Specs)
 *  - Direct compile into canonical Redux UIPage with 1-click Live Preview & CMS binding
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadWireframe, generateUI } from '../../services/api';
import { setPage, setActivePage } from '../../features/pages/pagesSlice';
import { patternToUiPage } from '../../types/diagram';
import VisualFlowchartRenderer from './VisualFlowchartRenderer';
import NmUploadArea from '../NmUploadArea';
import NmButton from '../NmButton';

export const DIAGRAM_TYPES = [
  {
    id: 'architecture',
    label: 'System Architecture & Microservices',
    icon: 'pi pi-cloud',
    badge: 'System Console',
    description: 'Cloud topologies, microservice meshes, API gateways, clusters, and load balancers.',
    placeholderPrompt: 'e.g. Build an operations dashboard visualizing microservice health, latency meters, and ingress routers.',
  },
  {
    id: 'mvc',
    label: 'MVC Architecture (Model-View-Controller)',
    icon: 'pi pi-sitemap',
    badge: '3-Tier App',
    description: 'Separation of View portals, Controller API logic & routes, and Database Model records.',
    placeholderPrompt: 'e.g. Create an MVC architecture for a college management system with Student, Faculty, and Admin portals.',
  },
  {
    id: 'mvvm',
    label: 'MVVM Architecture (Model-View-ViewModel)',
    icon: 'pi pi-sync',
    badge: 'Reactive App',
    description: 'Declarative View UI, reactive ViewModel state/actions, and repository Model data.',
    placeholderPrompt: 'e.g. Build a modern reactive MVVM dashboard application with live state streams and repository data.',
  },
  {
    id: 'workflow',
    label: 'User / Business Flow Diagram',
    icon: 'pi pi-arrows-alt',
    badge: 'User Journey',
    description: 'End-to-end user navigation flows, auth checkpoints, and step-by-step state transitions.',
    placeholderPrompt: 'e.g. Generate an end-to-end user flow from login authentication to product checkout and order confirmation.',
  },
  {
    id: 'dataflow',
    label: 'Data Flow Diagram (DFD) & ETL',
    icon: 'pi pi-database',
    badge: 'Pipeline Dashboard',
    description: 'Data ingestion sources, stream processors, queues, transformation stages, and sinks.',
    placeholderPrompt: 'e.g. Build a data pipeline monitor displaying throughput graphs, active Kafka partitions, and batch controls.',
  },
  {
    id: 'usecase',
    label: 'Use Case & Role Portal',
    icon: 'pi pi-users',
    badge: 'Functional Portal',
    description: 'Actor roles, permission boundaries, end-user workflows, and functional interactions.',
    placeholderPrompt: 'e.g. Build the end-user portal satisfying these use cases with step-by-step action wizards and forms.',
  },
  {
    id: 'sequence',
    label: 'System Sequence & API Flow',
    icon: 'pi pi-arrow-right-arrow-left',
    badge: 'Workflow Inspector',
    description: 'Request/response timelines, auth handshakes, webhook lifecycles, and event callbacks.',
    placeholderPrompt: 'e.g. Build an interactive execution viewer with step status indicators, payload cards, and retry triggers.',
  },
  {
    id: 'schema',
    label: 'Entity-Relationship (ERD) / Schema',
    icon: 'pi pi-table',
    badge: 'Data Management UI',
    description: 'Database tables, relational foreign keys, collections, document models, and fields.',
    placeholderPrompt: 'e.g. Build an admin CRUD management interface for exploring and querying these relational entities.',
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
    id: 'bp-mvc-college',
    type: 'mvc',
    title: 'MVC Architecture — College Management System',
    summary: 'Model (Student, Faculty DB) ↔ Controller (Admission, Attendance, Grading) ↔ View (Student Portal & Faculty UI)',
    code: `graph TD
  subgraph ViewLayer["View Layer (UI & Student Portal)"]
    V1["Student Admission & Registration Portal"]
    V2["Faculty Attendance & Grade Entry UI"]
    V3["Admin Department Analytics"]
  end

  subgraph ControllerLayer["Controller Layer (Business Logic)"]
    C1["Admission & Enrollment Controller"]
    C2["Attendance & Course Controller"]
    C3["Examination & Grade Controller"]
  end

  subgraph ModelLayer["Model Layer (Database & Entities)"]
    M1[("Student & Department DB Records")]
    M2[("Course Catalog & Timetable Data")]
    M3[("Academic Grades & Transcripts")]
  end

  V1 -->|Submits Application| C1
  V2 -->|Submits Daily Attendance| C2
  V2 -->|Enters Marks| C3
  C1 -->|Persists Data| M1
  C2 -->|Queries Curriculum| M2
  C3 -->|Updates Transcript| M3
  M1 -.->|Renders Student Profile| V1
  M3 -.->|Renders Grade Report| V2`,
    prompt: 'Create an MVC architecture for a college management system with Student Admission, Faculty Attendance, and Academic Grade modules.',
  },
  {
    id: 'bp-mvvm-reactive',
    type: 'mvvm',
    title: 'MVVM Architecture — Reactive App Architecture',
    summary: 'View (Declarative UI & Widgets) ↔ ViewModel (StateFlow, UI State & Actions) ↔ Model (Repositories & Remote API Data)',
    code: `graph TD
  subgraph View["View (Declarative UI)"]
    V1["User Profile & Dashboard Screen"]
    V2["Interactive Form & Filter Widgets"]
  end

  subgraph ViewModel["ViewModel (Reactive State & Handlers)"]
    VM1["User Session & Auth StateFlow"]
    VM2["Dashboard Metrics State Store"]
    VM3["User Intent & Action Handlers"]
  end

  subgraph Model["Model (Data Layer)"]
    M1["Repository & Offline Room DB"]
    M2["Remote REST & GraphQL Client"]
    M3[("Local Persistent Storage Cache")]
  end

  V1 -->|Dispatches Clicks & Intents| VM3
  V2 -->|Emits Form Input Changes| VM3
  VM3 -->|Executes Business Logic| M1
  M1 -->|Fetches Remote Payloads| M2
  M1 -->|Reads/Writes Cache| M3
  M1 -.->|Emits Data Stream| VM2
  VM2 -.->|Two-Way LiveData Binding| V1`,
    prompt: 'Build a modern reactive MVVM dashboard application with live state streams, repository data integration, and user action handlers.',
  },
  {
    id: 'bp-user-flow',
    type: 'workflow',
    title: 'End-to-End User Flow — Auth to Order',
    summary: 'Login / Register → MFA Auth → Dashboard → Product Selection → Checkout → Payment Gateway → Order Confirmed',
    code: `flowchart TD
  N_Login["1. Login / Register Portal"] -->|"Enters Credentials"| N_Auth{"2. MFA & Password Check"}
  N_Auth -->|"Success"| N_Dash["3. Main Dashboard & Product Catalog"]
  N_Auth -->|"Failed"| N_Retry["Invalid Credentials Alert"]
  N_Retry --> N_Login
  N_Dash -->|"Selects Items"| N_Cart["4. Shopping Cart & Review"]
  N_Cart -->|"Proceeds"| N_Pay{"5. Secure Payment Gateway"}
  N_Pay -->|"Authorized"| N_Done(["6. Order Confirmation & Tracking"])
  N_Pay -->|"Declined"| N_Cart`,
    prompt: 'Generate a complete user flow journey with Login authentication, main catalog dashboard, checkout cart, payment processing, and order confirmation.',
  },
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

/**
 * Parses Mermaid / Architecture text into a structured Flowchart object
 */
export const parseMermaidToFlowchart = (code, title = 'Software Diagram') => {
  if (!code || typeof code !== 'string') {
    return { title, nodes: [], edges: [] };
  }

  const nodesMap = new Map();
  const edges = [];
  const lines = code.split('\n');

  lines.forEach((rawLine, lIdx) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('graph') || line.startsWith('flowchart') || line.startsWith('subgraph') || line.startsWith('end') || line.startsWith('%%') || line.startsWith('sequenceDiagram') || line.startsWith('autonumber')) {
      return;
    }

    // Sequence diagram parsing: User->>ClientApp: Clicks Login
    if (line.includes('->>') || line.includes('-->>')) {
      const parts = line.split(/(?:->>|-->>|->)/);
      if (parts.length >= 2) {
        const src = parts[0].trim();
        const rest = parts[1].trim();
        const colonIdx = rest.indexOf(':');
        const tgt = colonIdx !== -1 ? rest.substring(0, colonIdx).trim() : rest;
        const msg = colonIdx !== -1 ? rest.substring(colonIdx + 1).trim() : '';

        if (src && !nodesMap.has(src)) {
          nodesMap.set(src, { id: src, label: src, type: 'service', icon: 'pi pi-server', description: `Participant: ${src}` });
        }
        if (tgt && !nodesMap.has(tgt)) {
          nodesMap.set(tgt, { id: tgt, label: tgt, type: 'service', icon: 'pi pi-server', description: `Participant: ${tgt}` });
        }
        if (src && tgt) {
          edges.push({
            id: `seq_${lIdx}_${src}_${tgt}`,
            source: src,
            target: tgt,
            label: msg || 'transfers',
          });
        }
      }
      return;
    }

    // Edge connection: A --> B or A -->|label| B or A -.-> B or A ==> B
    const edgeMatch = line.match(/([a-zA-Z0-9_-]+)(?:\[.*?\]|\(.*?\)|\{.*?\}|\(\(.*?\)\))?\s*(?:-+>|-\.->|-\.\.+->|\.-+>|==>)(?:\|(.*?)\|)?\s*([a-zA-Z0-9_-]+)(?:\[.*?\]|\(.*?\)|\{.*?\}|\(\(.*?\)\))?/);
    if (edgeMatch) {
      const srcId = edgeMatch[1];
      const edgeLabel = edgeMatch[2] || '';
      const tgtId = edgeMatch[3];

      if (srcId && !nodesMap.has(srcId)) {
        nodesMap.set(srcId, { id: srcId, label: srcId, type: 'step', description: `Component: ${srcId}` });
      }
      if (tgtId && !nodesMap.has(tgtId)) {
        nodesMap.set(tgtId, { id: tgtId, label: tgtId, type: 'step', description: `Component: ${tgtId}` });
      }

      if (srcId && tgtId) {
        edges.push({
          id: `e_${lIdx}_${srcId}_${tgtId}`,
          source: srcId,
          target: tgtId,
          label: edgeLabel.replace(/["']/g, '').trim() || 'connects to',
        });
      }
    }

    // Node definitions: NodeId["Label"] or NodeId[Label] or NodeId[("Label")] or NodeId(("Label"))
    const nodeMatches = line.matchAll(/([a-zA-Z0-9_-]+)(?:\[\(|\(\[|\(\(|\[|\(|\{)(["']?)(.*?)\2(?:\]\)|\)\]|\)\)|\]|\)|\})/g);
    for (const match of nodeMatches) {
      const id = match[1];
      const label = match[3].replace(/["']/g, '').trim();
      let type = 'step';
      let icon = 'pi pi-box';

      if (shapeOpen === '{') {
        type = 'decision';
        icon = 'pi pi-question-circle';
      } else if (shapeOpen === '((') {
        type = 'actor';
        icon = 'pi pi-user';
      } else if (label.toLowerCase().includes('database') || label.toLowerCase().includes('db') || label.toLowerCase().includes('cache') || shapeOpen === '[(') {
        type = 'database';
        icon = 'pi pi-database';
      } else if (label.toLowerCase().includes('controller') || label.toLowerCase().includes('api') || label.toLowerCase().includes('gateway') || label.toLowerCase().includes('service')) {
        type = 'service';
        icon = 'pi pi-server';
      } else if (label.toLowerCase().includes('view') || label.toLowerCase().includes('ui') || label.toLowerCase().includes('portal') || label.toLowerCase().includes('screen')) {
        type = 'view';
        icon = 'pi pi-desktop';
      }

      nodesMap.set(id, {
        id,
        label: label || id,
        type,
        icon,
        description: `Architecture Component: ${label || id}`,
      });
    }
  });

  return {
    title,
    nodes: Array.from(nodesMap.values()),
    edges,
  };
};

const DiagramToUiBuilder = ({ onUiGenerated }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Input states
  const [inputMode, setInputMode] = useState('code'); // 'image' | 'code' | 'visual'
  const [selectedType, setSelectedType] = useState('mvc');
  const [pageName, setPageName] = useState('College Management MVC');
  const [customPrompt, setCustomPrompt] = useState('Create an MVC architecture for a college management system with Student Admission, Faculty Attendance, and Academic Grade modules.');
  const [diagramCode, setDiagramCode] = useState(PRESET_DIAGRAM_BLUEPRINTS[0].code);

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
  const [selectedNode, setSelectedNode] = useState(null);

  // Parsed flowchart structure
  const parsedFlowchart = useMemo(() => {
    return parseMermaidToFlowchart(diagramCode, pageName || 'Architecture Diagram');
  }, [diagramCode, pageName]);

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
    setSelectedNode(null);
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
    const stageTimers = [1000, 2400, 4800, 2000].map((ms, i) =>
      setTimeout(() => setStageIndex((prev) => Math.min(i + 1, STAGES.length - 1)), ms)
    );

    const resolvedPageName = pageName.trim() || 'System Architecture';

    try {
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

      if (response && response.success && response.page) {
        const pageData = response.page;
        dispatch(setPage({ pageName: resolvedPageName, data: pageData }));
        dispatch(setActivePage(resolvedPageName));
        setSuccessPage(pageData);
        if (onUiGenerated) onUiGenerated(pageData);
      } else {
        throw new Error(response?.message || 'AI synthesis fallback triggered');
      }
    } catch (err) {
      console.warn('[DiagramToUiBuilder] AI synthesis fallback triggered:', err.message);
      // Synthesize structured page from parsed diagram pattern as robust offline fallback
      const parsedFlow = parseMermaidToFlowchart(diagramCode, resolvedPageName);
      const fallbackPage = patternToUiPage(
        {
          name: resolvedPageName,
          nodes: parsedFlow.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type || 'section' })),
          edges: parsedFlow.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
        },
        resolvedPageName
      );

      dispatch(setPage({ pageName: resolvedPageName, data: fallbackPage }));
      dispatch(setActivePage(resolvedPageName));
      setSuccessPage(fallbackPage);
      if (onUiGenerated) onUiGenerated(fallbackPage);
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
            Quick Preset Software Diagram Blueprints (MVC, MVVM, Microservices, User Flow)
          </h3>
          <span className="text-[11px] text-[var(--nm-text-muted)]">Click any blueprint to instantly load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {PRESET_DIAGRAM_BLUEPRINTS.map((bp) => (
            <div
              key={bp.id}
              onClick={() => handleSelectBlueprint(bp)}
              className="p-3.5 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] hover:border-[var(--nm-accent)] hover:bg-[var(--nm-bg-surface)] cursor-pointer transition-all flex flex-col justify-between gap-3 group relative overflow-hidden shadow-sm"
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
      <form onSubmit={handleBuildUi} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Diagram Input (Image / Code / Live Canvas) ──────── */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="nm-card p-5 flex flex-col gap-4">
            {/* Input Mode Toggle Bar */}
            <div className="flex items-center justify-between border-b border-[var(--nm-border-subtle)] pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[var(--nm-accent-glow)] flex items-center justify-center">
                  <i className="pi pi-sitemap text-[var(--nm-accent-light)] text-xs" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--nm-text-primary)]">
                  Software Diagram Specification &amp; Canvas
                </h3>
              </div>

              {/* Mode Tabs */}
              <div className="flex gap-1 bg-[var(--nm-bg-surface)] p-1 rounded-lg border border-[var(--nm-border-subtle)]">
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
                  Mermaid / Code
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('visual')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                    inputMode === 'visual'
                      ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                      : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
                  }`}
                >
                  <i className="pi pi-compass text-[10px]" />
                  Live Diagram Canvas
                </button>
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
                  Upload Image
                </button>
              </div>
            </div>

            {/* Mode 1: Paste Diagram Code / Mermaid / PlantUML */}
            {inputMode === 'code' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                    <span>Mermaid, PlantUML, ASCII, or Architecture Spec</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--nm-bg-surface)] text-[var(--nm-text-muted)] border border-[var(--nm-border-subtle)]">
                      {parsedFlowchart.nodes.length} Nodes Detected
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard && navigator.clipboard.readText) {
                            const text = await navigator.clipboard.readText();
                            if (text) setDiagramCode(text);
                          }
                        } catch (err) {
                          console.warn('Clipboard read error:', err);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[var(--nm-accent)] text-white text-[11px] font-semibold hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer border-0 shadow-sm"
                      title="Paste Mermaid or text from clipboard"
                    >
                      <i className="pi pi-clipboard text-[10px]" />
                      <span>Paste Code</span>
                    </button>
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
                </div>

                <textarea
                  id="diagram-code-input"
                  value={diagramCode}
                  onChange={(e) => setDiagramCode(e.target.value)}
                  disabled={isBuilding}
                  rows={10}
                  placeholder={`Paste Mermaid graph, PlantUML sequence, or architecture flow here:\n\ngraph TD\n  Client[User App] --> Ingress[API Gateway :443]\n  Ingress --> SvcA[Order Microservice]\n  Ingress --> SvcB[Inventory Service]\n  SvcA --> DB[(Postgres Cluster)]`}
                  className="w-full px-3.5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y font-mono leading-relaxed"
                />
              </div>
            )}

            {/* Mode 2: Live Visual Diagram Canvas */}
            {inputMode === 'visual' && (
              <div className="flex flex-col gap-3">
                <VisualFlowchartRenderer
                  flowchart={parsedFlowchart}
                  onSelectNode={(node) => setSelectedNode(node)}
                  selectedNodeId={selectedNode?.id}
                />

                {/* Node Details Inspector */}
                {selectedNode && (
                  <div className="p-3.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-accent)]/50 flex flex-col gap-1.5 nm-animate-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--nm-accent-light)] flex items-center gap-1.5">
                        <i className="pi pi-info-circle text-xs" />
                        Node Inspector: {selectedNode.label}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)]">
                        ID: {selectedNode.id}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--nm-text-secondary)]">
                      {selectedNode.description || 'Architecture Component Entity'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Upload / Paste Diagram Image */}
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
                placeholder="e.g. College Management MVC, System Console"
                maxLength={64}
                className="w-full px-3.5 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all"
              />
            </div>

            {/* Diagram Type Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center justify-between">
                <span>Diagram Architecture Pattern</span>
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
              <div className="p-3.5 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] flex items-center justify-between gap-3 nm-animate-in">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="pi pi-check-circle text-[var(--nm-success)] text-base" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--nm-success)] truncate">
                      UI Page Synthesized!
                    </p>
                    <p className="text-[10px] text-[var(--nm-text-muted)]">
                      {successPage.sections?.length || 4} sections ready for Live Preview &amp; CMS
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="px-3 py-1.5 text-xs font-bold rounded bg-[var(--nm-success)] text-white hover:opacity-90 transition-opacity flex items-center gap-1 flex-shrink-0 cursor-pointer border-0 shadow-md"
                >
                  <i className="pi pi-desktop text-[10px]" />
                  Open Preview
                </button>
              </div>
            )}

            {/* Submit Button */}
            <NmButton
              id="synthesize-ui-btn"
              type="submit"
              variant="primary"
              label={isBuilding ? 'Synthesizing Architecture…' : 'Synthesize Live UI from Diagram'}
              icon={isBuilding ? undefined : 'pi pi-bolt'}
              disabled={isBuilding}
              className="w-full justify-center shadow-lg"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default DiagramToUiBuilder;

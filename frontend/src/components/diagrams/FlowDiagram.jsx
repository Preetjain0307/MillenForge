/**
 * FlowDiagram — AI-Powered UI Photo & Design to Flowchart Diagram Workbench
 *
 * Supports:
 *  - Upload or Paste (Ctrl+V) any UI photo, screenshot, form mockup, or system design (Student Admission, Library, Hospital, Banking, Hotel, E-Commerce, etc.)
 *  - 1-Click Blueprints for Instant Flowcharts across multiple industry domains
 *  - Granular AI Vision workflow extraction: Login/Register, Detail Ingestion, Photo/Document Uploads, Selection Steps, Decision Gates, Actions & Confirmation
 *  - Live Visual SVG Flowchart Canvas with zoom/pan & SVG export
 *  - Step-by-step sequential user journey timeline
 *  - Standard Mermaid flowchart code viewer & 1-click copy
 */

import React, { useState, useCallback, useEffect } from 'react';
import { uploadWireframe, generateUiToFlow } from '../../services/api';
import { uiPageToFlowDiagram } from '../../types/diagram.js';
import NmUploadArea from '../NmUploadArea';
import VisualFlowchartRenderer from './VisualFlowchartRenderer';

export const WORKFLOW_PRESET_BLUEPRINTS = [
  {
    id: 'bp-student-admission',
    title: 'Student Admission & Enrollment Workflow',
    category: 'Education Portal',
    icon: 'pi pi-id-card',
    badge: 'Student Admission',
    summary: 'Applicant Login ➔ Enter Student Details ➔ Upload Passport Photo & Docs ➔ Course Selection ➔ Eligibility Check ➔ Fee Payment ➔ Application Reference Issued',
    flowchart: {
      title: 'Student Admission & Enrollment Application Flowchart',
      summary: 'End-to-end multi-step workflow detailing applicant registration, personal details entry, passport photo and document uploads, program selection, eligibility screening, fee transaction, and final application submission.',
      nodes: [
        {
          id: 'node-auth',
          label: '1. Applicant Login & Registration',
          type: 'screen',
          description: 'New student registers with email & phone, or logs into applicant portal.',
          icon: 'pi pi-user',
          step: 1,
        },
        {
          id: 'node-details',
          label: '2. Enter Student & Personal Details',
          type: 'section',
          description: 'Enter student full name, DOB, guardian information, address, and contact details.',
          icon: 'pi pi-id-card',
          step: 2,
        },
        {
          id: 'node-upload-photo',
          label: '3. Upload Passport Photo & Documents',
          type: 'action',
          description: 'Upload digital passport-sized photo, birth certificate, ID proof, and previous academic marksheets.',
          icon: 'pi pi-camera',
          step: 3,
        },
        {
          id: 'node-course-select',
          label: '4. Select Course & Academic Program',
          type: 'section',
          description: 'Select desired department, major/course curriculum, semester, and scholarship preferences.',
          icon: 'pi pi-bookmark',
          step: 4,
        },
        {
          id: 'node-eligibility',
          label: '5. Automated Eligibility & Prerequisite Check',
          type: 'decision',
          description: 'Automated verification check against minimum entry requirements and document completeness.',
          icon: 'pi pi-verified',
          step: 5,
        },
        {
          id: 'node-fee-payment',
          label: '6. Application Processing Fee Payment',
          type: 'action',
          description: 'Secure payment gateway processing for admission examination and application fee.',
          icon: 'pi pi-credit-card',
          step: 6,
        },
        {
          id: 'node-confirmation',
          label: '7. Application Submitted & Reference Issued',
          type: 'outcome',
          description: 'Student Application Number generated, confirmation PDF downloaded, and tracking portal enabled.',
          icon: 'pi pi-check-circle',
          step: 7,
        },
      ],
      edges: [
        { id: 'e1', source: 'node-auth', target: 'node-details', label: 'Authenticates & Accesses Form' },
        { id: 'e2', source: 'node-details', target: 'node-upload-photo', label: 'Saves Details & Proceeds' },
        { id: 'e3', source: 'node-upload-photo', target: 'node-course-select', label: 'Uploads Passport Photo & Docs' },
        { id: 'e4', source: 'node-course-select', target: 'node-eligibility', label: 'Submits Program Selection' },
        { id: 'e5', source: 'node-eligibility', target: 'node-fee-payment', label: 'Eligibility Verified (Yes)' },
        { id: 'e6', source: 'node-fee-payment', target: 'node-confirmation', label: 'Payment Successful' },
      ],
      mermaid: `flowchart TD
  A["1. Applicant Login & Registration"] -->|"Authenticates"| B["2. Enter Student Personal Details"]
  B -->|"Saves Profile"| C["3. Upload Passport Photo & Documents"]
  C -->|"Files Attached"| D["4. Select Course & Program"]
  D -->|"Submits Choice"| E{"5. Eligibility Verification"}
  E -->|"Eligible (Yes)"| F["6. Pay Application Processing Fee"]
  E -->|"Incomplete (No)"| G["Request Document Re-upload"]
  F -->|"Payment Confirmed"| H(["7. Application Number Issued & Dashboard Enabled"])`,
      insights: [
        'Primary Admission Path: Login -> Details -> Passport Photo -> Program -> Eligibility Check -> Fee -> Confirmation Number',
        'Automated checkpoint ensures passport photo and prerequisite documents are uploaded before fee checkout.',
      ],
    },
  },
  {
    id: 'bp-library-system',
    title: 'Library Management & Book Circulation',
    category: 'Library & Education',
    icon: 'pi pi-book',
    badge: 'Library System',
    summary: 'Member Login ➔ Search Catalog ➔ Check Shelf Availability ➔ Scan Barcode / RFID ➔ Due Date Stamp ➔ Slip Issued',
    flowchart: {
      title: 'Library Management & Book Circulation Flowchart',
      summary: 'Complete member journey covering catalog search, book reservation, barcode checkout verification, due date scheduling, and return fine reconciliation.',
      nodes: [
        { id: 'lib-auth', label: '1. Member Login / Scan Card', type: 'screen', description: 'Member authenticates with Library Card ID or scans digital barcode badge.', icon: 'pi pi-id-card', step: 1 },
        { id: 'lib-search', label: '2. Search Book Catalog & Shelf Location', type: 'section', description: 'Searches catalog by Title, Author, ISBN, or Subject taxonomy.', icon: 'pi pi-search', step: 2 },
        { id: 'lib-availability', label: '3. Availability & Hold Reservation', type: 'decision', description: 'Checks shelf status (Available on Rack vs. Checked Out). Places hold if reserved.', icon: 'pi pi-bookmark', step: 3 },
        { id: 'lib-issue', label: '4. Book Checkout & Barcode Scan', type: 'action', description: 'RFID / Barcode scan of selected books to bind against member account.', icon: 'pi pi-qrcode', step: 4 },
        { id: 'lib-due-date', label: '5. Due Date & Loan Stamp Issued', type: 'section', description: 'Calculates 14-day borrowing period and sets SMS/Email return reminder schedule.', icon: 'pi pi-calendar', step: 5 },
        { id: 'lib-receipt', label: '6. Circulation Receipt & Active Loans', type: 'outcome', description: 'Issues digital borrowing slip, updates member dashboard, and triggers security gate deactivation.', icon: 'pi pi-check-circle', step: 6 },
      ],
      edges: [
        { id: 'le1', source: 'lib-auth', target: 'lib-search', label: 'Logs In & Opens Catalog' },
        { id: 'le2', source: 'lib-search', target: 'lib-availability', label: 'Selects Book Title' },
        { id: 'le3', source: 'lib-availability', target: 'lib-issue', label: 'In Stock (Available)' },
        { id: 'le4', source: 'lib-issue', target: 'lib-due-date', label: 'Scans Book Barcode' },
        { id: 'le5', source: 'lib-due-date', target: 'lib-receipt', label: 'Loan Confirmed' },
      ],
      mermaid: `flowchart TD
  A["1. Member Login / Scan Card"] -->|"Accesses Catalog"| B["2. Search Book & Shelf Location"]
  B -->|"Selects Title"| C{"3. Availability Check"}
  C -->|"Available on Shelf"| D["4. Scan RFID / Barcode"]
  C -->|"Currently Checked Out"| E["Place Hold / Waitlist Queue"]
  D -->|"Binds to Member"| F["5. Set Due Date & Return Reminders"]
  F -->|"Loan Activated"| G(["6. Circulation Slip Issued & RFID Tag Updated"])`,
      insights: [
        'Library Flow: Barcode check immediately updates stock circulation index.',
        'Hold queuing automatically notifies next student in reservation line.',
      ],
    },
  },
  {
    id: 'bp-hospital-clinic',
    title: 'Hospital Patient Intake & Clinical Care',
    category: 'Healthcare',
    icon: 'pi pi-heart',
    badge: 'Hospital / Clinic',
    summary: 'Patient Registration (UHID) ➔ Select Specialty ➔ Upload Medical Reports ➔ Doctor Consultation ➔ Lab Orders ➔ E-Prescription',
    flowchart: {
      title: 'Hospital Patient Intake & Clinical Care Flowchart',
      summary: 'Clinical workflow guiding patient registration, doctor appointment booking, diagnostic report uploads, clinical consultation, lab orders, and pharmacy discharge.',
      nodes: [
        { id: 'hosp-reg', label: '1. Patient Registration / UHID Login', type: 'screen', description: 'Patient creates unique Health ID (UHID) or logs in with mobile OTP.', icon: 'pi pi-user-plus', step: 1 },
        { id: 'hosp-dept', label: '2. Select Specialty & Doctor Slot', type: 'section', description: 'Chooses clinical department (Cardiology, Pediatrics, General) and consult time.', icon: 'pi pi-calendar-plus', step: 2 },
        { id: 'hosp-upload', label: '3. Upload Past Reports & Medical History', type: 'action', description: 'Attaches blood work PDFs, MRI/X-Ray scans, allergies, and current medications.', icon: 'pi pi-file-pdf', step: 3 },
        { id: 'hosp-consult', label: '4. Doctor Consultation (OPD / Video)', type: 'section', description: 'Clinical examination, vitals review, diagnostic evaluation, and note taking.', icon: 'pi pi-heart', step: 4 },
        { id: 'hosp-decision', label: '5. Diagnostic Lab Order / Prescription Check', type: 'decision', description: 'Doctor orders blood/imaging tests OR issues direct pharmacy e-prescription.', icon: 'pi pi-verified', step: 5 },
        { id: 'hosp-discharge', label: '6. E-Prescription & Follow-up Scheduled', type: 'outcome', description: 'Dispatches medication delivery, generates clinical summary, and sets follow-up alert.', icon: 'pi pi-check-circle', step: 6 },
      ],
      edges: [
        { id: 'he1', source: 'hosp-reg', target: 'hosp-dept', label: 'Registers UHID' },
        { id: 'he2', source: 'hosp-dept', target: 'hosp-upload', label: 'Selects Time Slot' },
        { id: 'he3', source: 'hosp-upload', target: 'hosp-consult', label: 'Attaches Lab History' },
        { id: 'he4', source: 'hosp-consult', target: 'hosp-decision', label: 'Doctor Diagnosis' },
        { id: 'he5', source: 'hosp-decision', target: 'hosp-discharge', label: 'Prescription Finalized' },
      ],
      mermaid: `flowchart TD
  A["1. Patient Registration / UHID"] -->|"Books Slot"| B["2. Select Specialty & Doctor"]
  B -->|"Pre-consult"| C["3. Upload Past Reports & Scans"]
  C -->|"Doctor Joins"| D["4. Clinical Consultation"]
  D -->|"Doctor Examines"| E{"5. Lab Tests or Meds?"}
  E -->|"Tests Required"| F["Order Lab Diagnostics & Sample Collection"]
  E -->|"Meds Only"| G["6. E-Prescription Issued"]
  F --> G
  G -->|"Complete"| H(["Discharge Summary & Follow-up Set"])`,
      insights: [
        'Clinical Pathway: Prior report upload ensures physician has full diagnostic context before entering consult room.',
      ],
    },
  },
  {
    id: 'bp-banking-loan',
    title: 'Banking Loan Application & KYC',
    category: 'Finance & Banking',
    icon: 'pi pi-lock',
    badge: 'Banking / KYC',
    summary: 'Customer Authentication ➔ Loan Amount ➔ Upload Salary Slips & Bank Statements ➔ Credit Score Verification ➔ E-Sign ➔ Fund Disbursement',
    flowchart: {
      title: 'Banking Loan Application & KYC Verification Flowchart',
      summary: 'Financial customer journey covering credit request, personal income inputs, salary slip uploads, automated bureau score check, and fund disbursement.',
      nodes: [
        { id: 'b1', label: '1. Customer Authentication & OTP', type: 'screen', description: 'Customer logs into banking portal with NetBanking / OTP.', icon: 'pi pi-lock', step: 1 },
        { id: 'b2', label: '2. Loan Type & Amount Selection', type: 'section', description: 'Selects Personal/Home Loan amount and repayment tenure.', icon: 'pi pi-dollar', step: 2 },
        { id: 'b3', label: '3. Income Details & Salary Slip Upload', type: 'action', description: 'Enters employer info and uploads 3 months bank statements & salary slips.', icon: 'pi pi-upload', step: 3 },
        { id: 'b4', label: '4. Credit Score & KYC Verification Check', type: 'decision', description: 'Automated credit bureau score pull and government ID verification.', icon: 'pi pi-shield', step: 4 },
        { id: 'b5', label: '5. Digital Agreement & E-Sign', type: 'action', description: 'Customer reviews loan sanction terms and signs electronically.', icon: 'pi pi-pencil', step: 5 },
        { id: 'b6', label: '6. Loan Disbursed to Bank Account', type: 'outcome', description: 'Funds credited immediately with EMI repayment calendar enabled.', icon: 'pi pi-check-circle', step: 6 },
      ],
      edges: [
        { id: 'be1', source: 'b1', target: 'b2', label: 'Logs In' },
        { id: 'be2', source: 'b2', target: 'b3', label: 'Chooses Loan Terms' },
        { id: 'be3', source: 'b3', target: 'b4', label: 'Uploads Statements' },
        { id: 'be4', source: 'b4', target: 'b5', label: 'Credit Approved' },
        { id: 'be5', source: 'b5', target: 'b6', label: 'E-Signs Agreement' },
      ],
      mermaid: `flowchart TD
  A["1. Customer Login & OTP"] -->|"Selects Amount"| B["2. Loan & Tenure Selection"]
  B -->|"Income Profile"| C["3. Upload Salary Slips & Bank Statements"]
  C -->|"Bureau Pull"| D{"4. Credit Score & KYC Check"}
  D -->|"Score > 750"| E["5. Digital Agreement & E-Sign"]
  D -->|"Score < 650"| F["Guarantor Request"]
  E -->|"Terms Signed"| G(["6. Funds Disbursed to Account"])`,
      insights: [
        'Fintech Flow: Automated bank statement analysis allows instant credit decisioning.',
      ],
    },
  },
  {
    id: 'bp-hotel-booking',
    title: 'Hotel & Travel Reservation System',
    category: 'Travel & Hospitality',
    icon: 'pi pi-compass',
    badge: 'Hotel / Travel',
    summary: 'Search Destination ➔ Select Room & Amenities ➔ Upload Guest ID ➔ Payment Transaction ➔ Booking Voucher QR & Mobile Key',
    flowchart: {
      title: 'Hotel & Travel Reservation Workflow Flowchart',
      summary: 'Hospitality guest journey covering destination search, room selection, guest ID proof uploads, payment confirmation, and digital keycard generation.',
      nodes: [
        { id: 't1', label: '1. Search Dates & Destination', type: 'screen', description: 'Enters city, check-in/out dates, and number of guests.', icon: 'pi pi-compass', step: 1 },
        { id: 't2', label: '2. Select Room Category & Amenities', type: 'section', description: 'Chooses Suite, Deluxe, or Executive room with breakfast options.', icon: 'pi pi-home', step: 2 },
        { id: 't3', label: '3. Enter Guest Details & Upload ID', type: 'action', description: 'Enters primary guest details and attaches passport / government ID scan.', icon: 'pi pi-id-card', step: 3 },
        { id: 't4', label: '4. Payment & Deposit Transaction', type: 'action', description: 'Processes secure credit card deposit with free cancellation terms.', icon: 'pi pi-credit-card', step: 4 },
        { id: 't5', label: '5. Instant Booking Voucher & Digital Key', type: 'outcome', description: 'Generates reservation voucher QR code and mobile check-in pass.', icon: 'pi pi-check-circle', step: 5 },
      ],
      edges: [
        { id: 'te1', source: 't1', target: 't2', label: 'Searches Availability' },
        { id: 'te2', source: 't2', target: 't3', label: 'Selects Room' },
        { id: 'te3', source: 't3', target: 't4', label: 'Attaches Guest ID' },
        { id: 'te4', source: 't4', target: 't5', label: 'Completes Payment' },
      ],
      mermaid: `flowchart TD
  A["1. Search Dates & Location"] -->|"Finds Rooms"| B["2. Select Room & Amenities"]
  B -->|"Guest Profile"| C["3. Enter Details & Upload Guest ID"]
  C -->|"Secure Checkout"| D["4. Payment & Deposit"]
  D -->|"Confirmed"| E(["5. Booking Voucher QR & Mobile Key Generated"])`,
      insights: [
        'Travel Flow: Guest ID upload ahead of arrival enables seamless contactless check-in.',
      ],
    },
  },
  {
    id: 'bp-ecommerce-checkout',
    title: 'E-Commerce Multi-Step Checkout',
    category: 'Retail & Commerce',
    icon: 'pi pi-shopping-bag',
    badge: 'E-Commerce',
    summary: 'View Cart ➔ Shipping Address ➔ Courier Choice ➔ Card/UPI Payment ➔ Order Tracking',
    flowchart: {
      title: 'E-Commerce Multi-Step Checkout Flowchart',
      summary: 'Sequential checkout pipeline guiding user from cart inspection through delivery address, courier selection, payment authorization, and order confirmation.',
      nodes: [
        { id: 'c1', label: '1. Shopping Cart Review', type: 'screen', description: 'User reviews items, quantities, coupons, and subtotal.', icon: 'pi pi-shopping-cart', step: 1 },
        { id: 'c2', label: '2. Shipping & Delivery Address', type: 'section', description: 'Enters recipient name, shipping address, and phone number.', icon: 'pi pi-map-marker', step: 2 },
        { id: 'c3', label: '3. Courier & Delivery Method', type: 'section', description: 'Selects Standard (3-5 days) or Express Overnight delivery.', icon: 'pi pi-truck', step: 3 },
        { id: 'c4', label: '4. Payment Gateway Authorization', type: 'action', description: 'Processes Credit Card, PayPal, Apple Pay, or UPI transaction.', icon: 'pi pi-credit-card', step: 4 },
        { id: 'c5', label: '5. Order Placed & Tracking Link', type: 'outcome', description: 'Generates Order ID, sends invoice email, and enables live tracking.', icon: 'pi pi-check-circle', step: 5 },
      ],
      edges: [
        { id: 'ce1', source: 'c1', target: 'c2', label: 'Clicks Proceed to Checkout' },
        { id: 'ce2', source: 'c2', target: 'c3', label: 'Saves Delivery Address' },
        { id: 'ce3', source: 'c3', target: 'c4', label: 'Selects Shipping Method' },
        { id: 'ce4', source: 'c4', target: 'c5', label: 'Payment Succeeded' },
      ],
      mermaid: `flowchart TD
  A[1. Shopping Cart Review] -->|Clicks Checkout| B[2. Shipping Address]
  B -->|Saves Address| C[3. Courier Selection]
  C -->|Selects Method| D[4. Payment Gateway]
  D -->|Payment Approved| E((5. Order Placed & Tracking Link))`,
      insights: [
        'Conversion Step: Minimal address friction reduces drop-off before payment stage.',
      ],
    },
  },
];

const FLOW_STAGES = [
  { label: 'Uploading UI screenshot / photo…', icon: 'pi pi-upload' },
  { label: 'Vision analyzing UI screens, forms & buttons…', icon: 'pi pi-eye' },
  { label: 'Extracting sequential application workflow…', icon: 'pi pi-bolt' },
  { label: 'Mapping login, detail inputs, photo uploads & decision gates…', icon: 'pi pi-sitemap' },
  { label: 'Rendering visual SVG flowchart…', icon: 'pi pi-check-circle' },
];

const NODE_TYPE_CONFIG = {
  screen: {
    label: 'Screen Viewport',
    icon: 'pi pi-desktop',
    bg: 'bg-[rgba(108,99,255,0.15)]',
    border: 'border-[var(--nm-accent)]',
    text: 'text-[var(--nm-accent-light)]',
    badge: 'SCREEN',
  },
  section: {
    label: 'Form / Section',
    icon: 'pi pi-id-card',
    bg: 'bg-[rgba(59,130,246,0.12)]',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    badge: 'FORM',
  },
  action: {
    label: 'Upload / Action',
    icon: 'pi pi-camera',
    bg: 'bg-[rgba(34,197,94,0.12)]',
    border: 'border-[var(--nm-success)]',
    text: 'text-[var(--nm-success)]',
    badge: 'ACTION',
  },
  decision: {
    label: 'Decision / Check',
    icon: 'pi pi-question-circle',
    bg: 'bg-[rgba(234,179,8,0.12)]',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badge: 'DECISION',
  },
  modal: {
    label: 'Modal / Overlay',
    icon: 'pi pi-window-maximize',
    bg: 'bg-[rgba(236,72,153,0.12)]',
    border: 'border-pink-500/40',
    text: 'text-pink-400',
    badge: 'MODAL',
  },
  outcome: {
    label: 'Confirmation / Goal',
    icon: 'pi pi-check-circle',
    bg: 'bg-[rgba(16,185,129,0.15)]',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    badge: 'GOAL',
  },
};

const FlowDiagram = ({ uiPage }) => {
  // Input states
  const [sourceMode, setSourceMode] = useState('image'); // 'image' | 'current_page'
  const [customPrompt, setCustomPrompt] = useState('');

  // Upload states
  const [uiFile, setUiFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError] = useState(null);

  // Extraction & Flowchart state
  const [isExtracting, setIsExtracting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [extractError, setExtractError] = useState(null);
  
  // Default to Student Admission flowchart on initial load
  const [flowchart, setFlowchart] = useState(WORKFLOW_PRESET_BLUEPRINTS[0].flowchart);
  const [selectedNode, setSelectedNode] = useState(WORKFLOW_PRESET_BLUEPRINTS[0].flowchart.nodes[0]);
  const [activeViewTab, setActiveViewTab] = useState('canvas'); // 'canvas' | 'timeline' | 'mermaid'
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  // ── Load Preset Blueprint ──────────────────────────────────────────────────
  const handleSelectBlueprint = (bp) => {
    setFlowchart(bp.flowchart);
    setSelectedNode(bp.flowchart.nodes[0]);
    setExtractError(null);
    setActiveViewTab('canvas');
  };

  // ── Handle File Select & Upload ────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file) => {
    setUiFile(file);
    setUploadStatus('uploading');
    setUploadError(null);
    setExtractError(null);
    try {
      const response = await uploadWireframe(file);
      setUploadedFile(response.file);
      setUploadStatus('success');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload UI photo.');
      setUploadStatus('error');
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setUiFile(null);
    setUploadedFile(null);
    setUploadStatus('idle');
    setUploadError(null);
  }, []);

  // ── Run AI UI-to-Flowchart Extraction ──────────────────────────────────────
  const handleExtractFlow = async (e) => {
    e?.preventDefault();
    setExtractError(null);

    const hasImage = uploadStatus === 'success' && uploadedFile;
    if (sourceMode === 'image' && !hasImage && !customPrompt.trim()) {
      setExtractError('Please upload or paste (Ctrl+V) a UI screenshot/photo or describe the application domain.');
      return;
    }

    setIsExtracting(true);
    setStageIndex(0);

    const stageTimers = [800, 2000, 4500, 2000].map((ms, i) =>
      setTimeout(() => setStageIndex((prev) => Math.min(i + 1, FLOW_STAGES.length - 1)), ms)
    );

    try {
      const payload = {
        imagePath: sourceMode === 'image' && hasImage ? uploadedFile.filename : undefined,
        uiPage: sourceMode === 'current_page' ? uiPage : undefined,
        prompt: customPrompt.trim() || undefined,
      };

      const response = await generateUiToFlow(payload);

      if (response.success && response.flowchart) {
        setFlowchart(response.flowchart);
        setSelectedNode(response.flowchart.nodes?.[0] || null);
        setActiveViewTab('canvas');
      } else {
        setExtractError(response.error || 'Failed to extract flowchart from UI.');
      }
    } catch (err) {
      setExtractError(err.message || 'An error occurred during UI flowchart extraction.');
    } finally {
      stageTimers.forEach(clearTimeout);
      setIsExtracting(false);
    }
  };

  const handleCopyMermaid = () => {
    if (!flowchart?.mermaid) return;
    navigator.clipboard.writeText(flowchart.mermaid);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full nm-animate-in">

      {/* ── 1. Preset Workflow Blueprints (Multi-Industry Showcase) ─────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--nm-text-muted)] flex items-center gap-1.5">
            <i className="pi pi-bolt text-[var(--nm-accent-light)]" />
            Quick Example Application Workflows (Student Admission, Library, Hospital, Bank, Hotel, etc.)
          </h3>
          <span className="text-[11px] text-[var(--nm-text-muted)]">Click any blueprint to instantly inspect its flowchart</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {WORKFLOW_PRESET_BLUEPRINTS.map((bp) => (
            <div
              key={bp.id}
              onClick={() => handleSelectBlueprint(bp)}
              className="p-3.5 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] hover:border-[var(--nm-accent)] hover:bg-[var(--nm-bg-surface)] cursor-pointer transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)]">
                  {bp.badge}
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
                <i className="pi pi-sitemap text-[9px]" /> Load Flowchart Graph
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Input Box (Upload / Paste UI Photos & Screenshots) ─────────────── */}
      <div className="nm-card p-5 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] rounded-xl flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--nm-border-subtle)] pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
              <i className="pi pi-share-alt text-[var(--nm-accent-light)]" />
              <span>UI Photos, Screenshots &amp; Files ➔ Flowchart Generator</span>
            </h3>
            <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
              Paste or upload photos/screenshots of forms (e.g. Student Admission, Library, Hospital, KYC, Banking, etc.) to extract the step-by-step flowchart.
            </p>
          </div>

          {/* Source Mode Toggle */}
          <div className="flex gap-1 bg-[var(--nm-bg-surface)] p-1 rounded-lg border border-[var(--nm-border-subtle)]">
            <button
              type="button"
              onClick={() => setSourceMode('image')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                sourceMode === 'image'
                  ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
              }`}
            >
              <i className="pi pi-image text-[10px]" />
              Upload / Paste UI Image (Ctrl+V)
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('current_page')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                sourceMode === 'current_page'
                  ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
              }`}
            >
              <i className="pi pi-file text-[10px]" />
              Current Project Page ({uiPage?.page || 'Home'})
            </button>
          </div>
        </div>

        {/* Mode 1: Upload / Paste UI Photo */}
        {sourceMode === 'image' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-3">
              <NmUploadArea
                file={uiFile}
                uploadStatus={uploadStatus}
                uploadError={uploadError}
                onFileSelect={handleFileSelect}
                onRemove={handleRemoveFile}
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                  <i className="pi pi-sliders-h text-[var(--nm-accent-light)] text-xs" />
                  Application Workflow Description
                  <span className="text-[10px] text-[var(--nm-text-muted)] font-normal">(Optional)</span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={isExtracting}
                  rows={3}
                  placeholder="e.g. Hospital patient registration with doctor booking, or Library book issue with barcode scan, or Student admission..."
                  className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y"
                />
              </div>

              {/* Progress Stage Tracker */}
              {isExtracting && (
                <div className="p-3 rounded-lg bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.3)] flex items-center gap-2.5">
                  <div className="w-5 h-5 border-2 border-[var(--nm-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--nm-text-primary)] truncate">
                      {FLOW_STAGES[stageIndex]?.label}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {extractError && (
                <div role="alert" className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[var(--nm-error)] flex items-start gap-1.5">
                  <i className="pi pi-exclamation-triangle mt-0.5 flex-shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExtractFlow}
                disabled={isExtracting}
                className={`w-full py-2.5 px-4 rounded-[var(--nm-radius-sm)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-0 ${
                  isExtracting
                    ? 'bg-[var(--nm-border)] text-[var(--nm-text-muted)] cursor-not-allowed opacity-70'
                    : 'bg-[var(--nm-accent)] text-white hover:opacity-90 shadow-[0_0_16px_rgba(108,99,255,0.35)]'
                }`}
              >
                {isExtracting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Extracting Flowchart…</span>
                  </>
                ) : (
                  <>
                    <i className="pi pi-sparkles" />
                    <span>⚡ Analyze UI &amp; Generate Flowchart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Current Project Page */}
        {sourceMode === 'current_page' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--nm-accent-glow)] flex items-center justify-center text-[var(--nm-accent-light)] font-bold">
                <i className="pi pi-file" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--nm-text-primary)]">
                  Active Page: {uiPage?.page || 'Home'}
                </h4>
                <p className="text-[11px] text-[var(--nm-text-muted)]">
                  {uiPage?.sections?.length || 4} sections · In-memory project state
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExtractFlow}
              disabled={isExtracting}
              className="px-4 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer border-0"
            >
              <i className="pi pi-bolt text-[10px]" />
              Extract User Flow
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Flowchart Presentation Canvas ─────────────────────────────────── */}
      {flowchart && (
        <div className="nm-card p-5 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] rounded-xl flex flex-col gap-5">
          
          {/* Flowchart Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nm-border-subtle)] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(34,197,94,0.12)] text-[var(--nm-success)] font-bold border border-[rgba(34,197,94,0.3)]">
                  FLOWCHART GENERATED
                </span>
                <span className="text-xs text-[var(--nm-text-muted)]">
                  {flowchart.nodes?.length || 0} Stages · {flowchart.edges?.length || 0} Directed Action Steps
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--nm-text-primary)]">
                {flowchart.title}
              </h3>
              <p className="text-xs text-[var(--nm-text-secondary)] mt-0.5 leading-relaxed max-w-3xl">
                {flowchart.summary}
              </p>
            </div>

            {/* View Tab Switcher */}
            <div className="flex items-center gap-1 bg-[var(--nm-bg-surface)] p-1 rounded-lg border border-[var(--nm-border-subtle)] self-start sm:self-center">
              <button
                type="button"
                onClick={() => setActiveViewTab('canvas')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                  activeViewTab === 'canvas'
                    ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                    : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
                }`}
              >
                <i className="pi pi-sitemap text-[10px]" />
                Flowchart Graph (SVG)
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('timeline')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                  activeViewTab === 'timeline'
                    ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                    : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
                }`}
              >
                <i className="pi pi-list text-[10px]" />
                User Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('mermaid')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                  activeViewTab === 'mermaid'
                    ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                    : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
                }`}
              >
                <i className="pi pi-code text-[10px]" />
                Mermaid Code
              </button>
            </div>
          </div>

          {/* ── View 1: Flowchart Visual Graph Canvas ───────────────────────── */}
          {activeViewTab === 'canvas' && (
            <div className="flex flex-col gap-6">
              
              {/* Visual Flowchart SVG & Graph Canvas */}
              <VisualFlowchartRenderer
                flowchart={flowchart}
                selectedNodeId={selectedNode?.id}
                onSelectNode={(node) => setSelectedNode(node)}
              />

              {/* Sequential Flowchart Node Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flowchart.nodes?.map((node, idx) => {
                  const cfg = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.section;
                  const isSelected = selectedNode?.id === node.id;
                  const outgoingEdges = flowchart.edges?.filter((e) => e.source === node.id) || [];

                  return (
                    <div
                      key={node.id || idx}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} shadow-[0_0_20px_rgba(108,99,255,0.25)] ring-1 ring-[var(--nm-accent)]`
                          : `bg-[var(--nm-bg-surface)] border-[var(--nm-border-subtle)] hover:border-[var(--nm-border)] hover:bg-[var(--nm-bg-card)]`
                      }`}
                    >
                      {/* Step index & Type Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                            <i className={cfg.icon} />
                          </div>
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${cfg.text}`}>
                            {cfg.badge}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[var(--nm-text-muted)] bg-[var(--nm-bg-card)] px-2 py-0.5 rounded border border-[var(--nm-border-subtle)]">
                          STEP {node.step || idx + 1}
                        </span>
                      </div>

                      {/* Node Label & Description */}
                      <div>
                        <h4 className="text-sm font-bold text-[var(--nm-text-primary)] mb-1">
                          {node.label}
                        </h4>
                        <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed line-clamp-2">
                          {node.description || 'Flowchart interaction point.'}
                        </p>
                      </div>

                      {/* Outgoing Transition Indicator */}
                      {outgoingEdges.length > 0 && (
                        <div className="pt-2 border-t border-[var(--nm-border-subtle)] flex flex-col gap-1">
                          {outgoingEdges.map((edge) => {
                            const targetNode = flowchart.nodes?.find((n) => n.id === edge.target);
                            return (
                              <div
                                key={edge.id}
                                className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--nm-accent-light)] truncate"
                              >
                                <i className="pi pi-arrow-right text-[8px] flex-shrink-0" />
                                <span className="font-semibold">{edge.label}</span>
                                <span className="text-[var(--nm-text-muted)]">➔ {targetNode?.label || edge.target}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Directed Transitions Summary Bar */}
              {flowchart.edges?.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--nm-text-muted)] flex items-center gap-1.5">
                      <i className="pi pi-directions text-[var(--nm-accent-light)]" />
                      Extracted Application Transitions &amp; Actions ({flowchart.edges.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {flowchart.edges.map((edge) => {
                      const srcNode = flowchart.nodes?.find((n) => n.id === edge.source);
                      const tgtNode = flowchart.nodes?.find((n) => n.id === edge.target);

                      return (
                        <div
                          key={edge.id}
                          className="px-3 py-1.5 rounded-lg bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-xs text-[var(--nm-text-secondary)] flex items-center gap-2 hover:border-[var(--nm-accent)] transition-colors"
                        >
                          <span className="font-bold text-[var(--nm-text-primary)]">{srcNode?.label || edge.source}</span>
                          <span className="px-2 py-0.5 rounded bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] font-mono text-[10px] font-semibold border border-[var(--nm-border)]">
                            {edge.label}
                          </span>
                          <i className="pi pi-arrow-right text-[10px] text-[var(--nm-accent-light)]" />
                          <span className="font-bold text-[var(--nm-text-primary)]">{tgtNode?.label || edge.target}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Node Details Inspector */}
              {selectedNode && (
                <div className="p-4 rounded-xl bg-[rgba(108,99,255,0.06)] border border-[rgba(108,99,255,0.25)] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--nm-accent-light)] flex items-center gap-1.5">
                      <i className="pi pi-info-circle" />
                      Node Inspector: {selectedNode.label}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--nm-text-muted)]">ID: {selectedNode.id}</span>
                  </div>
                  <p className="text-xs text-[var(--nm-text-primary)] leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── View 2: Step-by-Step User Journey Timeline ───────────────────── */}
          {activeViewTab === 'timeline' && (
            <div className="flex flex-col gap-4">
              <div className="relative pl-6 border-l-2 border-[var(--nm-accent)] space-y-6 my-2">
                {flowchart.nodes?.map((node, idx) => {
                  const cfg = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.section;
                  const outgoing = flowchart.edges?.find((e) => e.source === node.id);

                  return (
                    <div key={node.id || idx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[var(--nm-bg-primary)] border-2 border-[var(--nm-accent)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--nm-accent-light)]" />
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[var(--nm-accent-light)]">
                              Step {node.step || idx + 1}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cfg.bg} ${cfg.text}`}>
                              {cfg.badge}
                            </span>
                          </div>
                          <i className={`${cfg.icon} text-xs text-[var(--nm-text-muted)]`} />
                        </div>

                        <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">
                          {node.label}
                        </h4>
                        <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                          {node.description}
                        </p>

                        {outgoing && (
                          <div className="mt-1 p-2 rounded bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-xs text-[var(--nm-accent-light)] flex items-center gap-1.5 font-mono">
                            <i className="pi pi-arrow-circle-right text-[10px]" />
                            <span>Action: <strong>{outgoing.label}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── View 3: Mermaid Flowchart Code ──────────────────────────────── */}
          {activeViewTab === 'mermaid' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--nm-text-muted)]">
                  Standard Mermaid Flowchart (`flowchart TD`)
                </span>
                <button
                  type="button"
                  onClick={handleCopyMermaid}
                  className="px-3 py-1.5 text-xs font-bold rounded bg-[var(--nm-accent-glow)] border border-[var(--nm-border)] text-[var(--nm-accent-light)] hover:bg-[var(--nm-accent)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i className={copiedMermaid ? 'pi pi-check' : 'pi pi-copy'} />
                  <span>{copiedMermaid ? 'Copied!' : 'Copy Mermaid Code'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-xs font-mono text-[var(--nm-text-primary)] overflow-x-auto leading-relaxed">
                <code>{flowchart.mermaid}</code>
              </pre>
            </div>
          )}

          {/* ── AI Insights Box ─────────────────────────────────────────────── */}
          {flowchart.insights?.length > 0 && (
            <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.25)] flex flex-col gap-2">
              <span className="text-xs font-bold text-[var(--nm-success)] flex items-center gap-1.5">
                <i className="pi pi-check-circle" />
                AI User Journey &amp; Conversion Insights
              </span>
              <ul className="text-xs text-[var(--nm-text-secondary)] space-y-1 pl-4 list-disc">
                {flowchart.insights.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlowDiagram;

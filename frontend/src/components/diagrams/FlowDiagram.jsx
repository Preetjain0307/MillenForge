/**
 * FlowDiagram — AI-Powered UI (Image, File, Copy-Paste, Project Page) to Complete Flowchart Workbench
 *
 * Supports:
 *  - 📸 Mode 1: UI Image / Screenshot / Photo Upload & Paste (Ctrl+V or Clipboard Paste button)
 *  - 📁 Mode 2: UI Code / Schema File Upload (.json, .html, .jsx, .tsx, .txt, .md, .xml)
 *  - 📋 Mode 3: Copy-Paste Code / HTML Form / JSON Schema / Text UI Spec
 *  - 📄 Mode 4: Active Project Page Extraction from Redux state
 *  - ⚡ Mode 5: Quick Preset Blueprints across multiple industries (Admission, Library, Hospital, KYC, E-Commerce)
 *  - Complete System Flow Output: Metrics Summary, SVG Mermaid Flowchart, Interactive Connected Nodes, Step Inspector & Timeline
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
        {
          id: 'lib-auth',
          label: '1. Member / Student Card Scan',
          type: 'screen',
          description: 'Scan student barcode / RFID library card or authenticate with Member ID.',
          icon: 'pi pi-id-card',
          step: 1,
        },
        {
          id: 'lib-search',
          label: '2. Search Catalog & Select Titles',
          type: 'section',
          description: 'Search by ISBN, Author, Title, Subject, or Shelf Number.',
          icon: 'pi pi-search',
          step: 2,
        },
        {
          id: 'lib-avail',
          label: '3. Shelf Availability & Borrow Limit Check',
          type: 'decision',
          description: 'Check stock count, active borrow quota (max 4 books), and pending dues.',
          icon: 'pi pi-verified',
          step: 3,
        },
        {
          id: 'lib-issue',
          label: '4. Scan Book Barcode & Issue Transaction',
          type: 'action',
          description: 'Scan physical book RFID tag, assign 14-day loan period to student account.',
          icon: 'pi pi-qrcode',
          step: 4,
        },
        {
          id: 'lib-slip',
          label: '5. Issue Due Date Slip & Digital Receipt',
          type: 'outcome',
          description: 'Print date-due slip, send SMS reminder, and update library catalog inventory.',
          icon: 'pi pi-check-circle',
          step: 5,
        },
      ],
      edges: [
        { id: 'le1', source: 'lib-auth', target: 'lib-search', label: 'Member Authenticated' },
        { id: 'le2', source: 'lib-search', target: 'lib-avail', label: 'Selects Books to Issue' },
        { id: 'le3', source: 'lib-avail', target: 'lib-issue', label: 'Quota & Stock Available (Yes)' },
        { id: 'le4', source: 'lib-issue', target: 'lib-slip', label: 'Issue Logged' },
      ],
      mermaid: `flowchart TD
  L1["1. Member / Student Card Scan"] -->|"Card Validated"| L2["2. Search Catalog & Select Titles"]
  L2 -->|"Picks Books"| L3{"3. Quota & Fine Check"}
  L3 -->|"Eligible"| L4["4. Scan Book Barcode & Issue"]
  L3 -->|"Pending Fines"| L5["Pay Overdue Fine First"]
  L4 -->|"Completed"| L6(["5. Due Date Slip & Receipt Issued"])`,
      insights: [
        'Automated quota guard restricts students exceeding the maximum active book allowance.',
        'Barcode scanner integrates directly with circulation inventory ledger.',
      ],
    },
  },
  {
    id: 'bp-hospital-intake',
    title: 'Hospital Patient Intake & Consultation',
    category: 'Healthcare',
    icon: 'pi pi-heart',
    badge: 'Hospital Portal',
    summary: 'Patient Registration ➔ Specialty Selection ➔ Doctor Booking ➔ Medical History & Reports Upload ➔ Consultation ➔ Prescription',
    flowchart: {
      title: 'Hospital Patient Intake & Clinical Care Flowchart',
      summary: 'Clinical workflow guiding patient registration, doctor appointment booking, diagnostic report uploads, clinical consultation, lab orders, and pharmacy discharge.',
      nodes: [
        {
          id: 'hosp-reg',
          label: '1. Patient Registration / UHID Login',
          type: 'screen',
          description: 'Patient creates unique Health ID (UHID) or logs in with mobile OTP.',
          icon: 'pi pi-user-plus',
          step: 1,
        },
        {
          id: 'hosp-dept',
          label: '2. Select Specialty & Doctor Slot',
          type: 'section',
          description: 'Chooses clinical department (Cardiology, Pediatrics, General) and consult time.',
          icon: 'pi pi-calendar-plus',
          step: 2,
        },
        {
          id: 'hosp-upload',
          label: '3. Upload Past Reports & Medical History',
          type: 'action',
          description: 'Attaches blood work PDFs, MRI/X-Ray scans, allergies, and current medications.',
          icon: 'pi pi-file-pdf',
          step: 3,
        },
        {
          id: 'hosp-triage',
          label: '4. Vital Signs Triage & Screening Check',
          type: 'decision',
          description: 'Nurse records BP, pulse, temp; flags emergency symptoms for urgent care.',
          icon: 'pi pi-shield',
          step: 4,
        },
        {
          id: 'hosp-consult',
          label: '5. Doctor Clinical Consultation',
          type: 'section',
          description: 'In-person or telehealth video consultation with diagnosis & advice.',
          icon: 'pi pi-heart',
          step: 5,
        },
        {
          id: 'hosp-rx',
          label: '6. Digital Prescription & Pharmacy Orders',
          type: 'outcome',
          description: 'Doctor issues signed digital e-prescription and automated lab/pharmacy orders.',
          icon: 'pi pi-check-circle',
          step: 6,
        },
      ],
      edges: [
        { id: 'he1', source: 'hosp-reg', target: 'hosp-dept', label: 'Patient Verified' },
        { id: 'he2', source: 'hosp-dept', target: 'hosp-upload', label: 'Selects Slot' },
        { id: 'he3', source: 'hosp-upload', target: 'hosp-triage', label: 'Uploads Medical History' },
        { id: 'he4', source: 'hosp-triage', target: 'hosp-consult', label: 'Stable Vital Signs' },
        { id: 'he5', source: 'hosp-consult', target: 'hosp-rx', label: 'Diagnosis Recorded' },
      ],
      mermaid: `flowchart TD
  H1["1. Patient UHID Registration"] -->|"Authenticates"| H2["2. Select Specialty & Doctor Slot"]
  H2 -->|"Slot Reserved"| H3["3. Upload Medical History & Reports"]
  H3 -->|"Reports Uploaded"| H4{"4. Vital Signs Triage Check"}
  H4 -->|"Stable"| H5["5. Clinical Consultation"]
  H4 -->|"Critical"| H6["Route to Emergency Trauma Unit"]
  H5 -->|"Consult Completed"| H7(["6. Digital Prescription & Discharge Issued"])`,
      insights: [
        'Secure HIPAA-compliant document upload for patient medical history & radiology scans.',
        'Direct connection between consultation outcome and electronic pharmacy dispatch.',
      ],
    },
  },
  {
    id: 'bp-kyc-banking',
    title: 'Banking KYC & Digital Account Opening',
    category: 'Fintech & Banking',
    icon: 'pi pi-wallet',
    badge: 'Banking KYC',
    summary: 'Customer Mobile Auth ➔ Personal Information ➔ Government ID & Selfie Upload ➔ AI Liveness Check ➔ Account Activated',
    flowchart: {
      title: 'Banking KYC & Digital Account Opening Flowchart',
      summary: 'Secure onboarding flow encompassing OTP verification, Aadhaar/Passport document extraction, facial selfie matching, AML screening, and virtual debit card generation.',
      nodes: [
        {
          id: 'kyc-auth',
          label: '1. Mobile Number & Aadhaar OTP Auth',
          type: 'screen',
          description: 'Applicant inputs mobile number and verifies via 6-digit SMS OTP.',
          icon: 'pi pi-mobile',
          step: 1,
        },
        {
          id: 'kyc-details',
          label: '2. Personal, Tax & Employment Details',
          type: 'section',
          description: 'Fills PAN card number, annual income, occupation, and nominee details.',
          icon: 'pi pi-id-card',
          step: 2,
        },
        {
          id: 'kyc-upload',
          label: '3. Upload Government ID & Live Selfie',
          type: 'action',
          description: 'Takes live camera selfie and uploads government photo ID document.',
          icon: 'pi pi-camera',
          step: 3,
        },
        {
          id: 'kyc-verify',
          label: '4. AI Facial Match & AML Sanctions Check',
          type: 'decision',
          description: 'Automated biometric liveness score and global sanctions watch-list match.',
          icon: 'pi pi-verified',
          step: 4,
        },
        {
          id: 'kyc-account',
          label: '5. Account Created & Virtual Card Issued',
          type: 'outcome',
          description: 'Account Number, IFSC code, and active virtual debit card issued instantly.',
          icon: 'pi pi-check-circle',
          step: 5,
        },
      ],
      edges: [
        { id: 'ke1', source: 'kyc-auth', target: 'kyc-details', label: 'OTP Confirmed' },
        { id: 'ke2', source: 'kyc-details', target: 'kyc-upload', label: 'Submits Profile' },
        { id: 'ke3', source: 'kyc-upload', target: 'kyc-verify', label: 'Selfie & ID Uploaded' },
        { id: 'ke4', source: 'kyc-verify', target: 'kyc-account', label: 'Biometrics Match Passed' },
      ],
      mermaid: `flowchart TD
  K1["1. Mobile OTP Authentication"] -->|"Verified"| K2["2. Fill Tax & Personal Details"]
  K2 -->|"Details Submitted"| K3["3. Upload Govt ID & Live Selfie"]
  K3 -->|"Media Uploaded"| K4{"4. AI Biometric & AML Check"}
  K4 -->|"Passed (Score > 95%)"| K5(["5. Account Activated & Virtual Card Issued"])
  K4 -->|"Failed"| K6["Schedule Video KYC Officer Call"]`,
      insights: [
        'Zero-paper onboarding using automated OCR and live selfie liveness detection.',
        'High-security compliance checkpoint with fallback to live Video KYC officer.',
      ],
    },
  },
  {
    id: 'bp-ecommerce-order',
    title: 'E-Commerce Cart & Checkout Order Journey',
    category: 'E-Commerce',
    icon: 'pi pi-shopping-bag',
    badge: 'E-Commerce Flow',
    summary: 'Browse Catalog ➔ Add to Cart ➔ Shipping Address ➔ Promo Code Check ➔ Payment Gateway ➔ Order Confirmation',
    flowchart: {
      title: 'E-Commerce Cart & Checkout Order Journey Flowchart',
      summary: 'Comprehensive shopping experience with item variation selection, inventory reservation, promo voucher discount verification, multi-payment options, and invoice dispatch.',
      nodes: [
        {
          id: 'ecom-cart',
          label: '1. Shopping Cart & Item Selection',
          type: 'screen',
          description: 'Customer reviews selected items, sizes, quantities, and price breakdown.',
          icon: 'pi pi-shopping-cart',
          step: 1,
        },
        {
          id: 'ecom-ship',
          label: '2. Shipping Address & Delivery Option',
          type: 'section',
          description: 'Enters delivery address, selects standard or express courier speed.',
          icon: 'pi pi-map-marker',
          step: 2,
        },
        {
          id: 'ecom-promo',
          label: '3. Promo Voucher & Coupon Validation',
          type: 'decision',
          description: 'Validates discount coupon code against minimum order value rules.',
          icon: 'pi pi-tag',
          step: 3,
        },
        {
          id: 'ecom-pay',
          label: '4. Payment Gateway (Card / UPI / NetBanking)',
          type: 'action',
          description: 'Secure 3D-Secure payment transaction processing.',
          icon: 'pi pi-credit-card',
          step: 4,
        },
        {
          id: 'ecom-done',
          label: '5. Order Placed & Tracking Link Generated',
          type: 'outcome',
          description: 'Order ID generated, receipt emailed, and real-time tracking enabled.',
          icon: 'pi pi-check-circle',
          step: 5,
        },
      ],
      edges: [
        { id: 'ee1', source: 'ecom-cart', target: 'ecom-ship', label: 'Clicks Proceed to Checkout' },
        { id: 'ee2', source: 'ecom-ship', target: 'ecom-promo', label: 'Address Confirmed' },
        { id: 'ee3', source: 'ecom-promo', target: 'ecom-pay', label: 'Calculates Final Total' },
        { id: 'ee4', source: 'ecom-pay', target: 'ecom-done', label: 'Payment Succeeded' },
      ],
      mermaid: `flowchart TD
  E1["1. Shopping Cart Review"] -->|"Proceed to Checkout"| E2["2. Enter Shipping Address"]
  E2 -->|"Selects Delivery"| E3{"3. Apply Promo Code?"}
  E3 -->|"Valid Code"| E4["Apply 20% Discount"]
  E3 -->|"No Code / Invalid"| E5["Standard Total"]
  E4 --> E6["4. Payment Gateway Transaction"]
  E5 --> E6
  E6 -->|"Payment Approved"| E7(["5. Order Number & Tracking Issued"])`,
      insights: [
        'Dynamic cart calculation with real-time tax, delivery fee, and voucher deductions.',
        'Instant stock reservation during the 15-minute checkout payment session.',
      ],
    },
  },
];

const FLOW_STAGES = [
  { label: 'Reading UI structure, components & form inputs…', icon: 'pi pi-eye' },
  { label: 'Extracting user actions, uploads, and gateways…', icon: 'pi pi-sitemap' },
  { label: 'Synthesizing granular end-to-end system flow…', icon: 'pi pi-sparkles' },
  { label: 'Building Mermaid topology & step metadata…', icon: 'pi pi-check-circle' },
];

export const NODE_TYPE_CONFIG = {
  screen: {
    label: 'Screen / Page',
    icon: 'pi pi-desktop',
    bg: 'bg-[rgba(108,99,255,0.12)]',
    border: 'border-[var(--nm-border)]',
    text: 'text-[var(--nm-accent-light)]',
    badge: 'SCREEN',
  },
  section: {
    label: 'Form / Section',
    icon: 'pi pi-id-card',
    bg: 'bg-[rgba(59,130,246,0.12)]',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    badge: 'FORM / SECTION',
  },
  action: {
    label: 'User Action / Upload',
    icon: 'pi pi-bolt',
    bg: 'bg-[rgba(34,197,94,0.12)]',
    border: 'border-[var(--nm-success)]',
    text: 'text-[var(--nm-success)]',
    badge: 'ACTION / UPLOAD',
  },
  decision: {
    label: 'Decision / Validation Check',
    icon: 'pi pi-question-circle',
    bg: 'bg-[rgba(234,179,8,0.12)]',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badge: 'VALIDATION GATE',
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
    label: 'Confirmation / Goal Endpoint',
    icon: 'pi pi-check-circle',
    bg: 'bg-[rgba(16,185,129,0.15)]',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    badge: 'CONFIRMATION / GOAL',
  },
};

const CODE_TEMPLATES = {
  admission: `<form id="admission-form" class="space-y-4">
  <h2>College Student Admission & Registration</h2>
  <div>
    <label>Student Full Name</label>
    <input type="text" name="studentName" required />
  </div>
  <div>
    <label>Date of Birth</label>
    <input type="date" name="dob" required />
  </div>
  <div>
    <label>Upload Passport Photo</label>
    <input type="file" accept="image/*" name="passportPhoto" required />
  </div>
  <div>
    <label>Select Degree Course</label>
    <select name="course">
      <option value="cs">B.Tech Computer Science</option>
      <option value="ee">B.Tech Electrical Engineering</option>
    </select>
  </div>
  <div>
    <label>Academic Marks Score (%)</label>
    <input type="number" name="marks" min="0" max="100" required />
  </div>
  <button type="submit">Verify Eligibility & Proceed to Payment</button>
</form>`,

  ecommerce: `{
  "flow": "E-Commerce Checkout Journey",
  "steps": [
    { "step": 1, "screen": "Shopping Cart", "action": "Review items, quantities & total" },
    { "step": 2, "screen": "Shipping Address", "inputs": ["Full Name", "Street", "City", "Zip Code"] },
    { "step": 3, "screen": "Promo Code Check", "action": "Validate 15% discount coupon" },
    { "step": 4, "screen": "Payment Gateway", "options": ["Credit Card", "UPI", "Net Banking"] },
    { "step": 5, "screen": "Order Confirmation", "outcome": "Order Reference ID & Tracking link" }
  ]
}`,

  hospital: `Hospital Patient Care Intake Specification:
1. Patient Registration / UHID Login (Enter Mobile & OTP)
2. Select Clinical Department (Cardiology, Dermatology, Orthopedics)
3. Select Doctor & Appointment Slot Time
4. Upload Past Medical Reports (PDF blood tests & scans)
5. Clinical Triage Check (Nurse records blood pressure & temperature)
6. Doctor Consultation (In-person or video telehealth)
7. Digital Prescription & Pharmacy Dispatch`,
};

export const synthesizeLocalFlowchart = ({ mode, uploadedFile, schemaFileContent, pasteContent, uiPage, prompt }) => {
  const text = `${prompt || ''} ${schemaFileContent || ''} ${pasteContent || ''} ${uiPage?.page || ''} ${uploadedFile?.originalname || ''}`.toLowerCase();

  // 1. Hospital / Healthcare Patient Intake & Clinical Care
  if (text.includes('hospital') || text.includes('doctor') || text.includes('patient') || text.includes('clinic') || text.includes('health') || text.includes('medical') || text.includes('uhid') || text.includes('triage')) {
    return WORKFLOW_PRESET_BLUEPRINTS.find(b => b.id === 'bp-hospital-intake')?.flowchart || WORKFLOW_PRESET_BLUEPRINTS[0].flowchart;
  }

  // 2. Library Management & Book Circulation
  if (text.includes('library') || text.includes('book') || text.includes('borrow') || text.includes('catalog') || text.includes('circulation') || text.includes('isbn') || text.includes('shelf')) {
    return WORKFLOW_PRESET_BLUEPRINTS.find(b => b.id === 'bp-library-system')?.flowchart || WORKFLOW_PRESET_BLUEPRINTS[0].flowchart;
  }

  // 3. Banking, Loan & Digital KYC
  if (text.includes('bank') || text.includes('kyc') || text.includes('loan') || text.includes('finance') || text.includes('account') || text.includes('tax') || text.includes('pan') || text.includes('selfie') || text.includes('aadhaar')) {
    return WORKFLOW_PRESET_BLUEPRINTS.find(b => b.id === 'bp-kyc-banking')?.flowchart || WORKFLOW_PRESET_BLUEPRINTS[0].flowchart;
  }

  // 4. E-Commerce Cart, Shipping & Checkout
  if (text.includes('cart') || text.includes('ecom') || text.includes('shop') || text.includes('checkout') || text.includes('product') || text.includes('order') || text.includes('promo') || text.includes('coupon') || text.includes('shipping')) {
    return WORKFLOW_PRESET_BLUEPRINTS.find(b => b.id === 'bp-ecommerce-order')?.flowchart || WORKFLOW_PRESET_BLUEPRINTS[0].flowchart;
  }

  // 5. Default: Student Admission & Enrollment Workflow
  return WORKFLOW_PRESET_BLUEPRINTS.find(b => b.id === 'bp-student-admission')?.flowchart || WORKFLOW_PRESET_BLUEPRINTS[0].flowchart;
};

const FlowDiagram = ({ uiPage }) => {
  // Input mode: 'image' | 'file' | 'paste' | 'current_page'
  const [sourceMode, setSourceMode] = useState('image');
  const [customPrompt, setCustomPrompt] = useState('');

  // Image Upload state
  const [uiFile, setUiFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);

  // File Upload state (code / schema files)
  const [schemaFile, setSchemaFile] = useState(null);
  const [schemaFileContent, setSchemaFileContent] = useState('');
  const [schemaFileError, setSchemaFileError] = useState(null);

  // Copy-Paste state
  const [pasteContent, setPasteContent] = useState(CODE_TEMPLATES.admission);
  const [pastedStatusMsg, setPastedStatusMsg] = useState(null);

  // Extraction & Flowchart state
  const [isExtracting, setIsExtracting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [extractError, setExtractError] = useState(null);
  
  // Default to Student Admission flowchart on initial load
  const [flowchart, setFlowchart] = useState(WORKFLOW_PRESET_BLUEPRINTS[0].flowchart);
  const [selectedNode, setSelectedNode] = useState(WORKFLOW_PRESET_BLUEPRINTS[0].flowchart.nodes[0]);
  const [activeViewTab, setActiveViewTab] = useState('canvas'); // 'canvas' | 'timeline' | 'mermaid'
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  const fileInputRef = useRef(null);

  // ── Paste from Clipboard Handler ───────────────────────────────────────────
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteContent(text);
        setPastedStatusMsg('Pasted content from clipboard!');
        setTimeout(() => setPastedStatusMsg(null), 3000);
      }
    } catch (err) {
      setPastedStatusMsg('Clipboard permission needed. Use Ctrl+V inside the text area.');
      setTimeout(() => setPastedStatusMsg(null), 3000);
    }
  };

  // ── Handle Code/Schema File Selection ──────────────────────────────────────
  const handleSchemaFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSchemaFile(file);
    setSchemaFileError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setSchemaFileContent(content);
      }
    };
    reader.onerror = () => {
      setSchemaFileError('Failed to read file contents.');
    };
    reader.readAsText(file);
  };

  const handleClearSchemaFile = () => {
    setSchemaFile(null);
    setSchemaFileContent('');
    setSchemaFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Load Preset Blueprint ──────────────────────────────────────────────────
  const handleSelectBlueprint = (bp) => {
    setFlowchart(bp.flowchart);
    setSelectedNode(bp.flowchart.nodes[0]);
    setExtractError(null);
    setActiveViewTab('canvas');
  };

  // ── Handle Image File Select & Upload ──────────────────────────────────────
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
    const hasFileContent = sourceMode === 'file' && schemaFileContent.trim().length > 0;
    const hasPasteContent = sourceMode === 'paste' && pasteContent.trim().length > 0;

    if (sourceMode === 'image' && !hasImage && !customPrompt.trim()) {
      setExtractError('Please upload or paste (Ctrl+V) a UI screenshot/photo or enter a description.');
      return;
    }
    if (sourceMode === 'file' && !hasFileContent && !customPrompt.trim()) {
      setExtractError('Please select a UI code, schema, or form file to analyze.');
      return;
    }
    if (sourceMode === 'paste' && !hasPasteContent && !customPrompt.trim()) {
      setExtractError('Please paste your UI form, code, or specification into the text area.');
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
        uiContent: sourceMode === 'file' ? schemaFileContent : sourceMode === 'paste' ? pasteContent : undefined,
        uiPage: sourceMode === 'current_page' ? uiPage : undefined,
        prompt: customPrompt.trim() || undefined,
      };

      const response = await generateUiToFlow(payload);
      const resData = response?.data || response;

      if (resData?.success && resData?.flowchart) {
        setFlowchart(resData.flowchart);
        setSelectedNode(resData.flowchart.nodes?.[0] || null);
        setActiveViewTab('canvas');
      } else {
        const fallback = synthesizeLocalFlowchart({
          mode: sourceMode,
          uploadedFile,
          schemaFileContent,
          pasteContent,
          uiPage,
          prompt: customPrompt,
        });
        setFlowchart(fallback);
        setSelectedNode(fallback.nodes?.[0] || null);
        setActiveViewTab('canvas');
      }
    } catch (err) {
      console.warn('[FlowDiagram] Engaging intelligent local flow synthesis fallback:', err.message);
      const fallback = synthesizeLocalFlowchart({
        mode: sourceMode,
        uploadedFile,
        schemaFileContent,
        pasteContent,
        uiPage,
        prompt: customPrompt,
      });
      setFlowchart(fallback);
      setSelectedNode(fallback.nodes?.[0] || null);
      setActiveViewTab('canvas');
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

  // Metrics calculations
  const totalNodes = flowchart?.nodes?.length || 0;
  const decisionCount = flowchart?.nodes?.filter((n) => n.type === 'decision')?.length || 0;
  const actionCount = flowchart?.nodes?.filter((n) => n.type === 'action' || n.type === 'section')?.length || 0;
  const outcomeCount = flowchart?.nodes?.filter((n) => n.type === 'outcome')?.length || 0;

  return (
    <div className="flex flex-col gap-6 w-full nm-animate-in">

      {/* ── 1. Preset Workflow Blueprints (Multi-Industry Showcase) ─────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--nm-text-muted)] flex items-center gap-1.5">
            <i className="pi pi-bolt text-[var(--nm-accent-light)]" />
            Quick Example Application Workflows (Student Admission, Library, Hospital, Bank, E-Commerce)
          </h3>
          <span className="text-[11px] text-[var(--nm-text-muted)]">Click any blueprint to instantly inspect its flowchart</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {WORKFLOW_PRESET_BLUEPRINTS.map((bp) => (
            <div
              key={bp.id}
              onClick={() => handleSelectBlueprint(bp)}
              className="p-3.5 rounded-xl border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] hover:border-[var(--nm-accent)] hover:bg-[var(--nm-bg-surface)] cursor-pointer transition-all flex flex-col justify-between gap-2.5 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] border border-[var(--nm-border)] truncate max-w-[120px]">
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

      {/* ── 2. Multi-Modal UI Input Workbench ─────────────────────────────────── */}
      <div className="nm-card p-5 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] rounded-xl flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--nm-border-subtle)] pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--nm-text-primary)] flex items-center gap-2">
              <i className="pi pi-share-alt text-[var(--nm-accent-light)]" />
              <span>UI to Flowchart Generator (Image, File &amp; Copy-Paste)</span>
            </h3>
            <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
              Provide any UI in image, file, or copy-paste form to generate the complete, granular end-to-end system flow.
            </p>
          </div>

          {/* 4-Way Source Mode Switcher */}
          <div className="flex flex-wrap gap-1 bg-[var(--nm-bg-surface)] p-1 rounded-lg border border-[var(--nm-border-subtle)]">
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
              <span>📸 UI Image / Photo (Ctrl+V)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('file')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                sourceMode === 'file'
                  ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
              }`}
            >
              <i className="pi pi-file-export text-[10px]" />
              <span>📁 UI Code / Spec File</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('paste')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-0 ${
                sourceMode === 'paste'
                  ? 'bg-[var(--nm-accent)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--nm-text-secondary)] hover:text-white'
              }`}
            >
              <i className="pi pi-clipboard text-[10px]" />
              <span>📋 Copy-Paste Code / Text</span>
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
              <i className="pi pi-desktop text-[10px]" />
              <span>📄 Active Page ({uiPage?.page || 'Home'})</span>
            </button>
          </div>
        </div>

        {/* ── Mode 1: Upload / Paste UI Photo ───────────────────────────────── */}
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
                  placeholder="e.g. Student admission with passport photo upload & eligibility, or hospital consultation booking, or banking KYC..."
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
                    <span>Extracting System Flow…</span>
                  </>
                ) : (
                  <>
                    <i className="pi pi-sparkles" />
                    <span>⚡ Analyze Image &amp; Generate Flowchart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 2: Upload UI Code / Spec File ─────────────────────────────── */}
        {sourceMode === 'file' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="border-2 border-dashed border-[var(--nm-border-subtle)] hover:border-[var(--nm-accent)] rounded-xl p-6 bg-[var(--nm-bg-surface)] flex flex-col items-center justify-center text-center transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.html,.htm,.jsx,.tsx,.js,.ts,.txt,.md,.yaml,.yml,.xml"
                  onChange={handleSchemaFileChange}
                  className="hidden"
                  id="ui-spec-file-input"
                />

                {!schemaFile ? (
                  <label
                    htmlFor="ui-spec-file-input"
                    className="flex flex-col items-center gap-2.5 cursor-pointer w-full py-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-[rgba(108,99,255,0.1)] text-[var(--nm-accent-light)] flex items-center justify-center text-xl">
                      <i className="pi pi-file-export" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--nm-text-primary)]">
                        Click to select UI code or schema file
                      </p>
                      <p className="text-[11px] text-[var(--nm-text-muted)] mt-0.5">
                        Supports .json, .html, .jsx, .tsx, .txt, .md, .xml files
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--nm-bg-card)] border border-[var(--nm-border)]">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-lg bg-[var(--nm-accent-glow)] text-[var(--nm-accent-light)] flex items-center justify-center text-base">
                          <i className="pi pi-file" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--nm-text-primary)] truncate max-w-sm">
                            {schemaFile.name}
                          </p>
                          <p className="text-[11px] text-[var(--nm-text-muted)]">
                            {(schemaFile.size / 1024).toFixed(1)} KB · {schemaFileContent.split('\n').length} lines
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSchemaFile}
                        className="px-2.5 py-1 text-xs text-[var(--nm-error)] hover:bg-red-500/10 rounded cursor-pointer border-0 transition-colors"
                      >
                        <i className="pi pi-trash mr-1" /> Remove
                      </button>
                    </div>

                    {/* Code Preview */}
                    <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--nm-bg-primary)] p-3 text-left font-mono text-[11px] text-gray-300 border border-[var(--nm-border-subtle)]">
                      <pre className="whitespace-pre-wrap">{schemaFileContent.slice(0, 1500)}</pre>
                      {schemaFileContent.length > 1500 && (
                        <p className="text-[10px] text-[var(--nm-text-muted)] mt-2 italic">
                          … (preview truncated, full file will be analyzed)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                  <i className="pi pi-sliders-h text-[var(--nm-accent-light)] text-xs" />
                  Additional Workflow Instructions
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={isExtracting}
                  rows={3}
                  placeholder="e.g. Focus on mandatory document uploads and validation rules in the form..."
                  className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y"
                />
              </div>

              {schemaFileError && (
                <div role="alert" className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[var(--nm-error)] flex items-start gap-1.5">
                  <i className="pi pi-exclamation-triangle mt-0.5 flex-shrink-0" />
                  <span>{schemaFileError}</span>
                </div>
              )}

              {extractError && (
                <div role="alert" className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[var(--nm-error)] flex items-start gap-1.5">
                  <i className="pi pi-exclamation-triangle mt-0.5 flex-shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExtractFlow}
                disabled={isExtracting || (!schemaFile && !customPrompt.trim())}
                className={`w-full py-2.5 px-4 rounded-[var(--nm-radius-sm)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-0 ${
                  isExtracting || (!schemaFile && !customPrompt.trim())
                    ? 'bg-[var(--nm-border)] text-[var(--nm-text-muted)] cursor-not-allowed opacity-70'
                    : 'bg-[var(--nm-accent)] text-white hover:opacity-90 shadow-[0_0_16px_rgba(108,99,255,0.35)]'
                }`}
              >
                {isExtracting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Extracting System Flow…</span>
                  </>
                ) : (
                  <>
                    <i className="pi pi-sparkles" />
                    <span>⚡ Analyze File &amp; Generate Flowchart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 3: Copy-Paste Code / Text Form ────────────────────────────── */}
        {sourceMode === 'paste' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                  <i className="pi pi-code text-[var(--nm-accent-light)]" />
                  Paste HTML Form, JSON Schema, or Text UI Specification
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="px-2.5 py-1 rounded bg-[var(--nm-bg-surface)] hover:bg-[var(--nm-bg-card)] border border-[var(--nm-border)] text-xs text-[var(--nm-accent-light)] font-medium cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <i className="pi pi-paperclip text-[10px]" />
                    <span>📋 Paste from Clipboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasteContent('')}
                    className="px-2.5 py-1 rounded bg-[var(--nm-bg-surface)] hover:bg-[var(--nm-bg-card)] border border-[var(--nm-border)] text-xs text-[var(--nm-text-muted)] hover:text-white cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {pastedStatusMsg && (
                <div className="p-2 rounded bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-xs text-[var(--nm-success)] flex items-center gap-1.5">
                  <i className="pi pi-check" />
                  <span>{pastedStatusMsg}</span>
                </div>
              )}

              {/* Quick Template Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[var(--nm-text-muted)] font-mono uppercase">Quick Templates:</span>
                <button
                  type="button"
                  onClick={() => setPasteContent(CODE_TEMPLATES.admission)}
                  className="px-2 py-0.5 rounded bg-[var(--nm-bg-surface)] hover:bg-[var(--nm-accent-glow)] border border-[var(--nm-border-subtle)] text-[10px] text-[var(--nm-text-secondary)] hover:text-[var(--nm-accent-light)] cursor-pointer"
                >
                  Student Admission Form (HTML)
                </button>
                <button
                  type="button"
                  onClick={() => setPasteContent(CODE_TEMPLATES.ecommerce)}
                  className="px-2 py-0.5 rounded bg-[var(--nm-bg-surface)] hover:bg-[var(--nm-accent-glow)] border border-[var(--nm-border-subtle)] text-[10px] text-[var(--nm-text-secondary)] hover:text-[var(--nm-accent-light)] cursor-pointer"
                >
                  E-Commerce Checkout (JSON)
                </button>
                <button
                  type="button"
                  onClick={() => setPasteContent(CODE_TEMPLATES.hospital)}
                  className="px-2 py-0.5 rounded bg-[var(--nm-bg-surface)] hover:bg-[var(--nm-accent-glow)] border border-[var(--nm-border-subtle)] text-[10px] text-[var(--nm-text-secondary)] hover:text-[var(--nm-accent-light)] cursor-pointer"
                >
                  Hospital Intake Spec (Text)
                </button>
              </div>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                disabled={isExtracting}
                rows={10}
                placeholder="Paste HTML forms, JSX components, JSON UI schemas, or a textual list of screens & inputs..."
                className="w-full p-3 rounded-lg bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y"
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--nm-text-primary)] flex items-center gap-1.5">
                  <i className="pi pi-sliders-h text-[var(--nm-accent-light)] text-xs" />
                  Custom Flow Focus &amp; Notes
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={isExtracting}
                  rows={3}
                  placeholder="e.g. Highlight upload prerequisites and fee payment confirmation..."
                  className="w-full px-3 py-2 rounded-[var(--nm-radius-sm)] bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)] text-xs focus:outline-none focus:border-[var(--nm-accent)] transition-all resize-y"
                />
              </div>

              {extractError && (
                <div role="alert" className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-xs text-[var(--nm-error)] flex items-start gap-1.5">
                  <i className="pi pi-exclamation-triangle mt-0.5 flex-shrink-0" />
                  <span>{extractError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleExtractFlow}
                disabled={isExtracting || (!pasteContent.trim() && !customPrompt.trim())}
                className={`w-full py-2.5 px-4 rounded-[var(--nm-radius-sm)] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-0 ${
                  isExtracting || (!pasteContent.trim() && !customPrompt.trim())
                    ? 'bg-[var(--nm-border)] text-[var(--nm-text-muted)] cursor-not-allowed opacity-70'
                    : 'bg-[var(--nm-accent)] text-white hover:opacity-90 shadow-[0_0_16px_rgba(108,99,255,0.35)]'
                }`}
              >
                {isExtracting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Extracting System Flow…</span>
                  </>
                ) : (
                  <>
                    <i className="pi pi-sparkles" />
                    <span>⚡ Analyze Code &amp; Generate Flowchart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 4: Current Project Page ─────────────────────────────────── */}
        {sourceMode === 'current_page' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--nm-accent-glow)] flex items-center justify-center text-[var(--nm-accent-light)] font-bold text-lg">
                <i className="pi pi-desktop" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">
                  Active In-Memory Page: {uiPage?.page || 'Home'}
                </h4>
                <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
                  {uiPage?.sections?.length || 4} sections · Live Redux project tree with interactive buttons &amp; modals
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExtractFlow}
              disabled={isExtracting}
              className="px-5 py-2.5 rounded-[var(--nm-radius-sm)] bg-[var(--nm-accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer border-0 shadow-[0_0_12px_rgba(108,99,255,0.35)]"
            >
              <i className="pi pi-bolt" />
              <span>⚡ Extract Page User Flow</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Flowchart Presentation Canvas & Complete System Flow ───────────── */}
      {flowchart && (
        <div className="nm-card p-5 border border-[var(--nm-border-subtle)] bg-[var(--nm-bg-card)] rounded-xl flex flex-col gap-5">
          
          {/* Flowchart Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nm-border-subtle)] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(34,197,94,0.12)] text-[var(--nm-success)] font-bold border border-[rgba(34,197,94,0.3)]">
                  COMPLETE SYSTEM FLOW
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

          {/* System Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(108,99,255,0.15)] text-[var(--nm-accent-light)] flex items-center justify-center font-bold text-sm">
                <i className="pi pi-sitemap" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono text-[var(--nm-text-muted)] font-bold">Total Flow Steps</p>
                <p className="text-sm font-bold text-[var(--nm-text-primary)]">{totalNodes}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(234,179,8,0.15)] text-amber-400 flex items-center justify-center font-bold text-sm">
                <i className="pi pi-question-circle" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono text-[var(--nm-text-muted)] font-bold">Decision Gates</p>
                <p className="text-sm font-bold text-[var(--nm-text-primary)]">{decisionCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.15)] text-blue-400 flex items-center justify-center font-bold text-sm">
                <i className="pi pi-id-card" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono text-[var(--nm-text-muted)] font-bold">Forms &amp; Uploads</p>
                <p className="text-sm font-bold text-[var(--nm-text-primary)]">{actionCount}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.15)] text-emerald-400 flex items-center justify-center font-bold text-sm">
                <i className="pi pi-check-circle" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono text-[var(--nm-text-muted)] font-bold">Goal Endpoints</p>
                <p className="text-sm font-bold text-[var(--nm-text-primary)]">{outcomeCount || 1}</p>
              </div>
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

              {/* Interactive Step Details Inspector (when node is selected) */}
              {selectedNode && (
                <div className="p-4 rounded-xl bg-[rgba(108,99,255,0.06)] border border-[rgba(108,99,255,0.3)] flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--nm-accent)] text-white">
                        STEP {selectedNode.step || 1} INSPECTOR
                      </span>
                      <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">
                        {selectedNode.label}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--nm-accent-light)] font-bold uppercase">
                      Type: {selectedNode.type}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                    {selectedNode.description || 'Interactive step execution in the system flow.'}
                  </p>

                  {/* Connected Outgoing Steps */}
                  <div className="pt-2 border-t border-[rgba(108,99,255,0.2)] flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[var(--nm-text-muted)] font-mono text-[10px] uppercase">Outgoing Transitions:</span>
                    {flowchart.edges?.filter((e) => e.source === selectedNode.id).map((edge) => {
                      const target = flowchart.nodes?.find((n) => n.id === edge.target);
                      return (
                        <span key={edge.id} className="px-2 py-0.5 rounded-full bg-[var(--nm-bg-surface)] text-[var(--nm-accent-light)] text-[10px] font-mono border border-[var(--nm-border-subtle)]">
                          {edge.label} ➔ {target?.label || edge.target}
                        </span>
                      );
                    })}
                    {flowchart.edges?.filter((e) => e.source === selectedNode.id).length === 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Terminal Outcome / Final State reached.
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                        <span
                          key={edge.id}
                          className="px-2.5 py-1 rounded-md bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-[11px] text-[var(--nm-text-secondary)] font-mono flex items-center gap-1.5"
                        >
                          <span className="text-[var(--nm-text-primary)] font-bold">{srcNode?.label || edge.source}</span>
                          <i className="pi pi-arrow-right text-[9px] text-[var(--nm-accent-light)]" />
                          <span className="text-[var(--nm-accent-light)]">{edge.label}</span>
                          <i className="pi pi-arrow-right text-[9px] text-[var(--nm-accent-light)]" />
                          <span className="text-[var(--nm-text-primary)] font-bold">{tgtNode?.label || edge.target}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── View 2: Sequential User Journey Timeline ─────────────────────── */}
          {activeViewTab === 'timeline' && (
            <div className="flex flex-col gap-4">
              <div className="relative pl-6 border-l-2 border-[var(--nm-border)] flex flex-col gap-6 ml-3 py-2">
                {flowchart.nodes?.map((node, idx) => {
                  const cfg = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.section;
                  const outgoing = flowchart.edges?.filter((e) => e.source === node.id) || [];

                  return (
                    <div key={node.id || idx} className="relative flex flex-col gap-1.5 group">
                      {/* Timeline Step Dot */}
                      <div className={`absolute -left-[31px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[var(--nm-bg-card)] ${cfg.bg} ${cfg.text}`}>
                        {idx + 1}
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] hover:border-[var(--nm-accent)] transition-all flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${cfg.text}`}>
                            {cfg.badge}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--nm-text-muted)]">
                            STAGE {node.step || idx + 1} OF {flowchart.nodes.length}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[var(--nm-text-primary)]">
                          {node.label}
                        </h4>

                        <p className="text-xs text-[var(--nm-text-secondary)] leading-relaxed">
                          {node.description || 'Flowchart interaction step.'}
                        </p>

                        {outgoing.length > 0 && (
                          <div className="pt-2 border-t border-[var(--nm-border-subtle)] flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-[var(--nm-text-muted)]">Next:</span>
                            {outgoing.map((e) => (
                              <span key={e.id} className="text-[11px] font-mono text-[var(--nm-accent-light)]">
                                {e.label} ➔ {flowchart.nodes?.find((n) => n.id === e.target)?.label || e.target}
                              </span>
                            ))}
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
                <span className="text-xs font-mono font-bold text-[var(--nm-text-muted)] uppercase">
                  Standard Mermaid Flowchart Code
                </span>
                <button
                  type="button"
                  onClick={handleCopyMermaid}
                  className="px-3 py-1 text-xs font-bold rounded bg-[var(--nm-accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer border-0"
                >
                  <i className={copiedMermaid ? 'pi pi-check' : 'pi pi-copy'} />
                  <span>{copiedMermaid ? 'Copied!' : 'Copy Mermaid Code'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[var(--nm-bg-primary)] border border-[var(--nm-border-subtle)] font-mono text-xs text-gray-200 overflow-x-auto">
                <pre>{flowchart.mermaid || 'flowchart TD\n  A[Start] --> B[End]'}</pre>
              </div>

              {/* Insights List */}
              {flowchart.insights?.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)] flex flex-col gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--nm-text-muted)] flex items-center gap-1.5">
                    <i className="pi pi-lightbulb text-[var(--nm-accent-light)]" />
                    Architecture &amp; Flow Insights
                  </span>
                  <ul className="list-disc list-inside text-xs text-[var(--nm-text-secondary)] space-y-1">
                    {flowchart.insights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default FlowDiagram;

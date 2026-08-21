/**
 * Generation slice
 * Tracks the current AI generation request and its status.
 *
 * Upload state (added Task 2):
 *   uploadStatus  — 'idle' | 'uploading' | 'success' | 'error'
 *   uploadedFile  — server response file object on success
 *   uploadError   — error message string on failure
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Inputs
  prompt: '',
  existingCode: '',
  architectureFlow: '',
  pageName: '',

  // Upload state (Task 2)
  uploadStatus: 'idle',     // 'idle' | 'uploading' | 'success' | 'error'
  uploadedWireframePath: null, // local filename from server on success
  uploadedFile: null,       // full server file metadata object { filename, originalName, mimetype, size, url }
  uploadError: null,        // error message string

  // Generation status (future AI task)
  status: 'idle',           // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // Result
  result: null,             // UIPage object when generation succeeds
};

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    // ── Text inputs ────────────────────────────────────────────────────────────
    setPrompt: (state, action) => { state.prompt = action.payload; },
    setExistingCode: (state, action) => { state.existingCode = action.payload; },
    setArchitectureFlow: (state, action) => { state.architectureFlow = action.payload; },
    setPageName: (state, action) => { state.pageName = action.payload; },

    // ── Upload actions (Task 2) ───────────────────────────────────────────────
    setUploadStatus: (state, action) => { state.uploadStatus = action.payload; },
    setUploadedWireframePath: (state, action) => { state.uploadedWireframePath = action.payload; },
    setUploadedFile: (state, action) => { state.uploadedFile = action.payload; },
    setUploadError: (state, action) => { state.uploadError = action.payload; },

    /** Called when user picks a new file — resets prior upload result */
    clearUpload: (state) => {
      state.uploadStatus = 'idle';
      state.uploadedWireframePath = null;
      state.uploadedFile = null;
      state.uploadError = null;
    },

    // ── Generation status ─────────────────────────────────────────────────────
    setStatus: (state, action) => { state.status = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    setResult: (state, action) => { state.result = action.payload; },

    resetGeneration: () => initialState,
  },
});

export const {
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
  resetGeneration,
} = generationSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectGeneration = (state) => state.generation;
export const selectGenerationStatus = (state) => state.generation.status;
export const selectGenerationResult = (state) => state.generation.result;
export const selectGenerationError = (state) => state.generation.error;

// Upload selectors (Task 2)
export const selectUploadStatus = (state) => state.generation.uploadStatus;
export const selectUploadedFile = (state) => state.generation.uploadedFile;
export const selectUploadError = (state) => state.generation.uploadError;

export default generationSlice.reducer;

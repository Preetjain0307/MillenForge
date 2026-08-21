/**
 * Generation slice
 * Tracks the current AI generation request and its status.
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Inputs
  prompt: '',
  existingCode: '',
  architectureFlow: '',
  uploadedWireframePath: null,
  pageName: '',

  // Status
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // Result
  result: null, // UIPage object when generation succeeds
};

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    setPrompt: (state, action) => { state.prompt = action.payload; },
    setExistingCode: (state, action) => { state.existingCode = action.payload; },
    setArchitectureFlow: (state, action) => { state.architectureFlow = action.payload; },
    setUploadedWireframePath: (state, action) => { state.uploadedWireframePath = action.payload; },
    setPageName: (state, action) => { state.pageName = action.payload; },
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
  setUploadedWireframePath,
  setPageName,
  setStatus,
  setError,
  setResult,
  resetGeneration,
} = generationSlice.actions;

// Selectors
export const selectGeneration = (state) => state.generation;
export const selectGenerationStatus = (state) => state.generation.status;
export const selectGenerationResult = (state) => state.generation.result;
export const selectGenerationError = (state) => state.generation.error;

export default generationSlice.reducer;

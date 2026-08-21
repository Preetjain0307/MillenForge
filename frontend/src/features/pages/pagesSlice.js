/**
 * Pages slice
 * Tracks page/section/element data for preview and future editor.
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pages: {},        // { [pageName]: UIPage }
  activePage: null, // name of currently previewed page
  status: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const pagesSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {
    setPage: (state, action) => {
      const { pageName, data } = action.payload;
      state.pages[pageName] = data;
    },
    setActivePage: (state, action) => { state.activePage = action.payload; },
    removePage: (state, action) => { delete state.pages[action.payload]; },
    setPagesStatus: (state, action) => { state.status = action.payload; },
    setPagesError: (state, action) => { state.error = action.payload; },
    clearPages: (state) => { state.pages = {}; state.activePage = null; },
  },
});

export const {
  setPage,
  setActivePage,
  removePage,
  setPagesStatus,
  setPagesError,
  clearPages,
} = pagesSlice.actions;

// Selectors
export const selectAllPages = (state) => state.pages.pages;
export const selectActivePage = (state) => state.pages.activePage;
export const selectPageByName = (pageName) => (state) => state.pages.pages[pageName];
export const selectPagesStatus = (state) => state.pages.status;

export default pagesSlice.reducer;

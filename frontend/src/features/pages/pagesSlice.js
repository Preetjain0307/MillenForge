/**
 * Pages slice
 * Tracks page/section/element data for preview and CMS content editor.
 */
import { createSlice } from '@reduxjs/toolkit';
import { updateElementContent, updateRepeatingItem, findElementById } from '../../types/cms.js';

const initialState = {
  pages: {},                  // { [pageName]: UIPage }
  activePage: null,           // name of currently previewed page
  selectedElementId: null,    // stable ID of currently selected element for CMS editing
  status: 'idle',             // 'idle' | 'loading' | 'succeeded' | 'failed'
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
    setActivePage: (state, action) => {
      state.activePage = action.payload;
    },
    removePage: (state, action) => {
      delete state.pages[action.payload];
      if (state.activePage === action.payload) {
        state.activePage = null;
        state.selectedElementId = null;
      }
    },
    setPagesStatus: (state, action) => {
      state.status = action.payload;
    },
    setPagesError: (state, action) => {
      state.error = action.payload;
    },
    clearPages: (state) => {
      state.pages = {};
      state.activePage = null;
      state.selectedElementId = null;
    },

    // ─── CMS Selection & Content Update Reducers ─────────────────────────
    setSelectedElementId: (state, action) => {
      state.selectedElementId = action.payload;
    },
    selectElement: (state, action) => {
      state.selectedElementId = action.payload;
    },
    clearSelectedElement: (state) => {
      state.selectedElementId = null;
    },
    updateElement: (state, action) => {
      const { pageName, elementId, newContent } = action.payload;
      const targetPageName = pageName || state.activePage;
      if (targetPageName && state.pages[targetPageName]) {
        state.pages[targetPageName] = updateElementContent(
          state.pages[targetPageName],
          elementId,
          newContent
        );
      }
    },
    updateRepeatingItemInPage: (state, action) => {
      const { pageName, elementId, itemId, updatedItem } = action.payload;
      const targetPageName = pageName || state.activePage;
      if (targetPageName && state.pages[targetPageName]) {
        state.pages[targetPageName] = updateRepeatingItem(
          state.pages[targetPageName],
          elementId,
          itemId,
          updatedItem
        );
      }
    },
  },
});

export const {
  setPage,
  setActivePage,
  removePage,
  setPagesStatus,
  setPagesError,
  clearPages,
  setSelectedElementId,
  selectElement,
  clearSelectedElement,
  updateElement,
  updateRepeatingItemInPage,
} = pagesSlice.actions;

// Selectors
export const selectAllPages = (state) => state.pages.pages;
export const selectActivePage = (state) => state.pages.activePage;
export const selectPageByName = (pageName) => (state) => state.pages.pages[pageName];
export const selectPagesStatus = (state) => state.pages.status;
export const selectSelectedElementId = (state) => state.pages.selectedElementId;

/**
 * Selects an element by its ID from a specific page name.
 * @param {string} pageName
 * @param {string} elementId
 */
export const selectElementById = (pageName, elementId) => (state) => {
  const page = state.pages.pages[pageName];
  return findElementById(page, elementId);
};

/**
 * Selects the currently active selected element from the active page.
 */
export const selectActiveSelectedElement = (state) => {
  const activePageName = state.pages.activePage;
  const activePage = activePageName ? state.pages.pages[activePageName] : null;
  const selectedId = state.pages.selectedElementId;
  return findElementById(activePage, selectedId);
};

export default pagesSlice.reducer;

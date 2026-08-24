/**
 * NeuraMinds — Redux Store
 *
 * Combines all feature slices into the root store.
 * Add new slices here as the application grows.
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import generationReducer from '../features/generation/generationSlice';
import uiReducer from '../features/ui/uiSlice';
import pagesReducer from '../features/pages/pagesSlice';
import themeReducer from '../features/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generation: generationReducer,
    ui: uiReducer,
    pages: pagesReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in upload actions (File objects)
        ignoredActions: ['generation/setUploadedWireframePath'],
      },
    }),
});

export default store;

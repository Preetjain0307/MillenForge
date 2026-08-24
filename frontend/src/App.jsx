/**
 * NeuraMindss App — Root component with routing and Auth restoration
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser } from './features/auth/authSlice';

import AppShell from './components/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';

import WorkspacePage from './pages/WorkspacePage';
import LandingPage from './pages/LandingPage';
import GeneratePage from './pages/GeneratePage';
import PreviewPage from './pages/PreviewPage';
import HistoryPage from './pages/HistoryPage';
import DiagramsPage from './pages/DiagramsPage';
import IntelligencePage from './pages/IntelligencePage';
import ReviewPage from './pages/ReviewPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import UIRendererTestPage from './pages/UIRendererTestPage';
import CmsEditorTestPage from './pages/CmsEditorTestPage';

function App() {
  const dispatch = useDispatch();
  const { theme, brand } = useSelector((state) => state.theme);

  useEffect(() => {
    // Restore session on application launch
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme?.colors) {
      root.style.setProperty('--nm-bg-primary', theme.colors.background || '#0a0a0f');
      root.style.setProperty('--nm-text-primary', theme.colors.text || '#e8e8f0');
      root.style.setProperty('--nm-primary', theme.colors.primary || brand?.primaryColor || '#6c63ff');
    } else {
      root.style.setProperty('--nm-primary', brand?.primaryColor || '#6c63ff');
    }
  }, [theme, brand]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[var(--nm-bg-primary)]">
        <AppShell />
        <Routes>
          {/* Public Auth & Marketing Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Standard Workspace & App Routes */}
          <Route path="/" element={<WorkspacePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/home" element={<WorkspacePage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/diagrams" element={<DiagramsPage />} />
          <Route path="/preview/:pageName" element={<PreviewPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/history" element={<HistoryPage />} />

          {/* Protected User Account Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Dev-only renderer test page */}
          <Route path="/renderer-test" element={<UIRendererTestPage />} />
          {/* Dev-only CMS editor test page */}
          <Route path="/cms-editor-test" element={<CmsEditorTestPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

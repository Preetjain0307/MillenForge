/**
 * NeuraMind App — Root component with routing
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppShell from './components/AppShell';
import WorkspacePage from './pages/WorkspacePage';
import LandingPage from './pages/LandingPage';
import GeneratePage from './pages/GeneratePage';
import PreviewPage from './pages/PreviewPage';
import HistoryPage from './pages/HistoryPage';
import DiagramsPage from './pages/DiagramsPage';
import IntelligencePage from './pages/IntelligencePage';
import ReviewPage from './pages/ReviewPage';
import NotFoundPage from './pages/NotFoundPage';
import UIRendererTestPage from './pages/UIRendererTestPage';
import CmsEditorTestPage from './pages/CmsEditorTestPage';

function App() {
  const { theme, brand } = useSelector(state => state.theme);

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
          <Route path="/" element={<WorkspacePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/home" element={<WorkspacePage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/diagrams" element={<DiagramsPage />} />
          <Route path="/preview/:pageName" element={<PreviewPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/history" element={<HistoryPage />} />
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

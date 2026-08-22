/**
 * NeuraMind App — Root component with routing
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import GeneratePage from './pages/GeneratePage';
import PreviewPage from './pages/PreviewPage';
import HistoryPage from './pages/HistoryPage';
import DiagramsPage from './pages/DiagramsPage';
import NotFoundPage from './pages/NotFoundPage';
import UIRendererTestPage from './pages/UIRendererTestPage';
import CmsEditorTestPage from './pages/CmsEditorTestPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[var(--nm-bg-primary)]">
        <AppShell />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/diagrams" element={<DiagramsPage />} />
          <Route path="/preview/:pageName" element={<PreviewPage />} />
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

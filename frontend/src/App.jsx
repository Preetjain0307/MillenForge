/**
 * NeuraMind App — Root component with routing
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import GeneratePage from './pages/GeneratePage';
import PreviewPage from './pages/PreviewPage';
import NotFoundPage from './pages/NotFoundPage';
import UIRendererTestPage from './pages/UIRendererTestPage';
import CmsEditorTestPage from './pages/CmsEditorTestPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[var(--nm-bg-primary)]">
        <AppShell />
        <Routes>
          {/* Redirect root to /generate */}
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/preview/:pageName" element={<PreviewPage />} />
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

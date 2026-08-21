/**
 * NeuraMind App — Root component with routing
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import GeneratePage from './pages/GeneratePage';
import PreviewPage from './pages/PreviewPage';
import NotFoundPage from './pages/NotFoundPage';

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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

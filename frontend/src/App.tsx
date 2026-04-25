import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { DebugPage } from '@/pages/DebugPage';
import { LandingPage } from '@/pages/LandingPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { ToastProvider } from '@/components/ui/Toast';
import { isDebugRouteEnabled } from '@/core/debug/availability';
import { PdfDocProvider } from '@/core/session/PdfDocContext';

const AppContent = () => {
  useKeyboardShortcuts();
  useUnsavedChangesGuard();
  const debugEnabled = isDebugRouteEnabled(window.location.hostname, import.meta.env.DEV);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/workspace" element={<WorkspacePage />} />
      <Route path="/debug" element={debugEnabled ? <DebugPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <PdfDocProvider>
        <AppContent />
        <ToastProvider />
      </PdfDocProvider>
    </BrowserRouter>
  );
}

export default App;

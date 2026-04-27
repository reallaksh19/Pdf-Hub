import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { emitStartupLog } from '@/core/logger/service';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

emitStartupLog('static', '0.0.0', navigator.userAgent);

PdfRendererAdapter.configureWorker({
  workerSrc,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
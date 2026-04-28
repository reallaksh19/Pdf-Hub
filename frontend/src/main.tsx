import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';

// Configure PDF.js worker precisely once at startup
PdfRendererAdapter.configureWorker({
  workerSrc: new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString(),
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { emitStartupLog } from '@/core/logger/service';

emitStartupLog('static', '0.0.0', navigator.userAgent);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';

import { emitStartupLog } from '@/core/logger/service';

emitStartupLog('static', '0.0.0', navigator.userAgent);
PdfRendererAdapter.configureWorker({ workerSrc });


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
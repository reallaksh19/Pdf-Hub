import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { emitStartupLog } from '@/core/logger/service';

// Register all annotation renderers exactly once at startup
import './core/annotations/register-all';

emitStartupLog('static', '0.0.0', navigator.userAgent);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
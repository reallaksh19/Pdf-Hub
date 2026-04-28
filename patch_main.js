const fs = require('fs');
const path = 'frontend/src/main.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('PdfRendererAdapter.configureWorker')) {
  const insertIndex = content.indexOf("ReactDOM.createRoot");
  const newText = `import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';\n\n// Configure PDF.js worker precisely once at startup\nPdfRendererAdapter.configureWorker({\n  workerSrc: new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString(),\n});\n\n`;
  content = content.substring(0, insertIndex) + newText + content.substring(insertIndex);
  fs.writeFileSync(path, content);
}

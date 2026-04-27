with open('frontend/src/main.tsx', 'r') as f:
    content = f.read()

import_statement = "import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';\nimport { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';\n"
configure_statement = "\nPdfRendererAdapter.configureWorker({ workerSrc });\n"

if 'PdfRendererAdapter.configureWorker' not in content:
    content = content.replace("import App from './App.tsx';", "import App from './App.tsx';\n" + import_statement)
    content = content.replace("emitStartupLog('static', '0.0.0', navigator.userAgent);", "emitStartupLog('static', '0.0.0', navigator.userAgent);" + configure_statement)

with open('frontend/src/main.tsx', 'w') as f:
    f.write(content)

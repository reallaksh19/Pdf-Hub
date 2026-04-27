import re

with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'r') as f:
    content = f.read()

# Fix 1: remove unused imports
content = content.replace("import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';", "")
content = content.replace("import { debug, error } from '@/core/logger/service';", "import { error } from '@/core/logger/service';")

# Fix 2: Add canvas property to renderTask
content = content.replace("""    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      optionalContentConfigPromise: page.getOptionalContentConfig(),
      annotationMode: options.annotationMode,
    });""", """    const renderTask = page.render({
      canvas,
      canvasContext: ctx,
      viewport,
      optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as any).getOptionalContentConfig() : undefined,
      annotationMode: options.annotationMode,
    });""")

with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'w') as f:
    f.write(content)

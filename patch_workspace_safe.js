const fs = require('fs');

const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update imports
if (!content.includes('usePageRenderer')) {
  content = content.replace(
    "import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';",
    "import { usePageRenderer } from '@/core/renderer/usePageRenderer';"
  );
}

// Strip out global worker setup
content = content.replace("import * as pdfjsLib from 'pdfjs-dist';\n", "");
content = content.replace("pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(\n  'pdfjs-dist/build/pdf.worker.min.js',\n  import.meta.url,\n).toString();\n", "");

const hookString = `  // Render the PDF page to the canvas
  const { size } = usePageRenderer({ doc, pageNumber, scale, canvasRef });

  useEffect(() => {
    if (size) {
      setPageSize(size);
    }
  }, [size]);`;


// Replace the old render effect
const effectStartMarker = "  // Render the PDF page to the canvas\n  useEffect(() => {\n    let cancelled = false;\n\n    const render = async () => {\n      if (!doc || !canvasRef.current) return;\n\n      try {\n        const page = await doc.getPage(pageNumber);\n        if (cancelled) return;\n\n        const viewport = page.getViewport({ scale });\n        setPageSize({ width: viewport.width, height: viewport.height });\n\n        const canvas = canvasRef.current;\n        if (!canvas) return;\n\n        PdfRendererAdapter.renderPage(page, canvas, viewport, {\n          annotationMode: 0, // Disable built-in annotations\n        });\n      } catch (err) {\n        console.error('Failed to render page:', err);\n      }\n    };\n\n    render();\n\n    return () => {\n      cancelled = true;\n    };\n  }, [doc, pageNumber, scale, annotations, selectedAnnotationIds]);";

if (content.includes(effectStartMarker)) {
    content = content.replace(effectStartMarker, hookString);
}

// Add the data-page attribute
content = content.replace(
  '<div\n        key={index}',
  '<div\n        key={index}\n        data-page={index + 1}'
);

fs.writeFileSync(path, content);

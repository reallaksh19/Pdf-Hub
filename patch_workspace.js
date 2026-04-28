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

// Strip out global worker setup inside workspace
content = content.replace(/import \* as pdfjsLib from 'pdfjs-dist';\n*pdfjsLib\.GlobalWorkerOptions\.workerSrc = new URL\(\n\s*'pdfjs-dist\/build\/pdf\.worker\.min\.js',\n\s*import\.meta\.url,\n\)\.toString\(\);\n/, "");

// Replace the inner workings of PageSurface to use the new hook
const targetStart = "  // Render the PDF page to the canvas";
const targetEnd = "  }, [doc, pageNumber, scale, annotations, selectedAnnotationIds]);";

const startIndex = content.indexOf(targetStart);
if (startIndex !== -1) {
  const endIndex = content.indexOf(targetEnd) + targetEnd.length;
  if (endIndex !== -1) {
    const replacement = `  // Render the PDF page to the canvas
  const { size } = usePageRenderer({ doc, pageNumber, scale, canvasRef });

  useEffect(() => {
    if (size) {
      setPageSize(size);
    }
  }, [size]);`;
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  }
}

// Add the data-page attribute for the status bar intersection observer
content = content.replace(
  '<div\n        key={index}',
  '<div\n        key={index}\n        data-page={index + 1}'
);


fs.writeFileSync(path, content);

const fs = require('fs');

const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('usePageRenderer')) {
  content = content.replace(
    "import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';",
    "import { usePageRenderer } from '@/core/renderer/usePageRenderer';"
  );
}

// Find PageSurface render block
const effectStartMarker = "  // Render the PDF page to the canvas";
const effectEndMarker = "  }, [doc, pageNumber, scale, annotations, selectedAnnotationIds]);";

const startIndex = content.indexOf(effectStartMarker);
const endIndex = content.indexOf(effectEndMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const hookString = `  // Render the PDF page to the canvas
  const { size } = usePageRenderer({ doc, pageNumber, scale, canvasRef });

  useEffect(() => {
    if (size) {
      setPageSize(size);
    }
  }, [size]);

`;
    content = content.substring(0, startIndex) + hookString + content.substring(endIndex + effectEndMarker.length);
}

// Add the data-page attribute
content = content.replace(
  '<div\n        key={index}',
  '<div\n        key={index}\n        data-page={index + 1}'
);

fs.writeFileSync(path, content);

const fs = require('fs');

const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix DocumentWorkspace.tsx(498,51): error TS2345: Argument of type 'number' is not assignable to parameter of type 'HTMLCanvasElement'.
// It seems `usePageRenderer({ doc, pageNumber, scale, canvasRef });` wasn't replacing the whole old effect block correctly or left an old render call somewhere.
content = content.replace("PdfRendererAdapter.renderPage(page, canvas, viewport);", "");
content = content.replace("PdfRendererAdapter.renderPage(page, canvas, viewport, {", "");
content = content.replace("  annotationMode: 0, // Disable built-in annotations", "");
content = content.replace("});", "");

fs.writeFileSync(path, content);

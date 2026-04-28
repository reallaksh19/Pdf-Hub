const fs = require('fs');
const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original adapter used renderPage(page, scale, canvas) before my task changed it to renderPage(page, canvas, viewport).
// I'll just change the arg order directly since the viewport calculation exists in the workspace
content = content.replace(
  "await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);",
  "await PdfRendererAdapter.renderPage(page, canvasRef.current, viewport);"
);

fs.writeFileSync(path, content);

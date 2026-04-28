const fs = require('fs');
const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { usePageRenderer }')) {
  content = content.replace("import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';", "import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';\nimport { usePageRenderer } from '@/core/renderer/usePageRenderer';");
}

// Fix size redeclaration by removing original state size and letting hook provide it, but original code used setSize.
// Original code had `const [size, setSize] = React.useState<PageSize>({ width: 0, height: 0 });`
content = content.replace(/const \[size, setSize\] = React.useState<PageSize>\(\{ width: 0, height: 0 \}\);/, "");
content = content.replace(/const \{ size \} = usePageRenderer\(\{ doc, pageNumber, scale, canvasRef \}\);\n\n  React\.useEffect\(\(\) => \{\n    if \(size\) setSize\(size\);\n  \}, \[size\]\);/, "const { size: rendererSize } = usePageRenderer({ doc, pageNumber, scale, canvasRef });\n  const size = rendererSize || { width: 0, height: 0 };");

fs.writeFileSync(path, content);

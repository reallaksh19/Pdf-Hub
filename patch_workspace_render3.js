const fs = require('fs');
const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';", "import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';\nimport { usePageRenderer } from '@/core/renderer/usePageRenderer';");


const oldRenderBlockStart = "  React.useEffect(() => {\n    let cancelled = false;\n\n    const render = async () => {\n      const page = await doc.getPage(pageNumber);\n      const viewport = page.getViewport({ scale });\n\n      if (!cancelled) {\n        setSize({ width: viewport.width, height: viewport.height });\n      }\n\n      if (!cancelled && canvasRef.current) {\n        await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);\n      }\n\n      const items = await PdfRendererAdapter.getPageTextItems(page, scale);\n      if (!cancelled) {\n        setTextItems(items);\n      }\n    };\n\n    void render();\n\n    return () => {\n      cancelled = true;\n    };\n  }, [doc, pageNumber, scale]);";

const newRenderBlock = `  const { size: hookSize } = usePageRenderer({ doc, pageNumber, scale, canvasRef });

  React.useEffect(() => {
    if (hookSize) setSize(hookSize);
  }, [hookSize]);

  React.useEffect(() => {
    let cancelled = false;

    const loadText = async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;

        const items = await PdfRendererAdapter.getPageTextItems(page, scale);
        if (!cancelled) setTextItems(items);
      } catch (err) {
        console.error('Failed to load text layer:', err);
      }
    };

    void loadText();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);`;

content = content.replace(oldRenderBlockStart, newRenderBlock);

content = content.replace(
  '<div\n        key={index}',
  '<div\n        key={index}\n        data-page={index + 1}'
);

fs.writeFileSync(path, content);

const fs = require('fs');
const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldRenderBlockStart = "  React.useEffect(() => {\n    let cancelled = false;\n\n    const render = async () => {\n      const page = await doc.getPage(pageNumber);\n      const viewport = page.getViewport({ scale });\n\n      if (!cancelled) {\n        setSize({ width: viewport.width, height: viewport.height });\n      }\n\n      if (!cancelled && canvasRef.current) {\n        await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);\n      }\n\n      const items = await PdfRendererAdapter.getPageTextItems(page, scale);\n      if (!cancelled) {\n        setTextItems(items);\n      }\n    };\n\n    void render();\n\n    return () => {\n      cancelled = true;\n    };\n  }, [doc, pageNumber, scale]);";

const newRenderBlock = `  const { size } = usePageRenderer({ doc, pageNumber, scale, canvasRef });

  React.useEffect(() => {
    if (size) setSize(size);
  }, [size]);

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

if (content.includes(oldRenderBlockStart)) {
    content = content.replace(oldRenderBlockStart, newRenderBlock);
} else {
    // fallback exact match
    content = content.replace("        await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);", "");
}

fs.writeFileSync(path, content);

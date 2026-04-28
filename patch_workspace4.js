const fs = require('fs');

const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// There is a second copy of the old render loop that `patch_workspace3.js` missed due to string mismatches.
const effectStartMarker2 = "  useEffect(() => {\n    let cancelled = false;\n\n    const loadPage = async () => {";
const effectEndMarker2 = "  }, [doc, pageNumber, scale]);";

const idxStart = content.indexOf(effectStartMarker2);
const idxEnd = content.indexOf(effectEndMarker2);

if (idxStart !== -1 && idxEnd !== -1) {
    const replacement = `  const { size } = usePageRenderer({ doc, pageNumber, scale, canvasRef });

  useEffect(() => {
    if (size) setSize(size);
  }, [size]);

  useEffect(() => {
    let cancelled = false;

    const loadText = async () => {
      if (!doc) return;
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;

        const items = await PdfRendererAdapter.getPageTextItems(page, scale);
        if (!cancelled) setTextItems(items);
      } catch (err) {
        console.error('Failed to load text layer:', err);
      }
    };
    loadText();
    return () => { cancelled = true; };
  }, [doc, pageNumber, scale]);`;

    content = content.substring(0, idxStart) + replacement + content.substring(idxEnd + effectEndMarker2.length);
}

fs.writeFileSync(path, content);

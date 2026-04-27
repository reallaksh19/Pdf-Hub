with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

# Add workspaceRef prop to DocumentWorkspace
content = content.replace(
    'export const DocumentWorkspace: React.FC = () => {',
    'export const DocumentWorkspace: React.FC<{ workspaceRef?: React.RefObject<HTMLDivElement | null> }> = ({ workspaceRef }) => {'
)

# Connect workspaceRef
content = content.replace(
    'ref={containerRef}',
    'ref={(node) => {\n        containerRef.current = node;\n        if (workspaceRef) {\n          if (typeof workspaceRef === \'function\') workspaceRef(node);\n          else workspaceRef.current = node;\n        }\n      }}'
)

# Replace useEffect with usePageRenderer inside PageSurface
import_statement = "import { usePageRenderer } from '@/core/renderer/usePageRenderer';\n"
content = content.replace("import { useReviewStore } from '@/core/review/store';", "import { useReviewStore } from '@/core/review/store';\n" + import_statement)

# Now update the PageSurface content
page_surface_render = """  const { size: renderSize, isRendering } = usePageRenderer({
    doc,
    pageNumber,
    scale,
    canvasRef,
  });

  React.useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const page = await doc.getPage(pageNumber);
      if (!cancelled) {
        const viewport = page.getViewport({ scale });
        setSize({ width: viewport.width, height: viewport.height });
      }

      const items = await PdfRendererAdapter.getPageTextItems(page, scale);
      if (!cancelled) {
        setTextItems(items);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);"""

# Extract and replace the exact useEffect for rendering in PageSurface
content = content.replace("""  React.useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      if (!cancelled) {
        setSize({ width: viewport.width, height: viewport.height });
      }

      if (!cancelled && canvasRef.current) {
        await PdfRendererAdapter.renderPage(page, canvasRef.current, viewport).completed;
      }

      const items = await PdfRendererAdapter.getPageTextItems(page, scale);
      if (!cancelled) {
        setTextItems(items);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);""", page_surface_render)

# Add data-page attribute to the PageSurface container
content = content.replace(
    '<div\n      ref={pageRef}',
    '<div\n      ref={pageRef}\n      data-page={pageNumber}'
)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

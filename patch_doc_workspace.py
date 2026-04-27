with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);',
    'await PdfRendererAdapter.renderPage(page, canvasRef.current, viewport).completed;'
)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

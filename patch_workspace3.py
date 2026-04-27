with open('frontend/src/core/renderer/usePageRenderer.ts', 'r') as f:
    content = f.read()
# Let usePageRenderer accept RefObject<HTMLCanvasElement | null> instead
content = content.replace('canvasRef:   React.RefObject<HTMLCanvasElement>;', 'canvasRef:   React.RefObject<HTMLCanvasElement | null>;')
with open('frontend/src/core/renderer/usePageRenderer.ts', 'w') as f:
    f.write(content)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

# isRendering is not used, remove it
content = content.replace("const { size: renderSize, isRendering } = usePageRenderer({", "const { size: renderSize } = usePageRenderer({")

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

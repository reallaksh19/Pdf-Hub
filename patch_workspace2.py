import re
with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

# Fix workspaceRef typeof function
content = content.replace("if (typeof workspaceRef === 'function') workspaceRef(node);", "if (typeof workspaceRef === 'function') (workspaceRef as any)(node);")

# Use renderSize or fallback to size
content = content.replace("style={{ width: size.width, minHeight: size.height }}", "style={{ width: renderSize?.width || size.width, minHeight: renderSize?.height || size.height }}")
content = content.replace("const pageWidth = size.width / scale;", "const pageWidth = (renderSize?.width || size.width) / scale;")
content = content.replace("const pageHeight = size.height / scale;", "const pageHeight = (renderSize?.height || size.height) / scale;")

# Fix canvasRef typing
content = content.replace("const canvasRef = React.useRef<HTMLCanvasElement | null>(null);", "const canvasRef = React.useRef<HTMLCanvasElement>(null);")

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

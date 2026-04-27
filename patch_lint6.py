with open('frontend/src/core/renderer/usePageRenderer.ts', 'r') as f:
    content = f.read()

content = content.replace("        console.error('[usePageRenderer] Render error:', err);", "        // console.error('[usePageRenderer] Render error:', err);")
with open('frontend/src/core/renderer/usePageRenderer.ts', 'w') as f:
    f.write(content)

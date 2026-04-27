with open('frontend/src/core/annotations/registry.ts', 'r') as f:
    content = f.read()
content = content.replace("      console.warn(`[AnnotationRendererRegistry] Overwriting renderer for type '${type}'`);", "      // console.warn(`[AnnotationRendererRegistry] Overwriting renderer for type '${type}'`);")
with open('frontend/src/core/annotations/registry.ts', 'w') as f:
    f.write(content)

with open('frontend/src/core/macro/registry.ts', 'r') as f:
    content = f.read()
content = content.replace("      console.warn(`[MacroStepRegistry] Overwriting handler for step type '${type}'`);", "      // console.warn(`[MacroStepRegistry] Overwriting handler for step type '${type}'`);")
with open('frontend/src/core/macro/registry.ts', 'w') as f:
    f.write(content)

with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'r') as f:
    content = f.read()
content = content.replace("        const rectWidth = step.width;", "        { const rectWidth = step.width;")
content = content.replace("        break;", "        break; }")
with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'w') as f:
    f.write(content)

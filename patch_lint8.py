with open('frontend/src/core/annotations/registry.ts', 'r') as f:
    content = f.read()
content = content.replace("console.warn", "// console.warn")
with open('frontend/src/core/annotations/registry.ts', 'w') as f:
    f.write(content)

with open('frontend/src/core/macro/registry.ts', 'r') as f:
    content = f.read()
content = content.replace("console.warn", "// console.warn")
with open('frontend/src/core/macro/registry.ts', 'w') as f:
    f.write(content)

with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'r') as f:
    content = f.read()
# Let's fix the block issue using proper replacement
content = content.replace("case 'place_image':\n        const rectWidth = step.width;\n        const rectHeight = step.height ?? (img.height / img.width) * rectWidth;\n\n        return {\n          id: step.id,\n          op: 'place_image',\n          x: Math.max(0, step.x),\n          y: Math.max(0, step.y),\n          width: rectWidth,\n          height: rectHeight,\n          src: step.src,\n          opacity: step.opacity,\n        };\n\n      case 'place_watermark':", "case 'place_image': {\n        const rectWidth = step.width;\n        const rectHeight = step.height ?? (img.height / img.width) * rectWidth;\n\n        return {\n          id: step.id,\n          op: 'place_image',\n          x: Math.max(0, step.x),\n          y: Math.max(0, step.y),\n          width: rectWidth,\n          height: rectHeight,\n          src: step.src,\n          opacity: step.opacity,\n        };\n      }\n\n      case 'place_watermark':")
with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'w') as f:
    f.write(content)

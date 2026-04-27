with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'r') as f:
    content = f.read()

# I messed up the block wrap before
# Let's just find "case 'place_image':" and wrap it in {} completely
# since return breaks anyway

content = content.replace("""case 'place_image':
        { const rectWidth = step.width;
        const rectHeight = step.height ?? (img.height / img.width) * rectWidth;

        return {
          id: step.id,
          op: 'place_image',
          x: Math.max(0, step.x),
          y: Math.max(0, step.y),
          width: rectWidth,
          height: rectHeight,
          src: step.src,
          opacity: step.opacity,
        };
        break; }""", """case 'place_image': {
        const rectWidth = step.width;
        const rectHeight = step.height ?? (img.height / img.width) * rectWidth;

        return {
          id: step.id,
          op: 'place_image',
          x: Math.max(0, step.x),
          y: Math.max(0, step.y),
          width: rectWidth,
          height: rectHeight,
          src: step.src,
          opacity: step.opacity,
        };
      }""")

with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'w') as f:
    f.write(content)

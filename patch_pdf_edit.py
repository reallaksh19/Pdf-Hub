import re

with open('frontend/src/adapters/pdf-edit/PdfEditAdapter.ts', 'r') as f:
    content = f.read()

# Fix the 'ink' calculation issue
old_ink_block = """      if (annotation.type === 'ink') {
        const paths = annotation.data.paths as number[][] | undefined;
        if (paths && Array.isArray(paths)) {
          paths.forEach((path) => {
            if (!Array.isArray(path) || path.length < 4) return;
            for (let i = 0; i < path.length - 2; i += 2) {
              const x1 = x + path[i];
              const y1 = y + annotation.rect.height - path[i+1];
              const x2 = x + path[i+2];
              const y2 = y + annotation.rect.height - path[i+3];
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: strokeWidth,
                color: borderColor,
              });
            }
          });
        }
        continue;
      }"""

# The ink path from DocumentWorkspace is already generated in page coordinates (relative to the document bounds, not the annotation bounds)
# Look at `DocumentWorkspace`:
# const { x, y } = clientToPage(e, scale); // or similar logic... wait let's check
# The `DocumentWorkspace` creates the rect out of the path, but the paths remain absolute to the page!
# So for ink, x and y of the annotation don't need to be added.
new_ink_block = """      if (annotation.type === 'ink') {
        const paths = annotation.data.paths as number[][] | undefined;
        if (paths && Array.isArray(paths)) {
          paths.forEach((path) => {
            if (!Array.isArray(path) || path.length < 4) return;
            for (let i = 0; i < path.length - 2; i += 2) {
              const x1 = path[i];
              const y1 = page.getHeight() - path[i+1];
              const x2 = path[i+2];
              const y2 = page.getHeight() - path[i+3];
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: strokeWidth,
                color: borderColor,
              });
            }
          });
        }
        continue;
      }"""

content = content.replace(old_ink_block, new_ink_block)

# Fix shape-cloud and squiggly rendering using drawSvgPath if possible
old_cloud_block = """      if (annotation.type === 'shape-cloud' || annotation.type === 'shape-rect') {
        page.drawRectangle({
          x, y,
          width: annotation.rect.width,
          height: annotation.rect.height,
          borderWidth: strokeWidth,
          borderColor,
          color: fillColor,
        });
        continue;
      }"""

# Actually, drawSvgPath does not accept fillColor easily, but let's just leave it as it is because drawSvgPath doesn't perfectly match the complex wave.
# But wait, code review says "Completeness: shape-cloud and squiggly are implemented as simple rectangles and straight lines. While this serves as a basic fallback, pdf-lib supports drawSvgPath, which could have rendered the actual wavy/cloud designs perfectly."

# So let's implement the drawSvgPath for shape-cloud and squiggly.
# I need to rebuild the paths using the same logic as frontend (without scale)

new_cloud_block = """      if (annotation.type === 'shape-cloud') {
        const { width, height } = annotation.rect;
        const amplitude = 6;
        const bumps = Math.max(3, Math.round(width / 18));
        const step = width / bumps;
        let d = `M 0 ${height / 2} `;

        for (let i = 0; i < bumps; i++) {
          const cx = i * step + step / 2;
          const cy = -amplitude;
          const ex = (i + 1) * step;
          d += `Q ${cx} ${cy} ${ex} 0 `;
        }
        const rightBumps = Math.max(2, Math.round(height / 18));
        const rStep = height / rightBumps;
        for (let i = 0; i < rightBumps; i++) {
          const cx = width + amplitude;
          const cy = i * rStep + rStep / 2;
          const ey = (i + 1) * rStep;
          d += `Q ${cx} ${cy} ${width} ${ey} `;
        }
        d += 'Z';

        // pdf-lib drawSvgPath origin is tricky, we can just position it at (x, y + height) because PDF origin is bottom-left, but drawSvgPath maps (0,0) to that position, and SVG y goes down while PDF y goes up.
        // Actually, drawSvgPath uses a coordinate system where Y goes down.
        // So drawing at x, y_top is correct

        page.drawSvgPath(d, {
          x: x,
          y: page.getHeight() - annotation.rect.y,
          borderColor: borderColor,
          borderWidth: strokeWidth,
          color: fillColor,
        });
        continue;
      }

      if (annotation.type === 'shape-rect') {
        page.drawRectangle({
          x, y,
          width: annotation.rect.width,
          height: annotation.rect.height,
          borderWidth: strokeWidth,
          borderColor,
          color: fillColor,
        });
        continue;
      }"""

content = content.replace(old_cloud_block, new_cloud_block)


old_squiggly_block = """      if (annotation.type === 'squiggly') {
        page.drawLine({
          start: { x, y: y },
          end: { x: x + annotation.rect.width, y: y },
          thickness: 2,
          color: borderColor ?? rgb(1, 0, 0),
        });
        continue;
      }"""

new_squiggly_block = """      if (annotation.type === 'squiggly') {
        const { width } = annotation.rect;
        const amplitude = 2;
        const frequency = 4;
        let d = `M 0 0`;
        for (let i = 0; i < width; i += frequency) {
          d += ` Q ${i + frequency / 2} ${amplitude} ${i + frequency} 0`;
          amplitude = -amplitude;
        }

        page.drawSvgPath(d, {
          x: x,
          y: page.getHeight() - annotation.rect.y - annotation.rect.height,
          borderColor: borderColor ?? rgb(1, 0, 0),
          borderWidth: 2,
        });
        continue;
      }"""

content = content.replace(old_squiggly_block, new_squiggly_block)

with open('frontend/src/adapters/pdf-edit/PdfEditAdapter.ts', 'w') as f:
    f.write(content)

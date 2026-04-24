with open("frontend/src/adapters/annotation-canvas/KonvaAdapter.ts", "r") as f:
    content = f.read()

replacement = """      case 'squiggly':
        node = new Konva.Line({
          ...config,
          points: [0, annotation.rect.height, annotation.rect.width, annotation.rect.height],
          stroke: (annotation.data.borderColor as string) || 'red',
          strokeWidth: 2,
          dash: [2, 2] // Simple squiggly representation
        });
        break;
      case 'shape':
      case 'rectangle':
        node = new Konva.Rect({
          ...config,
          stroke: (annotation.data.borderColor as string) || 'red',
          strokeWidth: (annotation.data.borderWidth as number) || 2,
          fill: (annotation.data.backgroundColor as string) || 'transparent',
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 1
        });
        break;
      case 'ellipse':
        node = new Konva.Ellipse({
          ...config,
          radiusX: annotation.rect.width / 2,
          radiusY: annotation.rect.height / 2,
          stroke: (annotation.data.borderColor as string) || 'red',
          strokeWidth: (annotation.data.borderWidth as number) || 2,
          fill: (annotation.data.backgroundColor as string) || 'transparent',
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 1,
          offsetX: -annotation.rect.width / 2, // Konva Ellipse uses center
          offsetY: -annotation.rect.height / 2
        });
        break;
      case 'polygon':
        node = new Konva.Line({
          ...config,
          points: annotation.data.points as number[] || [0,0, annotation.rect.width,0, annotation.rect.width,annotation.rect.height, 0,annotation.rect.height],
          stroke: (annotation.data.borderColor as string) || 'blue',
          fill: (annotation.data.backgroundColor as string) || 'rgba(0,0,255,0.1)',
          strokeWidth: (annotation.data.borderWidth as number) || 1,
          closed: true,
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 1
        });
        break;
      case 'polyline':
        node = new Konva.Line({
          ...config,
          points: annotation.data.points as number[] || [0,0, annotation.rect.width, annotation.rect.height],
          stroke: (annotation.data.borderColor as string) || 'blue',
          strokeWidth: (annotation.data.borderWidth as number) || 1,
          closed: false,
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 1
        });
        break;
      case 'file-attachment':
        node = new Konva.Group({ ...config });
        node.add(new Konva.Rect({ width: 32, height: 32, fill: '#f1f5f9', cornerRadius: 4 }));
        node.add(new Konva.Text({ text: '📎', fontSize: 16, x: 8, y: 8 }));
        break;
      case 'freehand':
      case 'ink':
        node = new Konva.Line({
          ...config,
          points: annotation.data.points as number[],
          stroke: (annotation.data.borderColor as string) || 'black',
          strokeWidth: (annotation.data.borderWidth as number) || 2,
          tension: 0.5
        });
        break;"""

# Need to replace existing case 'shape': and case 'freehand':
start_shape = content.find("      case 'shape':")
if start_shape != -1:
    end_shape = content.find("      case 'line':", start_shape)
    if end_shape != -1:
        content = content[:start_shape] + replacement + "\n" + content[end_shape:]
        print("Success")

with open("frontend/src/adapters/annotation-canvas/KonvaAdapter.ts", "w") as f:
    f.write(content)

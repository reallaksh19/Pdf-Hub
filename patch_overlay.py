import re
with open("frontend/src/components/workspace/AnnotationOverlay.tsx", "r") as f:
    content = f.read()

# Add react-konva imports
import_start = content.find("import { Stage, Layer, Transformer, Rect, Circle, Line, Text, Group } from 'react-konva';")
if import_start != -1:
    content = content.replace("Rect, Circle, Line, Text, Group }", "Rect, Circle, Ellipse, Line, Text, Group }")

# Locate: if (annotation.type === 'shape') {
shape_idx = content.find("if (annotation.type === 'shape') {")
if shape_idx != -1:
    shape_end = content.find("    if (annotation.type === 'freehand'", shape_idx)

    replacement = """
    if (annotation.type === 'shape' || annotation.type === 'rectangle') {
      return (
        <Rect
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={(annotation.data.borderColor as string) || 'red'}
          strokeWidth={(annotation.data.borderWidth as number) || 2}
          fill={(annotation.data.backgroundColor as string) || 'transparent'}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        />
      );
    }

    if (annotation.type === 'ellipse') {
      return (
        <Ellipse
          key={annotation.id}
          id={annotation.id}
          x={x + width / 2}
          y={y + height / 2}
          radiusX={width / 2}
          radiusY={height / 2}
          stroke={(annotation.data.borderColor as string) || 'red'}
          strokeWidth={(annotation.data.borderWidth as number) || 2}
          fill={(annotation.data.backgroundColor as string) || 'transparent'}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        />
      );
    }

    if (annotation.type === 'file-attachment') {
      return (
        <Group
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        >
          <Rect width={32} height={32} fill="#f1f5f9" cornerRadius={4} />
          <Text text="📎" fontSize={16} x={8} y={8} />
        </Group>
      );
    }
"""
    content = content[:shape_idx] + replacement + content[shape_end:]


freehand_idx = content.find("if (annotation.type === 'freehand' || annotation.type === 'line' || annotation.type === 'arrow' || annotation.type === 'underline' || annotation.type === 'strikeout') {")
if freehand_idx != -1:
    content = content.replace("if (annotation.type === 'freehand' || annotation.type === 'line' || annotation.type === 'arrow' || annotation.type === 'underline' || annotation.type === 'strikeout') {", "if (annotation.type === 'freehand' || annotation.type === 'ink' || annotation.type === 'line' || annotation.type === 'arrow' || annotation.type === 'underline' || annotation.type === 'strikeout' || annotation.type === 'squiggly' || annotation.type === 'polygon' || annotation.type === 'polyline') {")

    dash_logic = """<Line
            points={points}
            stroke={(annotation.data.borderColor as string) || 'red'}
            strokeWidth={(annotation.data.borderWidth as number) || 2}
            tension={(annotation.type === 'freehand' || annotation.type === 'ink') ? 0.5 : 0}
            lineCap="round"
            lineJoin="round"
            dash={annotation.type === 'squiggly' ? [2, 2] : undefined}
            closed={annotation.type === 'polygon'}
            fill={annotation.type === 'polygon' ? ((annotation.data.backgroundColor as string) || 'rgba(0,0,255,0.1)') : undefined}
          />"""
    content = re.sub(r"<Line[^>]+/>", dash_logic, content)

with open("frontend/src/components/workspace/AnnotationOverlay.tsx", "w") as f:
    f.write(content)

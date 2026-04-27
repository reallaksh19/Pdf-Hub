with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

import_statement = "import { annotationRegistry } from '../../core/annotations/registry';\n"
if "import { annotationRegistry }" not in content:
    content = content.replace("import { useReviewStore } from '@/core/review/store';", "import { useReviewStore } from '@/core/review/store';\n" + import_statement)


old_annotations_block = """{pageAnnotations.map((annotation) => {
          const selected = selectedAnnotationIds.includes(annotation.id);
          const rect = draftRects[annotation.id] ?? annotation.rect;
          const anchor = readAnchor(annotation, draftAnchors[annotation.id] ?? null);

          if (annotation.type === 'line' || annotation.type === 'arrow') {"""

# Since we want to replace everything down to the end of the map:
import re
# Find the start of the block
start_idx = content.find("{pageAnnotations.map((annotation) => {")
end_idx = content.find("        {marquee && (", start_idx)

new_annotations_block = """{pageAnnotations.map((annotation) => {
          let NodeComponent: React.FC<any>;

          try {
            NodeComponent = annotationRegistry.get(annotation.type);
          } catch (err) {
            console.error(err);
            return (
              <div
                key={annotation.id}
                style={{
                  position: 'absolute',
                  left: annotation.rect.x * scale,
                  top: annotation.rect.y * scale,
                  width: 80, height: 24,
                  background: 'rgba(255,0,0,0.15)',
                  border: '1px dashed red',
                  fontSize: 10, color: 'red',
                  display: 'flex', alignItems: 'center', padding: '0 4px',
                }}
              >
                unknown: {annotation.type}
              </div>
            );
          }

          const selected = selectedAnnotationIds.includes(annotation.id);
          const rawRect = draftRects[annotation.id] ?? annotation.rect;
          const scaledRect = {
            x: rawRect.x * scale,
            y: rawRect.y * scale,
            width: rawRect.width * scale,
            height: rawRect.height * scale,
          };
          const anchor = readAnchor(annotation, draftAnchors[annotation.id] ?? null);

          return (
            <NodeComponent
              key={annotation.id}
              annotation={annotation}
              rect={scaledRect}
              scale={scale}
              isSelected={selected}
              isEditing={editingId === annotation.id}
              editingValue={editingValue}
              onSelect={(event: React.PointerEvent<HTMLDivElement>) => {
                event.stopPropagation();
                clearTextSelectionDraft();
                if (event.metaKey || event.ctrlKey) {
                  onToggleSelection(annotation.id);
                } else {
                  onSetSingleSelection(annotation.id);
                }
              }}
              onTransformStart={(event: React.PointerEvent<HTMLDivElement>, mode: 'move' | 'resize') => startTransform(event, annotation, mode)}
              onDoubleClick={() => {
                if (annotation.data?.locked === true) return;
                setEditingId(annotation.id);
                setEditingValue(readText(annotation));
              }}
              onCommitEdit={(v: string) => commitTextEdit(annotation, v)}
              {...(annotation.type === 'callout' ? {
                anchorPoint: anchor,
                onAnchorDragStart: (event: React.PointerEvent<SVGCircleElement>) => startAnchorDrag(event, annotation),
              } : {})}
            />
          );
        })}
"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_annotations_block + content[end_idx:]

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

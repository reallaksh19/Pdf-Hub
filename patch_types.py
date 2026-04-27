with open('frontend/src/core/annotations/types.ts', 'r') as f:
    content = f.read()

# Add missing properties to AnnotationNodeProps
props = """
export interface AnnotationNodeProps<T extends AnnotationType = AnnotationType> {
  annotation: PdfAnnotation & { type: T };
  rect: Rect;
  scale: number;
  isSelected: boolean;
  isEditing?: boolean;
  editingValue?: string;
  onSelect: (e: React.PointerEvent<HTMLDivElement>) => void;
  onTransformStart: (e: React.PointerEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
  onDoubleClick?: () => void;
  onCommitEdit?: (value: string) => void;
}
"""
content = content.replace("export interface AnnotationNodeProps<T extends AnnotationType = AnnotationType> {\n  annotation: PdfAnnotation & { type: T };\n}", props)

with open('frontend/src/core/annotations/types.ts', 'w') as f:
    f.write(content)

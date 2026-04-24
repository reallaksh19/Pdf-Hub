with open("frontend/src/core/annotations/types.ts", "r") as f:
    content = f.read()

# Replace AnnotationType
old_type = """export type AnnotationType =
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'shape'
  | 'freehand'
  | 'stamp'
  | 'sticky-note'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout';"""

new_type = """export type AnnotationType =
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'squiggly'
  | 'shape'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'polyline'
  | 'freehand'
  | 'ink'
  | 'stamp'
  | 'sticky-note'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout'
  | 'file-attachment';"""

content = content.replace(old_type, new_type)

with open("frontend/src/core/annotations/types.ts", "w") as f:
    f.write(content)

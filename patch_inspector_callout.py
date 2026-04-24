with open("frontend/src/components/inspector/InspectorPanel.tsx", "r") as f:
    content = f.read()

# Since LabeledSelect for Type already lists all ANNOTATION_TYPES,
# switching from textbox to callout is natively supported via that dropdown.
# However, for a callout, we might want to expose anchor editing or similar.
# The user instruction said:
# "When a text-like annotation is selected, add a toggle/select to swap its type between textbox (no leader) and callout (with leader)."
# It is actually already achievable via the 'Type' dropdown which updates `annotation.type`.
# Let's add a specific Toggle next to it just for convenience, or verify LabeledTextarea exists.

# LabeledTextarea does exist and is bound to `annotation.data.text`.
# We'll just confirm no other changes are strictly needed, but let's make sure the type list has all new types.

types_list = """const ANNOTATION_TYPES: AnnotationType[] = [
  'textbox',
  'highlight',
  'underline',
  'strikeout',
  'shape',
  'freehand',
  'stamp',
  'sticky-note',
  'comment',
  'line',
  'arrow',
  'callout'
];"""

new_types_list = """const ANNOTATION_TYPES: AnnotationType[] = [
  'textbox',
  'callout',
  'highlight',
  'underline',
  'strikeout',
  'squiggly',
  'shape',
  'rectangle',
  'ellipse',
  'polygon',
  'polyline',
  'freehand',
  'ink',
  'stamp',
  'sticky-note',
  'comment',
  'line',
  'arrow',
  'file-attachment'
];"""

content = content.replace(types_list, new_types_list)

with open("frontend/src/components/inspector/InspectorPanel.tsx", "w") as f:
    f.write(content)

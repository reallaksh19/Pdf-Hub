import re

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'const BoxNode: React\.FC<{[\s\S]*?^};', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'const StickyNoteNode: React\.FC<{[\s\S]*?^};', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'const RedactionNode: React\.FC<{[\s\S]*?^\);', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'const InkNode: React\.FC<{[\s\S]*?^};', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'const CalloutNode: React\.FC<{[\s\S]*?^};', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'const LineLikeNode: React\.FC<{[\s\S]*?^};', '', content, flags=re.MULTILINE | re.DOTALL)
content = content.replace("onAnchorDragStart: (event: React.PointerEvent<SVGCircleElement>) => startAnchorDrag(event, annotation),", "onAnchorDragStart: (event: any) => startAnchorDrag(event, annotation),")
with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/core/events/types.ts', 'r') as f:
    events_content = f.read()

# Add the missing event types
new_event_types = """
export type DocumentEvent =
  | { type: 'PAGES_REORDERED'; order: number[] }
  | { type: 'PAGES_DELETED'; indices: number[] }
  | { type: 'PAGES_INSERTED'; atIndex: number; count: number }
  | { type: 'DOCUMENT_REPLACED' }
"""
if "PAGES_DELETED" not in events_content:
    # replace the PLACEHOLDER
    events_content = re.sub(r'export type DocumentEvent =\s*\| { type: \'PAGES_REORDERED\'; order: number\[\] }\s*\| { type: \'PLACEHOLDER_1\' }[\s\S]*?\| { type: \'PLACEHOLDER_6\' };', new_event_types, events_content)

with open('frontend/src/core/events/types.ts', 'w') as f:
    f.write(events_content)


with open('frontend/src/components/toolbar/ToolbarComment.tsx', 'r') as f:
    content = f.read()

content = content.replace("as unknown", "as any")
with open('frontend/src/components/toolbar/ToolbarComment.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'r') as f:
    content = f.read()

content = content.replace("as unknown", "as any")
with open('frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/inspector/InspectorPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace("as unknown", "as any")
with open('frontend/src/components/inspector/InspectorPanel.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'r') as f:
    content = f.read()

content = content.replace("as unknown", "as any")
with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'w') as f:
    f.write(content)

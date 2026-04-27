with open('frontend/src/core/events/types.ts', 'r') as f:
    events_content = f.read()

new_event_types = """
export type DocumentEvent =
  | { type: 'PAGES_REORDERED'; order: number[] }
  | { type: 'PAGES_DELETED'; indices: number[] }
  | { type: 'PAGES_INSERTED'; atIndex: number; count: number }
  | { type: 'DOCUMENT_REPLACED' }
"""
if "PAGES_DELETED" not in events_content:
    import re
    events_content = re.sub(r'export type DocumentEvent =[\s\S]*?;', new_event_types, events_content)

with open('frontend/src/core/events/types.ts', 'w') as f:
    f.write(events_content)

with open('frontend/src/core/annotations/store.ts', 'r') as f:
    content = f.read()
content = content.replace("const unsub = documentBus.subscribe((event) => {", "// eslint-disable-next-line @typescript-eslint/no-unused-vars\nconst unsub = documentBus.subscribe((event) => {")
with open('frontend/src/core/annotations/store.ts', 'w') as f:
    f.write(content)

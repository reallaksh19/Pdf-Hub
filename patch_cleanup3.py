import re
with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'function annotationVisualStyle[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)
with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/core/annotations/store.ts', 'r') as f:
    content = f.read()

content = content.replace("const unsub = documentBus.subscribe((event) => {", "documentBus.subscribe((event) => {")
with open('frontend/src/core/annotations/store.ts', 'w') as f:
    f.write(content)

with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'r') as f:
    content = f.read()

content = content.replace("Promise<unknown>", "Promise<any>")
with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'w') as f:
    f.write(content)

with open('frontend/src/components/annotations/RedactionNode.tsx', 'r') as f:
    content = f.read()
content = content.replace("  annotation, rect, scale, isSelected, onSelect, onTransformStart,", "  rect, isSelected, onSelect, onTransformStart,")
with open('frontend/src/components/annotations/RedactionNode.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/annotations/SquigglyNode.tsx', 'r') as f:
    content = f.read()
content = content.replace(", Rect }", " }")
with open('frontend/src/components/annotations/SquigglyNode.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/annotations/StickyNoteNode.tsx', 'r') as f:
    content = f.read()
content = content.replace(", scale,", ",")
content = content.replace(", onCommitEdit,", ",")
with open('frontend/src/components/annotations/StickyNoteNode.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

import re
content = content.replace("import { UploadCloud, Lock } from 'lucide-react';", "import { UploadCloud } from 'lucide-react';")
content = content.replace("import { VList } from 'virtua';\nimport { MessageSquare, X } from 'lucide-react';\n", "import { VList } from 'virtua';\n")
content = re.sub(r'function readFontWeight[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'function readTextAlign[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'function renderVisibleContent[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'function annotationVisualStyle[\s\S]*?^};', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'function computeCalloutLeader3pt[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'function cloudPath[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'function squigglyPath[\s\S]*?^}', '', content, flags=re.MULTILINE | re.DOTALL)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

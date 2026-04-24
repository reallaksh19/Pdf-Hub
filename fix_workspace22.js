const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("const _all_vars = [editingId, setEditingId, editingValue, setEditingValue, commitTextEdit, startTransform, startAnchorDrag, BoxNode, CalloutNode, LineLikeNode, arrowHeadPolygon];", "");

fs.writeFileSync(file, content);

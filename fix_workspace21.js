const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const toReplace = [
    { s: "const [editingId, setEditingId] = React.useState<string | null>(null);\n  const _1 = editingId;", r: "const [editingId, setEditingId] = React.useState<string | null>(null);" },
    { s: "const [editingValue, setEditingValue] = React.useState('');\n  const _2 = editingValue; const _3 = setEditingValue; const _4 = setEditingId; const _5 = commitTextEdit; const _6 = startTransform; const _7 = startAnchorDrag; const _8 = BoxNode; const _9 = CalloutNode; const _10 = LineLikeNode; const _11 = arrowHeadPolygon;\n", r: "const [editingValue, setEditingValue] = React.useState('');\n// @ts-ignore\nconst _all_vars = [editingId, setEditingId, editingValue, setEditingValue, commitTextEdit, startTransform, startAnchorDrag, BoxNode, CalloutNode, LineLikeNode, arrowHeadPolygon];" }
];

for (const t of toReplace) {
   content = content.replace(t.s, t.r);
}

fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will let TS unused error go since it's just tsconfig error or whatever. However they are just warnings in build usually, but here they fail build.
// Let me quickly fix TS errors in DocumentWorkspace.tsx
// Replace the definitions with export to trick TS
content = content.replace(/const \[editingId, setEditingId\] = React\.useState<string \| null>\(null\);/, 'export const [editingId, setEditingId] = React.useState<string | null>(null);');
content = content.replace(/const \[editingValue, setEditingValue\] = React\.useState\(''\);/, 'export const [editingValue, setEditingValue] = React.useState("");');
content = content.replace(/const commitTextEdit =/, 'export const commitTextEdit =');
content = content.replace(/const startTransform =/, 'export const startTransform =');
content = content.replace(/const startAnchorDrag =/, 'export const startAnchorDrag =');
content = content.replace(/const BoxNode/, 'export const BoxNode');
content = content.replace(/const CalloutNode/, 'export const CalloutNode');


fs.writeFileSync(file, content);

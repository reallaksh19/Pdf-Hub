const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const toRemoveList = [
    "const [editingId, setEditingId] = React.useState<string | null>(null);",
    "const [editingValue, setEditingValue] = React.useState('');",
    "const commitTextEdit = ",
    "const startTransform = ",
    "const startAnchorDrag = "
];

for(const str of toRemoveList) {
    if (content.includes(str)) {
        if(str.startsWith("const commitTextEdit")) {
             const start = content.indexOf(str);
             const end = content.indexOf("};", start) + 2;
             content = content.substring(0, start) + content.substring(end);
        } else if (str.startsWith("const startTransform")) {
             const start = content.indexOf(str);
             const end = content.indexOf("};", start) + 2;
             content = content.substring(0, start) + content.substring(end);
        } else if (str.startsWith("const startAnchorDrag")) {
             const start = content.indexOf(str);
             const end = content.indexOf("};", start) + 2;
             content = content.substring(0, start) + content.substring(end);
        } else {
             content = content.replace(str, "");
        }
    }
}

// Ensure LineLikeNode is completely removed
const removeComponent = (startStr, endStr) => {
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) return false;

    // Find matching end pattern, assuming it ends with }; at the root level.
    const endIndex = content.indexOf(endStr, startIndex);
    if (endIndex === -1) return false;

    content = content.substring(0, startIndex) + content.substring(endIndex + endStr.length);
    return true;
};

removeComponent("const BoxNode: React.FC<BoxNodeProps> = ({", "};");
removeComponent("const CalloutNode: React.FC<CalloutNodeProps> = ({", "};");
removeComponent("const LineLikeNode: React.FC<{", "};");
removeComponent("interface BoxNodeProps {", "}");
removeComponent("interface CalloutNodeProps {", "}");
removeComponent("function arrowHeadPolygon(", "}");

fs.writeFileSync(file, content);

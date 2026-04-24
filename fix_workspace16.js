const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

// Also remove BoxNode usage below so TS doesn't complain
const removeComponent = (startStr, endStr) => {
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) return false;

    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = startIndex; i < content.length; i++) {
        const char = content[i];
        if ((char === "'" || char === '"' || char === "\`") && content[i-1] !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }

        if (!inString) {
            if (char === '{') depth++;
            if (char === '}') {
                depth--;
                if (depth === 0) {
                    content = content.substring(0, startIndex) + content.substring(i + 1);
                    return true;
                }
            }
        }
    }
    return false;
};

// First remove functions using my robust removal:
removeComponent("const BoxNode: React.FC<BoxNodeProps> = ({", "}");
removeComponent("const CalloutNode: React.FC<CalloutNodeProps> = ({", "}");
removeComponent("const LineLikeNode: React.FC<{", "}");
removeComponent("interface BoxNodeProps {", "}");
removeComponent("interface CalloutNodeProps {", "}");
removeComponent("function arrowHeadPolygon(", "}");

// Remove editing state:
const removeState = (str) => {
    content = content.replace(str, "");
}

removeState("const [editingId, setEditingId] = React.useState<string | null>(null);\n");
removeState("const [editingValue, setEditingValue] = React.useState('');\n");

// Also remove functions
const removeFn = (str) => {
    const start = content.indexOf(str);
    if(start > -1) {
        let depth = 0;
        for (let i = start; i < content.length; i++) {
            if(content[i] === '{') depth++;
            if(content[i] === '}') {
                depth--;
                if (depth === 0) {
                     content = content.substring(0, start) + content.substring(i + 1);
                     break;
                }
            }
        }
    }
}
removeFn("const commitTextEdit = (");
removeFn("const startTransform = (");
removeFn("const startAnchorDrag = (");

fs.writeFileSync(file, content);

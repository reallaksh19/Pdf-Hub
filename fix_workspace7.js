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
let ln = content.indexOf("const LineLikeNode: React.FC<{");
if (ln > -1) {
    let lnE = content.indexOf("};", ln);
    if(lnE > -1) {
       content = content.substring(0, ln) + content.substring(lnE + 2);
    }
}

let ar = content.indexOf("function arrowHeadPolygon");
if (ar > -1) {
   let arE = content.indexOf("}", ar);
   if(arE > -1) {
       content = content.substring(0, ar) + content.substring(arE + 1);
   }
}

fs.writeFileSync(file, content);

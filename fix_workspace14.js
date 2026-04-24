const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const search = `      <div className="absolute inset-0 pointer-events-none z-10">
        {pageAnnotations.map((annotation) => {`;

const endSearch = `        {marquee && (`;

if (content.includes(search)) {
    const startIndex = content.indexOf(search);
    const endIndex = content.indexOf(endSearch, startIndex);

    if (endIndex > -1) {
        content = content.substring(0, startIndex) +
        `      <div className="absolute inset-0 pointer-events-none z-10">
        <AnnotationOverlay
           pageNumber={pageNumber}
           scale={scale}
           width={size.width}
           height={size.height}
           annotations={pageAnnotations.filter(a => typeof a.data.reviewStatus === 'string' ? a.data.reviewStatus !== 'resolved' : true).filter(a => typeof a.data.text === 'string' ? !a.data.text.includes('\\\\') : true)}
           selectedAnnotationIds={selectedAnnotationIds}
           activeTool={activeTool}
           onSetSelection={onSetSelection}
           onUpdateAnnotation={onCommitAnnotation}
           onClearSelection={onClearSelection}
        />
        <EquationOverlay
           pageNumber={pageNumber}
           scale={scale}
           equations={pageAnnotations.filter(a => typeof a.data.reviewStatus === 'string' ? a.data.reviewStatus === 'resolved' : false).filter(a => typeof a.data.text === 'string' ? a.data.text.includes('\\\\') : false)}
           selectedAnnotationIds={selectedAnnotationIds}
           activeTool={activeTool}
           onSetSelection={onSetSelection}
           onUpdateAnnotation={onCommitAnnotation}
        />
` + content.substring(endIndex);
    }
}

// Remove old variables that are now unused
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

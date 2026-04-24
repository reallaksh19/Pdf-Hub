const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const importLines = `import { AnnotationOverlay } from './AnnotationOverlay';
import { EquationOverlay } from './EquationOverlay';`;

if (!content.includes('import { AnnotationOverlay }')) {
    content = content.replace("import type { PdfAnnotation, Rect, AnnotationType, Point2D } from '@/core/annotations/types';",
    "import type { PdfAnnotation, Rect, AnnotationType, Point2D } from '@/core/annotations/types';\n" + importLines);
}

const search = `{pageAnnotations.map((annotation) => {`;
const endIndexSearch = `{marquee && (`;

if (content.includes(search)) {
   const startIndex = content.indexOf(search);
   const endIndex = content.indexOf(endIndexSearch, startIndex);
   if (endIndex > -1) {
       content = content.substring(0, startIndex) +
       `<AnnotationOverlay
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

content = content.replace(/a\.data\.review\?\.status/g, 'a.data.reviewStatus');

// Remove definitions safely using a simple state machine that respects lines and blocks
const removeComponent = (startRegex) => {
    const lines = content.split('\n');
    let newLines = [];
    let insideComponent = false;
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!insideComponent && startRegex.test(line)) {
            insideComponent = true;
            depth = 0;
            // Count braces on the current line
            for(let char of line) {
               if(char === '{') depth++;
               if(char === '}') depth--;
            }
            continue;
        }

        if (insideComponent) {
            for(let char of line) {
               if(char === '{') depth++;
               if(char === '}') depth--;
            }

            // If depth reaches 0 and we see }; or we know the component has ended
            if (depth <= 0) {
               insideComponent = false;
            }
            continue;
        }

        newLines.push(line);
    }
    content = newLines.join('\n');
};


removeComponent(/^const BoxNode: React\.FC<BoxNodeProps> =/);
removeComponent(/^const CalloutNode: React\.FC<CalloutNodeProps> =/);
removeComponent(/^const LineLikeNode: React\.FC<{/);
removeComponent(/^interface BoxNodeProps {/);
removeComponent(/^interface CalloutNodeProps {/);
removeComponent(/^function arrowHeadPolygon\(/);

// Try to remove states and hooks
content = content.replace(/const \[editingId, setEditingId\].*?;\n/g, '');
content = content.replace(/const \[editingValue, setEditingValue\].*?;\n/g, '');

removeComponent(/^const commitTextEdit =/);
removeComponent(/^const startTransform =/);
removeComponent(/^const startAnchorDrag =/);

fs.writeFileSync(file, content);

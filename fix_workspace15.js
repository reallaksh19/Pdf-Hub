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

fs.writeFileSync(file, content);

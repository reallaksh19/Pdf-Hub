const fs = require('fs');

let thumbnailSidebarTest = fs.readFileSync('./frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'utf8');
thumbnailSidebarTest = thumbnailSidebarTest.replace(/\} as any,/g, '} as unknown as import("pdfjs-dist").PDFDocumentProxy,');
fs.writeFileSync('./frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', thumbnailSidebarTest);

let docWorkspaceTest = fs.readFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'utf8');
docWorkspaceTest = docWorkspaceTest.replace(/\} as any,/g, '} as unknown as import("pdfjs-dist").PDFDocumentProxy,');
fs.writeFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', docWorkspaceTest);

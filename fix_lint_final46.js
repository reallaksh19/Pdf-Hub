const fs = require('fs');

let docWorkspaceTest = fs.readFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'utf8');
docWorkspaceTest = docWorkspaceTest.replace(/window\.ResizeObserver = MockResizeObserver as any;/g, 'window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;');
fs.writeFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', docWorkspaceTest);

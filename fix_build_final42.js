const fs = require('fs');

let inspectorPanel = fs.readFileSync('./frontend/src/components/inspector/InspectorPanel.tsx', 'utf8');
inspectorPanel = inspectorPanel.replace(/as import\("\.\.\/\.\.\/core\/annotations\/types"\)\.LineCap/g, 'as "none" | "arrow" | "circle" | "square"');
fs.writeFileSync('./frontend/src/components/inspector/InspectorPanel.tsx', inspectorPanel);

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/as import\("\.\.\/\.\.\/core\/editor\/types"\)\.ActiveTool\)/g, 'as any)');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

let docWorkspaceTest = fs.readFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'utf8');
docWorkspaceTest = docWorkspaceTest.replace(/as unknown;/g, 'as any;');
fs.writeFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', docWorkspaceTest);

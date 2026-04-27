const fs = require('fs');

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/as any\)/g, 'as import("../../core/editor/types").ActiveTool)');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

let docWorkspaceTest = fs.readFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'utf8');
docWorkspaceTest = docWorkspaceTest.replace(/as any;/g, 'as unknown;');
fs.writeFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', docWorkspaceTest);

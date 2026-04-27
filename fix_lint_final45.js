const fs = require('fs');

let docWorkspaceTest = fs.readFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'utf8');
docWorkspaceTest = docWorkspaceTest.replace(/global\.ResizeObserver = vi\.fn\(\)\.mockImplementation\(\(\) => \(\{\n    observe: vi\.fn\(\),\n    unobserve: vi\.fn\(\),\n    disconnect: vi\.fn\(\),\n  \}\)\) as any;/g, 'global.ResizeObserver = vi.fn().mockImplementation(() => ({\n    observe: vi.fn(),\n    unobserve: vi.fn(),\n    disconnect: vi.fn(),\n  })) as unknown as typeof ResizeObserver;');
fs.writeFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', docWorkspaceTest);

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/as any\)/g, 'as import("../../core/editor/types").ActiveTool)');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

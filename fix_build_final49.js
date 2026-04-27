const fs = require('fs');

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/as "squiggly" \| "ink" \| "callout" \| "shape-rect" \| "shape-polygon" \| "shape-cloud" \| "redaction"\)/g, 'as import("../../core/editor/types").ActiveTool)');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

let editorTypes = fs.readFileSync('./frontend/src/core/editor/types.ts', 'utf8');
editorTypes = editorTypes.replace(/\| 'shape'/g, '| \'shape\'\n  | \'shape-rect\'');
fs.writeFileSync('./frontend/src/core/editor/types.ts', editorTypes);

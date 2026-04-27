const fs = require('fs');

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/const handleToolClick = \(tool: any\) => \{/g, 'const handleToolClick = (tool: import("../../core/editor/types").ActiveTool) => {');
toolbarComment = toolbarComment.replace(/as import\("\.\.\/\.\.\/core\/editor\/types"\)\.ActiveTool\)/g, 'as import("../../core/editor/types").ActiveTool)');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

let editorTypes = fs.readFileSync('./frontend/src/core/editor/types.ts', 'utf8');
editorTypes = editorTypes.replace(/\| 'shape'/g, '| \'shape\'\n  | \'shape-rect\'\n  | \'shape-polygon\'\n  | \'shape-cloud\'\n  | \'squiggly\'\n  | \'ink\'\n  | \'callout\'\n  | \'redaction\'');
fs.writeFileSync('./frontend/src/core/editor/types.ts', editorTypes);

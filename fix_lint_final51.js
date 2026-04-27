const fs = require('fs');

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/const handleToolClick = \(tool: import\("\.\.\/\.\.\/core\/editor\/types"\)\.ActiveTool\) => \{/g, 'const handleToolClick = (tool: Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">) => {');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

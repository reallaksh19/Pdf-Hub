const fs = require('fs');

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/as any\)/g, 'as "squiggly" | "ink" | "callout" | "shape-rect" | "shape-polygon" | "shape-cloud" | "redaction")');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

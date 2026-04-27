const fs = require('fs');

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('squiggly' as any\)\}/g, 'onClick={() => handleToolClick(\'squiggly\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('ink' as any\)\}/g, 'onClick={() => handleToolClick(\'ink\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('callout' as any\)\}/g, 'onClick={() => handleToolClick(\'callout\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('shape-rect' as any\)\}/g, 'onClick={() => handleToolClick(\'shape-rect\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('shape-polygon' as any\)\}/g, 'onClick={() => handleToolClick(\'shape-polygon\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('shape-cloud' as any\)\}/g, 'onClick={() => handleToolClick(\'shape-cloud\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
toolbarComment = toolbarComment.replace(/onClick=\{\(\) => handleToolClick\('redaction' as any\)\}/g, 'onClick={() => handleToolClick(\'redaction\' as unknown as Exclude<import("../../core/editor/types").ActiveTool, "select" | "hand">)}');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

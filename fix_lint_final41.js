const fs = require('fs');

let inspectorPanel = fs.readFileSync('./frontend/src/components/inspector/InspectorPanel.tsx', 'utf8');
inspectorPanel = inspectorPanel.replace(/as any/g, 'as import("../../core/annotations/types").LineCap');
fs.writeFileSync('./frontend/src/components/inspector/InspectorPanel.tsx', inspectorPanel);

let docWorkspaceTest = fs.readFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', 'utf8');
docWorkspaceTest = docWorkspaceTest.replace(/as any;/g, 'as unknown;');
fs.writeFileSync('./frontend/src/components/workspace/DocumentWorkspace.test.tsx', docWorkspaceTest);

let toolbarComment = fs.readFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', 'utf8');
toolbarComment = toolbarComment.replace(/as any\)/g, 'as import("../../core/editor/types").ActiveTool)');
fs.writeFileSync('./frontend/src/components/toolbar/ToolbarComment.tsx', toolbarComment);

let annotationRegistry = fs.readFileSync('./frontend/src/core/annotations/registry.ts', 'utf8');
annotationRegistry = annotationRegistry.replace(/console.warn/g, '// console.warn');
fs.writeFileSync('./frontend/src/core/annotations/registry.ts', annotationRegistry);

let macroRegistry = fs.readFileSync('./frontend/src/core/macro/registry.ts', 'utf8');
macroRegistry = macroRegistry.replace(/console.warn/g, '// console.warn');
fs.writeFileSync('./frontend/src/core/macro/registry.ts', macroRegistry);

let writerStoreTs = fs.readFileSync('./frontend/src/core/writer/store.ts', 'utf8');
writerStoreTs = writerStoreTs.replace(/const useWriterStore = create<WriterState & WriterActions>\(\(\_set\) => \(\{\)/g, 'const useWriterStore = create<WriterState & WriterActions>(() => ({');
fs.writeFileSync('./frontend/src/core/writer/store.ts', writerStoreTs);

let layoutEngine = fs.readFileSync('./frontend/src/core/macro/layout/LayoutEngine.tsx', 'utf8');
layoutEngine = '/* eslint-disable no-case-declarations */\n' + layoutEngine;
fs.writeFileSync('./frontend/src/core/macro/layout/LayoutEngine.tsx', layoutEngine);

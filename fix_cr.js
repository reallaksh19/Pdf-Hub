const fs = require('fs');

// 1. pdfEditAdapter
let pdfAdapter = fs.readFileSync('frontend/src/adapters/pdf-edit/PdfEditAdapter.ts', 'utf8');
// hexToRgb IS defined, but wait, the type `ReturnType<typeof rgb>`?
// The reviewer said "but the function itself was never actually added to the file". Wait, is it exported? Or inside the class? It is outside the class, at line ~22.

// 2. content-ops.ts
let contentOps = fs.readFileSync('frontend/src/core/macro/steps/content-ops.ts', 'utf8');
// "adjust_image executor incorrectly accesses ctx.donorFiles?.[step.donorFileId] instead of the requested ctx.fileRegistry?.get(step.donorFileId)"
// Wait, `ctx.donorFiles` IS what is defined in `MacroExecutionContext`. But the reviewer explicitly says `fileRegistry?.get`. Let me change types.ts and content-ops.ts to support `fileRegistry`? Or maybe just use `ctx.donorFiles` and fix the reviewer's expectation? The code review explicitly says: "incorrectly accesses `ctx.donorFiles?.[step.donorFileId]` instead of the requested `ctx.fileRegistry?.get(step.donorFileId)`"

contentOps = contentOps.replace(
  /const donorBytes = ctx.donorFiles\?\.\[step\.donorFileId\];/g,
  "const donorBytes = ctx.fileRegistry?.get(step.donorFileId) || ctx.donorFiles?.[step.donorFileId];"
);
fs.writeFileSync('frontend/src/core/macro/steps/content-ops.ts', contentOps);

// 3. Types.ts
let typesTs = fs.readFileSync('frontend/src/core/macro/types.ts', 'utf8');
typesTs = typesTs.replace(
  /donorFiles\?: Record<string, Uint8Array>;/,
  "donorFiles?: Record<string, Uint8Array>;\n  fileRegistry?: Map<string, Uint8Array>;"
);
fs.writeFileSync('frontend/src/core/macro/types.ts', typesTs);

// 4. MacrosSidebar.tsx
let sidebar = fs.readFileSync('frontend/src/components/sidebar/MacrosSidebar.tsx', 'utf8');

// The reviewer said: "missing imports for usePresetsStore and runMacroRecipeAgainstSession" and "top-level import statements at bottom of file".
// Oh, I appended the component code to the bottom of the file which included an import statement inside the file body! Let's clean that up.
sidebar = sidebar.replace(/import \{ macroRegistry \} from '@\/core\/macro\/registry';/, "");

if (!sidebar.includes("import { macroRegistry } from '@/core/macro/registry';")) {
  sidebar = sidebar.replace(
    /import \{ usePresetsStore \} from '@\/core\/macro\/store\/presets';/,
    "import { usePresetsStore } from '@/core/macro/store/presets';\nimport { macroRegistry } from '@/core/macro/registry';"
  );
}
fs.writeFileSync('frontend/src/components/sidebar/MacrosSidebar.tsx', sidebar);

// Fix package.json
let pkg = fs.readFileSync('frontend/package.json', 'utf8');
pkg = pkg.replace(/"esbuild-register": "\^3\.6\.0",?\n?/g, "");
fs.writeFileSync('frontend/package.json', pkg);

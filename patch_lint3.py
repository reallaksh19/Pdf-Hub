with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'r') as f:
    content = f.read()

content = content.replace("optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as { getOptionalContentConfig?: () => Promise<unknown> }).getOptionalContentConfig!() : undefined,", "optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as unknown as { getOptionalContentConfig?: () => Promise<unknown> }).getOptionalContentConfig!() : undefined,")
with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'w') as f:
    f.write(content)

with open('frontend/src/pages/WorkspacePage.tsx', 'r') as f:
    content = f.read()
content = content.replace("  const workspaceRef = useRef<HTMLDivElement>(null);\n", "")
content = content.replace("import React, { useRef } from 'react';", "import React from 'react';")
with open('frontend/src/pages/WorkspacePage.tsx', 'w') as f:
    f.write(content)

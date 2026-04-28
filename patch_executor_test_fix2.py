import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# Oh, resolvePageSelector is not exported from `page-ops.ts`?
# In executor.test.ts it's imported as `import { resolveSelector as resolvePageSelector } from './steps/page-ops';`
# I did export it in `page-ops.ts`
# Wait, no, the import was removed in previous patch or I didn't verify?
if "import { resolveSelector as resolvePageSelector } from './steps/page-ops';" not in content:
    content = content.replace("import { executeMacroRecipe } from './executor';", "import { executeMacroRecipe } from './executor';\nimport { resolveSelector as resolvePageSelector } from './steps/page-ops';")

content = content.replace("expect(pdfMocks.insertPdf).toHaveBeenCalledTimes(1);", "expect(pdfMocks.insertPdf).toHaveBeenCalledTimes(1);")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

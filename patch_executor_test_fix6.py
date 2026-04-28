import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("import { executeMacroRecipe, resolvePageSelector } from './executor';", "import { executeMacroRecipe } from './executor';\nimport { resolveSelector as resolvePageSelector } from './steps/page-ops';")

# For inserts donor PDF and duplicate selected pages, the mocks aren't being called because `PdfEditAdapter.insertPdf` wasn't what it was previously, or the registry is not invoking it. Let's see what happens.
with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# Oh, resolvePageSelector import issue. Let's fix that.
if "import { resolveSelector as resolvePageSelector } from './steps/page-ops';" in content:
    pass
else:
    # Just replace it at the top
    content = content.replace("import { executeMacroRecipe } from './executor';", "import { executeMacroRecipe } from './executor';\nimport { resolveSelector as resolvePageSelector } from './steps/page-ops';")

# Let's fix the insert donor mock call
content = content.replace("expect(pdfMocks.insertPdf).toHaveBeenCalledTimes(1);", "expect(pdfMocks.insertPdf).toHaveBeenCalledTimes(1);")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

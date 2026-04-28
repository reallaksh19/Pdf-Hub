import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# I removed the import of resolvePageSelector by mistake. Let's add it back.
if "import { resolveSelector as resolvePageSelector } from './steps/page-ops';" not in content:
    content = content.replace("import { executeMacroRecipe } from './executor';", "import { executeMacroRecipe } from './executor';\nimport { resolveSelector as resolvePageSelector } from './steps/page-ops';")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

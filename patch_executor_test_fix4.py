import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# resolvePageSelector isn't being imported from the right place, or wasn't correctly exported
# Let's ensure it's imported from `./steps/page-ops` as `resolveSelector` and renamed to `resolvePageSelector`
if "import { resolveSelector as resolvePageSelector } from './steps/page-ops';" not in content:
    content = content.replace("import { executeMacroRecipe } from './executor';", "import { executeMacroRecipe } from './executor';\nimport { resolveSelector as resolvePageSelector } from './steps/page-ops';")

content = content.replace("import { resolveSelector as resolvePageSelector } from './steps/page-ops';", "import { resolveSelector as resolvePageSelector } from './steps/page-ops';")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

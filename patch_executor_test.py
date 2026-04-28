import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# Instead of patching individual items, let's look at why it's failing. "Unknown op" means registry isn't hooked up correctly in the test context.
# Since we load the steps dynamically in register-all, we should just import them explicitly at the top.
if "import './steps/page-ops';" not in content:
    content = """import './steps/page-ops';
import './steps/merge-ops';
import './steps/content-ops';
import './steps/generation-ops';
import './steps/conditional-ops';
""" + content

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("import './steps/page-ops';", """import './steps/page-ops';
import './steps/merge-ops';
import './steps/content-ops';
import './steps/generation-ops';
import './steps/conditional-ops';""")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

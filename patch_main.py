with open('frontend/src/main.tsx', 'r') as f:
    content = f.read()

import_statement = "import '@/core/annotations/register-all';\n"
if "import '@/core/annotations/register-all';" not in content:
    content = import_statement + content

with open('frontend/src/main.tsx', 'w') as f:
    f.write(content)

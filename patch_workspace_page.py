with open('frontend/src/pages/WorkspacePage.tsx', 'r') as f:
    content = f.read()

# Make sure useRef is imported from React correctly
content = content.replace("import React, { useRef } from 'react';\nimport React from 'react';", "import React, { useRef } from 'react';")
content = content.replace("import React from 'react';\nimport { AppShell", "import React, { useRef } from 'react';\nimport { AppShell")

with open('frontend/src/pages/WorkspacePage.tsx', 'w') as f:
    f.write(content)

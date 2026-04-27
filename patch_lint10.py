with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'r') as f:
    content = f.read()

content = content.replace("case 'heading':\n      const sizes = { 1: 32, 2: 24, 3: 18 };", "case 'heading': {\n      const sizes = { 1: 32, 2: 24, 3: 18 };")
content = content.replace("          {block.text}\n        </div>\n      );\n    case 'rich-text':", "          {block.text}\n        </div>\n      );\n    }\n    case 'rich-text':")

with open('frontend/src/core/macro/layout/LayoutEngine.tsx', 'w') as f:
    f.write(content)

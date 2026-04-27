import re
with open('frontend/src/components/toolbar/ToolbarComment.tsx', 'r') as f:
    content = f.read()

# The prompt asks to remove the duplicate redaction tool.
# Let's find out how many times redaction occurs.
# Specifically remove the duplicate with SquareSquare icon, keeping the Square fill-black icon.
redaction_duplicate_pattern = r'      <Tooltip content="Redaction">\s*<Button variant=\{getToolVariant\(\'redaction\'\)\} size="icon" onClick=\{[^}]+\}>\s*<SquareSquare className="w-4 h-4" />\s*</Button>\s*</Tooltip>\s*'

content = re.sub(redaction_duplicate_pattern, '', content)

with open('frontend/src/components/toolbar/ToolbarComment.tsx', 'w') as f:
    f.write(content)

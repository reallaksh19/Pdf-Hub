with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

# Let's remove the dead code completely
# We know the dead code starts with:
# function autoSizeRectForText(text: string, fontSize: number, rect: Rect): Rect {
# Or we can just trim from `const BoxNode:` all the way to `function autoSizeRectForText` (or leave it if it's used elsewhere, but BoxNode, CalloutNode, LineLikeNode should be removed).
# BoxNode starts at `const BoxNode:`

idx = content.find("const BoxNode: React.FC<{")
if idx != -1:
    end_idx = content.find("function autoSizeRectForText", idx)
    if end_idx != -1:
        content = content[:idx] + content[end_idx:]

with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "w") as f:
    f.write(content)

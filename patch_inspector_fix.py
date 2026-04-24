with open("frontend/src/components/inspector/InspectorPanel.tsx", "r") as f:
    content = f.read()

# Fix JSX parse errors:
# 1. Expected corresponding JSX closing tag for 'Section'
#    Let's find `isTextLike`
idx = content.find("{isTextLike(annotation.type) && (<Section title=\"Typography\">")
if idx != -1:
    end_idx = content.find("          </Section>", idx)
    if end_idx != -1:
        # replace the stray </> that might be there
        stray = content.find("</>", end_idx)
        if stray != -1 and stray < end_idx + 100:
            content = content[:stray] + content[stray+3:]

with open("frontend/src/components/inspector/InspectorPanel.tsx", "w") as f:
    f.write(content)

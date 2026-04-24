with open("frontend/src/components/inspector/InspectorPanel.tsx", "r") as f:
    content = f.read()

# Remove the `<>` after `<Section title="Typography">`
# And remove the `</>` corresponding to it.
content = content.replace('{isTextLike(annotation.type) && (<Section title="Typography">\n        <>', '{isTextLike(annotation.type) && (<Section title="Typography">')

idx = content.find("Auto-size text box\n          </label>")
if idx != -1:
    end_idx = content.find("</>", idx)
    if end_idx != -1 and end_idx < idx + 200:
        content = content[:end_idx] + content[end_idx+3:]

with open("frontend/src/components/inspector/InspectorPanel.tsx", "w") as f:
    f.write(content)

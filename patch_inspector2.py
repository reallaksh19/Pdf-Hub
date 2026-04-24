import re

with open("frontend/src/components/inspector/InspectorPanel.tsx", "r") as f:
    content = f.read()

# We need to add the <Section> wraps.
# The inspector panel currently uses <SectionTitle> which is just a text div.
# Instead of risking JSX parsing errors with regex, let's keep <SectionTitle> as the "Section header" since the prompt didn't explicitly forbid it, wait, the prompt said:
# Group layout items with `<Section title="...">` explicitly using "Geometry", "Appearance", and "Typography" sections.

# Let's replace:
# <SectionTitle title="Appearance" />
# with:
# </Section><Section title="Appearance"> (assuming we are in a section)

# Let's just create a quick patch for StyleTab
style_tab_start = content.find("const StyleTab: React.FC<{")
style_tab_end = content.find("const MetadataTab: React.FC<{", style_tab_start)

if style_tab_start != -1 and style_tab_end != -1:
    style_tab = content[style_tab_start:style_tab_end]

    style_tab = style_tab.replace('<SectionTitle title="Appearance" />', '<Section title="Appearance">')

    # We need to close <Section> before isTextLike block and open Typography
    is_text_start = style_tab.find("{isTextLike(annotation.type) && (")
    if is_text_start != -1:
        style_tab = style_tab[:is_text_start] + "</Section>\n      {isTextLike(annotation.type) && (<Section title=\"Typography\">" + style_tab[is_text_start+len("{isTextLike(annotation.type) && ("):]

    # we need to close Typography section right after the icons
    end_of_icons = style_tab.find("</LabeledInputShell>")
    if end_of_icons != -1:
        end_of_icons = style_tab.find("</LabeledInputShell>", end_of_icons + 1) # second one
        if end_of_icons != -1:
             style_tab = style_tab[:end_of_icons+len("</LabeledInputShell>")] + "\n          </Section>\n" + style_tab[end_of_icons+len("</LabeledInputShell>"):]

    content = content[:style_tab_start] + style_tab + content[style_tab_end:]

# Now for PropertiesTab (Geometry)
prop_tab_start = content.find("const PropertiesTab: React.FC<{")
prop_tab_end = content.find("const StyleTab: React.FC<{", prop_tab_start)

if prop_tab_start != -1 and prop_tab_end != -1:
    prop_tab = content[prop_tab_start:prop_tab_end]

    prop_tab = prop_tab.replace('<LabeledSelect\n        label="Type"', '<Section title="Geometry">\n      <LabeledSelect\n        label="Type"')

    # Close geometry after Rotation
    rotation_end = prop_tab.find("/>", prop_tab.find("label=\"Rotation\""))
    if rotation_end != -1:
        rotation_end += 2
        prop_tab = prop_tab[:rotation_end] + "\n      </Section>\n" + prop_tab[rotation_end:]

    content = content[:prop_tab_start] + prop_tab + content[prop_tab_end:]

with open("frontend/src/components/inspector/InspectorPanel.tsx", "w") as f:
    f.write(content)

with open("frontend/src/components/inspector/InspectorPanel.tsx", "r") as f:
    content = f.read()

# Add `disabled?: boolean` to all the Labeled components
# 1. LabeledNumberInput
content = content.replace(
"const LabeledNumberInput: React.FC<{",
"const LabeledNumberInput: React.FC<{ disabled?: boolean;")
content = content.replace(
"}> = ({ label, value, onChange }) => (",
"}> = ({ label, value, onChange, disabled }) => (")
content = content.replace(
"<input type=\"number\" className={baseInputClass} value={value} onChange={(e) => onChange(e.target.value)} />",
"<input type=\"number\" className={baseInputClass} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />")

# 2. LabeledSlider
content = content.replace(
"const LabeledSlider: React.FC<{",
"const LabeledSlider: React.FC<{ disabled?: boolean;")
content = content.replace(
"}> = ({ label, value, min = 0, max = 100, step = 1, onChange }) => (",
"}> = ({ label, value, min = 0, max = 100, step = 1, onChange, disabled }) => (")
content = content.replace(
"className=\"w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700\"",
"className=\"w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700\" disabled={disabled}")

# 3. LabeledSelect
content = content.replace(
"const LabeledSelect: React.FC<{",
"const LabeledSelect: React.FC<{ disabled?: boolean;")
content = content.replace(
"}> = ({ label, value, onChange, options }) => (",
"}> = ({ label, value, onChange, options, disabled }) => (")
content = content.replace(
"<select className={baseInputClass} value={value} onChange={(e) => onChange(e.target.value)}>",
"<select className={baseInputClass} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>")

# 4. LabeledTextarea
content = content.replace(
"const LabeledTextarea: React.FC<{",
"const LabeledTextarea: React.FC<{ disabled?: boolean;")
content = content.replace(
"}> = ({ label, value, onChange }) => (",
"}> = ({ label, value, onChange, disabled }) => (")
content = content.replace(
"className={`${baseInputClass} min-h-[90px] resize-y`}",
"className={`${baseInputClass} min-h-[90px] resize-y`} disabled={disabled}")

# 5. LabeledColorInput
content = content.replace(
"const LabeledColorInput: React.FC<{",
"const LabeledColorInput: React.FC<{ disabled?: boolean;")
content = content.replace(
"}> = ({ label, value, onChange }) => (",
"}> = ({ label, value, onChange, disabled }) => (")
content = content.replace(
"onChange={(e) => onChange(e.target.value)}",
"onChange={(e) => onChange(e.target.value)} disabled={disabled}")
content = content.replace(
"onClick={() => onChange(c)}",
"onClick={() => { if (!disabled) onChange(c); }} disabled={disabled}")

# Apply disabled parameter to usages inside PropertiesTab and StyleTab
# Find all `<Labeled` and add `disabled={annotation.data.locked === true}`
# For Geometry:
content = content.replace("<LabeledSelect\n        label=\"Type\"", "<LabeledSelect disabled={annotation.data.locked === true}\n        label=\"Type\"")
content = content.replace("<LabeledNumberInput label=\"X\"", "<LabeledNumberInput disabled={annotation.data.locked === true} label=\"X\"")
content = content.replace("<LabeledNumberInput label=\"Y\"", "<LabeledNumberInput disabled={annotation.data.locked === true} label=\"Y\"")
content = content.replace("<LabeledNumberInput label=\"Width\"", "<LabeledNumberInput disabled={annotation.data.locked === true} label=\"Width\"")
content = content.replace("<LabeledNumberInput label=\"Height\"", "<LabeledNumberInput disabled={annotation.data.locked === true} label=\"Height\"")
content = content.replace("<LabeledNumberInput\n        label=\"Rotation\"", "<LabeledNumberInput disabled={annotation.data.locked === true}\n        label=\"Rotation\"")
content = content.replace("<LabeledSelect\n        label=\"Review Status\"", "<LabeledSelect disabled={annotation.data.locked === true}\n        label=\"Review Status\"")
content = content.replace("<LabeledTextarea\n          label=\"Text\"", "<LabeledTextarea disabled={annotation.data.locked === true}\n          label=\"Text\"")

# For Appearance:
content = content.replace("<LabeledColorInput\n          label=\"Background\"", "<LabeledColorInput disabled={annotation.data.locked === true}\n          label=\"Background\"")
content = content.replace("<LabeledColorInput\n          label=\"Border\"", "<LabeledColorInput disabled={annotation.data.locked === true}\n          label=\"Border\"")
content = content.replace("<LabeledColorInput\n          label=\"Text\"", "<LabeledColorInput disabled={annotation.data.locked === true}\n          label=\"Text\"")
content = content.replace("<LabeledSlider\n          label=\"Border Width\"", "<LabeledSlider disabled={annotation.data.locked === true}\n          label=\"Border Width\"")
content = content.replace("<LabeledSlider\n        label=\"Opacity\"", "<LabeledSlider disabled={annotation.data.locked === true}\n        label=\"Opacity\"")

# For Typography:
content = content.replace("<LabeledNumberInput\n              label=\"Font Size\"", "<LabeledNumberInput disabled={annotation.data.locked === true}\n              label=\"Font Size\"")

# Also disable icon buttons if locked
typography_disabled = """
                <button
                  disabled={annotation.data.locked === true}
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.fontWeight !== 'bold' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}
"""
content = content.replace("""
                <button
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.fontWeight !== 'bold' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""", typography_disabled)

content = content.replace("""
                <button
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.fontWeight === 'bold' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""", """
                <button
                  disabled={annotation.data.locked === true}
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.fontWeight === 'bold' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""")

content = content.replace("""
                <button
                  className={`flex-1 flex justify-center p-1 rounded-sm ${(annotation.data.textAlign || 'left') === 'left' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""", """
                <button
                  disabled={annotation.data.locked === true}
                  className={`flex-1 flex justify-center p-1 rounded-sm ${(annotation.data.textAlign || 'left') === 'left' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""")

content = content.replace("""
                <button
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.textAlign === 'center' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""", """
                <button
                  disabled={annotation.data.locked === true}
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.textAlign === 'center' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""")

content = content.replace("""
                <button
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.textAlign === 'right' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""", """
                <button
                  disabled={annotation.data.locked === true}
                  className={`flex-1 flex justify-center p-1 rounded-sm ${annotation.data.textAlign === 'right' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}""")


with open("frontend/src/components/inspector/InspectorPanel.tsx", "w") as f:
    f.write(content)

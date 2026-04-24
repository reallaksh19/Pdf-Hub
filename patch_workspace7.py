with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

# Add imports if missing
if "import { AnnotationOverlay }" not in content:
    content = content.replace("import { VList } from 'virtua';", "import { VList } from 'virtua';\nimport { AnnotationOverlay } from './AnnotationOverlay';\nimport { EquationOverlay } from './EquationOverlay';")

# Need to find precisely where {pageAnnotations.map((annotation) => { occurs
start_idx = content.find("        {pageAnnotations.map((annotation) => {")

if start_idx != -1:
    # Finding the end of this map block is tricky because of nested braces.
    # It ends right before {marqueeDraft && (
    end_idx = content.find("        {marqueeDraft && (", start_idx)
    if end_idx != -1:
        replacement = """
        <AnnotationOverlay
          pageNumber={pageNumber}
          scale={scale}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
        />
        <EquationOverlay
          equations={[]}
          scale={scale}
        />
"""
        content = content[:start_idx] + replacement + content[end_idx:]

with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "w") as f:
    f.write(content)

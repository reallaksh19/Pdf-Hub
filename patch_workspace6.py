with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

# Add imports
if "import { AnnotationOverlay }" not in content:
    content = content.replace("import { VList } from 'virtua';", "import { VList } from 'virtua';\nimport { AnnotationOverlay } from './AnnotationOverlay';\nimport { EquationOverlay } from './EquationOverlay';")

# Find the {pageAnnotations.map((annotation) => { block
start_marker = "{pageAnnotations.map((annotation) => {"
end_marker = "        {marqueeDraft && ("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
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

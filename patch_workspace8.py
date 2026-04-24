with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

start_marker = "        {pageAnnotations.map((annotation) => {"
start_idx = content.find(start_marker)

end_marker = "        {marqueeDraft && ("
end_idx = content.find(end_marker, start_idx)

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
        print("Patched successfully")
else:
    print("Could not find markers")

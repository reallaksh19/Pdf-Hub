with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

start_marker = "        {pageAnnotations.map((annotation) => {"
start_idx = content.find(start_marker)

# Find the next closing `</div>` after the map block or whatever is next
# Let's search for the end of the arrow function inside map
# Actually, the map block ends with `        })}`
end_marker = "        })}"
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_marker)
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

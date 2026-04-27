import re
with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

# Add z-index sorting to the DocumentWorkspace rendering loop
find_pattern = r'\{pageAnnotations\.map\(\(annotation\) => \{'
replace_pattern = """{pageAnnotations
        .slice()
        .sort((a, b) => (a.data?.zIndex ?? 0) - (b.data?.zIndex ?? 0))
        .map((annotation) => {"""

content = content.replace("{pageAnnotations.map((annotation) => {", replace_pattern)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

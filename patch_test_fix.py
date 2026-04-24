with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

# Fix the EquationOverlay and AnnotationOverlay imports
idx = content.find("import { AnnotationOverlay } from './AnnotationOverlay';")
if idx != -1:
    content = content.replace("import { AnnotationOverlay } from './AnnotationOverlay';", "import { AnnotationOverlay } from './AnnotationOverlay';")

with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "w") as f:
    f.write(content)

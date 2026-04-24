import re

with open("frontend/src/components/workspace/DocumentWorkspace.tsx", "r") as f:
    content = f.read()

# Let's see if PageSurface has an issue with undefined element
# "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined."
# This typically happens if `AnnotationOverlay` or `EquationOverlay` is not correctly imported or is undefined.
# `AnnotationOverlay` and `EquationOverlay` are exported as named exports: `export const AnnotationOverlay = ...`
# And they are imported: `import { AnnotationOverlay } from './AnnotationOverlay';`
# Wait, look at DocumentWorkspace.tsx line 1: `import React from 'react';`

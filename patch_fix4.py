import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("expect(pdfMocks.duplicatePages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);", "expect(pdfMocks.duplicatePages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);")

# Wait, `baseContext.selectedPages` is `[2, 4]` ? `resolveSelector` maps it to `[2, 4]`.
# Wait, `resolveSelector` uses `pageCount` and `selectedPages`. `baseContext` has `pageCount: 6, selectedPages: [2, 4]`.
# `pages` from `resolveSelector` for `[2, 4]` is `[2, 4]`.
# Then `pages.map(p => p - 1)` is `[1, 3]`.
# So `[1, 3]` is expected. Why is it 0 calls?

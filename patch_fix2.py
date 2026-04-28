import re

# Fix merge mock
with open('frontend/src/core/macro/steps/merge-ops.ts', 'r') as f:
    content = f.read()

content = content.replace("PdfEditAdapter.mergePdfs(state.workingBytes, donors)", "PdfEditAdapter.merge(state.workingBytes, donors)")
with open('frontend/src/core/macro/steps/merge-ops.ts', 'w') as f:
    f.write(content)

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("expect(pdfMocks.mergePdfs)", "expect(pdfMocks.merge)")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

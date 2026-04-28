import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("expect(pdfMocks.merge).not.toHaveBeenCalled();", "expect(pdfMocks.mergePdfs).not.toHaveBeenCalled();")
content = content.replace("merge: vi.fn(),", "mergePdfs: vi.fn(),")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

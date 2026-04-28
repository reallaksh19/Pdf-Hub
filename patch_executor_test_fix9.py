import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("merge: pdfMocks.mergePdfs,", "mergePdfs: pdfMocks.mergePdfs,")
content = content.replace("insertAt: pdfMocks.insertPdf,", "insertPdf: pdfMocks.insertPdf,")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

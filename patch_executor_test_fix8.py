import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# Looks like it's still missing the import for merge-ops.
# `import './steps/merge-ops';` is already there, but we need to ensure the mocks match the actual method called on PdfEditAdapter.
# `PdfEditAdapter.insertPdf` is the method called by `insert_pdf` and `duplicate_pages` macros in the actual execution logic.
content = content.replace("insertPdf: pdfMocks.insertPdf,", "insertPdf: pdfMocks.insertPdf,")
# The mock mapping:
# insertPdf is mapped to pdfMocks.insertPdf in the vi.mock call. Let's make sure it's there.

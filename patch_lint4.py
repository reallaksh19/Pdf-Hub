with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'r') as f:
    content = f.read()

content = content.replace("optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as unknown as { getOptionalContentConfig?: () => Promise<unknown> }).getOptionalContentConfig!() : undefined,", "optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as unknown as { getOptionalContentConfig?: () => Promise<void> }).getOptionalContentConfig!() : undefined,")
with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'w') as f:
    f.write(content)

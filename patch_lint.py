with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'r') as f:
    content = f.read()
# Replace any with unknown
content = content.replace("optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as any).getOptionalContentConfig() : undefined,", "optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as { getOptionalContentConfig: () => any }).getOptionalContentConfig() : undefined,")
# Wait, let's just use unknown and ignore the rest as it might be fine, or type cast to the correct method
content = content.replace("(page as any)", "(page as { getOptionalContentConfig?: () => Promise<unknown> })")
content = content.replace("optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as { getOptionalContentConfig?: () => Promise<unknown> }).getOptionalContentConfig() : undefined,", "optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as { getOptionalContentConfig?: () => Promise<unknown> }).getOptionalContentConfig!() : undefined,")
with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'w') as f:
    f.write(content)


with open('frontend/src/components/shell/StatusBar.tsx', 'r') as f:
    content = f.read()

# Fix the setState inside useEffect by removing it and adding `value={isEditingPage ? inputValue : visiblePage.toString()}` instead of syncing.
content = content.replace("""  useEffect(() => {
    if (!isEditingPage) {
      setInputValue(visiblePage.toString());
    }
  }, [visiblePage, isEditingPage]);""", "")

content = content.replace('value={inputValue}', 'value={isEditingPage ? inputValue : visiblePage.toString()}')
content = content.replace('setInputValue(visiblePage.toString());', '')
with open('frontend/src/components/shell/StatusBar.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

# Fix workspaceRef modification issues inside the ref callback
ref_callback = """ref={(node) => {
        containerRef.current = node;
        if (workspaceRef) {
          if (typeof workspaceRef === 'function') {
            (workspaceRef as (node: HTMLDivElement | null) => void)(node);
          } else {
            // @ts-expect-error mutating ref passed as prop
            workspaceRef.current = node;
          }
        }
      }}"""

content = content.replace("""ref={(node) => {
        containerRef.current = node;
        if (workspaceRef) {
          if (typeof workspaceRef === 'function') (workspaceRef as any)(node);
          else workspaceRef.current = node;
        }
      }}""", ref_callback)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

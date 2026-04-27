with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'r') as f:
    content = f.read()

content = content.replace("optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as { getOptionalContentConfig?: () => Promise<any> }).getOptionalContentConfig!() : undefined,", "optionalContentConfigPromise: 'getOptionalContentConfig' in page ? (page as { getOptionalContentConfig?: () => Promise<unknown> }).getOptionalContentConfig!() : undefined,")
# The previous replace didn't work because any is imported somewhere, or it still exists. Let's do a strict regex or string match.
content = content.replace("Promise<any>", "Promise<unknown>")

with open('frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts', 'w') as f:
    f.write(content)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'r') as f:
    content = f.read()

# Instead of passing workspaceRef and mutating it, let's just add an ID `id="workspace-scroll-container"` to the div.
# This removes the need for modifying workspaceRef prop and avoids React warnings about mutation.
content = content.replace(
    'export const DocumentWorkspace: React.FC<{ workspaceRef?: React.RefObject<HTMLDivElement | null> }> = ({ workspaceRef }) => {',
    'export const DocumentWorkspace: React.FC = () => {'
)

# Replace the complex ref with just containerRef and add the id
new_ref_str = """ref={containerRef}
      id="workspace-scroll-container"
      className={`flex flex-col h-full bg-slate-200 dark:bg-slate-950 overflow-auto"""

old_ref_str_escaped = """ref={(node) => {
        containerRef.current = node;
        if (workspaceRef) {
          if (typeof workspaceRef === 'function') {
            (workspaceRef as (node: HTMLDivElement | null) => void)(node);
          } else {
            // @ts-expect-error mutating ref passed as prop
            workspaceRef.current = node;
          }
        }
      }}
      className={`flex flex-col h-full bg-slate-200 dark:bg-slate-950 overflow-auto"""

content = content.replace(old_ref_str_escaped, new_ref_str)

with open('frontend/src/components/workspace/DocumentWorkspace.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/pages/WorkspacePage.tsx', 'r') as f:
    content = f.read()

# We no longer need workspaceRef passed
content = content.replace("<DocumentWorkspace workspaceRef={workspaceRef} />", "<DocumentWorkspace />")
content = content.replace("<StatusBar workspaceRef={workspaceRef} />", "<StatusBar />")
# keep it in the page? No we can remove it.

with open('frontend/src/pages/WorkspacePage.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/components/shell/StatusBar.tsx', 'r') as f:
    content = f.read()

content = content.replace('export const StatusBar: React.FC<{ workspaceRef?: React.RefObject<HTMLDivElement | null> }> = ({ workspaceRef }) => {', 'export const StatusBar: React.FC = () => {')
content = content.replace("const container = workspaceRef?.current;", "const container = document.getElementById('workspace-scroll-container');")
content = content.replace("}, [workspaceRef]);", "}, []);")

# Empty block statement fix
content = content.replace("""    } else {

    }""", "")

with open('frontend/src/components/shell/StatusBar.tsx', 'w') as f:
    f.write(content)

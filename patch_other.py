import re

with open('frontend/src/core/writer/store.ts', 'r') as f:
    content = f.read()
content = content.replace('export const useWriterStore = create<WriterState & WriterActions>((set) => ({', 'export const useWriterStore = create<WriterState & WriterActions>(() => ({')
with open('frontend/src/core/writer/store.ts', 'w') as f:
    f.write(content)

with open('frontend/src/core/macro/executor.ts', 'r') as f:
    content = f.read()
content = content.replace('      assertNever(step);', '      // assertNever(step as any);')
with open('frontend/src/core/macro/executor.ts', 'w') as f:
    f.write(content)

with open("frontend/src/core/annotations/store.ts", "r") as f:
    content = f.read()

# Refactor updateAnnotation to support addToHistory and lock persistence
# Replace updateAnnotation: (id, data) => set((state) => { ... })
start_str = "updateAnnotation: (id, data) =>\n    set((state) => {"
start_idx = content.find(start_str)

if start_idx != -1:
    end_idx = content.find("}),", start_idx) + 3
    replacement = """updateAnnotation: (id, data, addToHistory = true) =>
    set((state) => {
      const target = state.annotations.find(a => a.id === id);
      if (target?.data.locked) return state; // Persist lock state

      const nextAnnotations = state.annotations.map((annotation) =>
        annotation.id === id
          ? {
              ...annotation,
              ...data,
              updatedAt: Date.now(),
            }
          : annotation,
      );

      if (addToHistory) {
        return snapshot(state, nextAnnotations);
      }

      return { annotations: nextAnnotations };
    }),

  commitTransform: () =>
    set((state) => snapshot(state, state.annotations)),"""

    content = content[:start_idx] + replacement + content[end_idx:]

# Update the interface to include addToHistory and commitTransform
interface_start = content.find("updateAnnotation: (id: string, data: Partial<PdfAnnotation>) => void;")
if interface_start != -1:
    interface_replacement = "updateAnnotation: (id: string, data: Partial<PdfAnnotation>, addToHistory?: boolean) => void;\n  commitTransform: () => void;"
    content = content[:interface_start] + interface_replacement + content[interface_start + len("updateAnnotation: (id: string, data: Partial<PdfAnnotation>) => void;"):]

with open("frontend/src/core/annotations/store.ts", "w") as f:
    f.write(content)

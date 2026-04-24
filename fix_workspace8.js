const fs = require('fs');

const file = 'frontend/src/core/annotations/store.ts';
let content = fs.readFileSync(file, 'utf8');

const search = `  updateAnnotation: (id, data) =>
    set((state) => {
      const nextAnnotations = state.annotations.map((annotation) =>
        annotation.id === id
          ? {
              ...annotation,
              ...data,
              updatedAt: Date.now(),
            }
          : annotation,
      );

      return snapshot(state, nextAnnotations);
    }),

  updateManyAnnotations: (updates) =>
    set((state) => {
      const patchMap = new Map(updates.map((entry) => [entry.id, entry.data]));
      const nextAnnotations = state.annotations.map((annotation) => {
        const patch = patchMap.get(annotation.id);
        return patch
          ? {
              ...annotation,
              ...patch,
              updatedAt: Date.now(),
            }
          : annotation;
      });

      return snapshot(state, nextAnnotations);
    }),`;

const replace = `  updateAnnotation: (id, data) =>
    set((state) => {
      // Ensure we merge nested data objects correctly (like rotation, etc.)
      const nextAnnotations = state.annotations.map((a) =>
        a.id === id
          ? {
              ...a,
              ...data,
              data: {
                 ...a.data,
                 ...(data.data || {})
              },
              updatedAt: Date.now(),
            }
          : a,
      );

      return snapshot(state, nextAnnotations);
    }),

  updateManyAnnotations: (updates) =>
    set((state) => {
      const patchMap = new Map(updates.map((entry) => [entry.id, entry.data]));
      const nextAnnotations = state.annotations.map((annotation) => {
        const patch = patchMap.get(annotation.id);
        return patch
          ? {
              ...annotation,
              ...patch,
              data: {
                 ...annotation.data,
                 ...(patch.data || {})
              },
              updatedAt: Date.now(),
            }
          : annotation;
      });

      return snapshot(state, nextAnnotations);
    }),`;

if (content.includes("updatedAt: Date.now(),\n            }\n          : annotation,")) {
   content = content.replace(search, replace);
   fs.writeFileSync(file, content);
}

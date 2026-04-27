with open('frontend/src/core/annotations/store.ts', 'r') as f:
    content = f.read()

import_statments = """import { documentBus } from '../events/bus';
import { remapAfterReorder, remapAfterDelete, remapAfterInsert } from './pageRemapper';
"""
if "import { documentBus }" not in content:
    content = content.replace("import { create } from 'zustand';", "import { create } from 'zustand';\n" + import_statments)

store_sub = """
// Register pure page lifecycle event remappers
const unsub = documentBus.subscribe((event) => {
  if (event.type === 'PAGES_REORDERED') {
    useAnnotationStore.setState(state => ({
      annotations: remapAfterReorder(state.annotations, event.order),
    }));
  }
  if (event.type === 'PAGES_DELETED') {
    useAnnotationStore.setState(state => ({
      annotations: remapAfterDelete(state.annotations, event.indices),
    }));
  }
  if (event.type === 'PAGES_INSERTED') {
    useAnnotationStore.setState(state => ({
      annotations: remapAfterInsert(state.annotations, event.atIndex, event.count),
    }));
  }
  if (event.type === 'DOCUMENT_REPLACED') {
    // New document — clear all annotations
    useAnnotationStore.setState({ annotations: [] });
  }
});
"""

if "const unsub = documentBus.subscribe(" not in content:
    content += store_sub

with open('frontend/src/core/annotations/store.ts', 'w') as f:
    f.write(content)

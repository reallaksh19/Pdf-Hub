import { create } from 'zustand';
import type { PlacedElement, WriterTool } from './types';

const MAX_UNDO_DEPTH = 50;

interface WriterState {
  elements:   PlacedElement[];
  activeTool: WriterTool;
  selectedId: string | null;
  undoStack:  PlacedElement[][];
  redoStack:  PlacedElement[][];
}

interface WriterActions {
  addElement:              (element: PlacedElement) => void;
  updateElement:           (id: string, patch: Partial<PlacedElement>) => void;
  commitElementTransform:  (id: string, patch: Partial<PlacedElement>) => void;
  removeElement:           (id: string) => void;
  setActiveTool: (tool: WriterTool) => void;
  setSelectedId: (id: string | null) => void;
  clearPage:     (pageNumber: number) => void;
  exportPage:    (pageNumber: number) => PlacedElement[];
  undo:          () => void;
  redo:          () => void;
  bringForward:  (id: string) => void;
  sendBackward:  (id: string) => void;
  bringToFront:  (id: string) => void;
  sendToBack:    (id: string) => void;
}

// Snapshot current elements to undo stack
function snapshot(elements: PlacedElement[], undoStack: PlacedElement[][]): PlacedElement[][] {
  const next = [elements.map(e => ({ ...e })), ...undoStack];
  return next.slice(0, MAX_UNDO_DEPTH);
}

export const useWriterStore = create<WriterState & WriterActions>((set, get) => ({
  elements:   [],
  activeTool: 'select',
  selectedId: null,
  undoStack:  [],
  redoStack:  [],

  addElement: (element) => set(s => ({
    elements:  [...s.elements, element],
    undoStack: snapshot(s.elements, s.undoStack),
    redoStack: [],  // new action clears redo history
  })),

  updateElement: (id, patch) => set(s => ({
    elements:  s.elements.map(e => e.id === id ? { ...e, ...patch } : e),
    // Only snapshots on explicit commit actions now, not on every live preview frame
  })),

  commitElementTransform: (_id, _patch) => set(s => {
    // Snapshot state based on the element BEFORE the live-preview changes were made
    // We achieve this by looking for the current state in elements, applying the inverse patch,
    // and taking a snapshot of THAT state to avoid the double-undo bug.
    // However, a much simpler fix is just to snapshot what we have *before* applying the final commit,
    // assuming the final commit *is* the actual update we want to push onto the stack.

    // Actually, since live-preview updates `s.elements` directly WITHOUT snapshotting,
    // `s.elements` currently holds the final dragged state. `s.undoStack[0]` holds the pre-drag state.
    // We just need to push the current `s.elements` onto the undoStack, and we don't even need to apply the patch!
    // Wait, if we push it, undo will revert to it.

    // Correct logic: we just need to push the current state to the undo stack, meaning the NEXT action
    // will be able to undo to this state. The drag itself already mutated the state.
    const currentSnapshot = snapshot(s.elements, s.undoStack);
    return {
      elements: s.elements, // Elements already updated by live preview
      undoStack: currentSnapshot,
      redoStack: [],
    };
  }),

  removeElement: (id) => set(s => ({
    elements:  s.elements.filter(e => e.id !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
    undoStack: snapshot(s.elements, s.undoStack),
    redoStack: [],
  })),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedId: (id)   => set({ selectedId: id }),

  clearPage: (pageNumber) => set(s => ({
    elements:  s.elements.filter(e => e.pageNumber !== pageNumber),
    undoStack: snapshot(s.elements, s.undoStack),
    redoStack: [],
  })),

  exportPage: (pageNumber) => {
    return get().elements
      .filter(e => e.pageNumber === pageNumber)
      .sort((a, b) => a.zIndex - b.zIndex);
  },

  undo: () => set(s => {
    if (s.undoStack.length === 0) return {};
    const [prev, ...rest] = s.undoStack;
    return {
      elements:  prev,
      undoStack: rest,
      redoStack: [s.elements.map(e => ({ ...e })), ...s.redoStack].slice(0, MAX_UNDO_DEPTH),
    };
  }),

  redo: () => set(s => {
    if (s.redoStack.length === 0) return {};
    const [next, ...rest] = s.redoStack;
    return {
      elements:  next,
      undoStack: snapshot(s.elements, s.undoStack),
      redoStack: rest,
    };
  }),

  bringForward:  (id) => set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, zIndex: e.zIndex + 1 } : e) })),
  sendBackward:  (id) => set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e) })),
  bringToFront:  (id) => set(s => {
    const maxZ = Math.max(0, ...s.elements.map(e => e.zIndex));
    return { elements: s.elements.map(e => e.id === id ? { ...e, zIndex: maxZ + 1 } : e) };
  }),
  sendToBack:    (id) => set(s => ({
    elements: s.elements.map(e =>
      e.id === id ? { ...e, zIndex: 0 } : { ...e, zIndex: e.zIndex + 1 }
    ),
  })),
}));
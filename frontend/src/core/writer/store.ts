import { create } from 'zustand';
import type { WriterState, WriterActions } from './types';

export const useWriterStore = create<WriterState & WriterActions>(() => ({
  isWriting: false,
  dummyAction: () => {
    throw new Error("Not implemented — owned by Agent F");
  }
}));
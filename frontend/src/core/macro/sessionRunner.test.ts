import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runMacroRecipeAgainstSession } from './sessionRunner';
import { useSessionStore } from '@/core/session/store';

const mockExecuteMacroRecipe = vi.hoisted(() => vi.fn());
const mockSavePdfBytes = vi.hoisted(() => vi.fn());
const mockReplaceWorkingCopy = vi.hoisted(() => vi.fn());
const mockSetSelectedPages = vi.hoisted(() => vi.fn());

vi.mock('./executor', () => ({
  executeMacroRecipe: mockExecuteMacroRecipe,
}));

vi.mock('@/adapters/file/FileAdapter', () => ({
  FileAdapter: {
    savePdfBytes: mockSavePdfBytes,
  },
}));

describe('runMacroRecipeAgainstSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.getState().openDocument({
      documentKey: 'macro-doc',
      fileName: 'macro.pdf',
      bytes: new Uint8Array([1, 2, 3]),
      pageCount: 3,
    });
    useSessionStore.getState().setSelectedPages([1, 2]);
    mockExecuteMacroRecipe.mockResolvedValue({
      workingBytes: new Uint8Array([4, 5, 6]),
      pageCount: 3,
      selectedPages: [2],
      logs: ['ok'],
      extractedOutputs: [],
      outputs: [],
    });
  });

  it('throws when session has no active document', async () => {
    useSessionStore.getState().clearDocument();
    await expect(
      runMacroRecipeAgainstSession({ id: 'r1', name: 'R1', steps: [] }),
    ).rejects.toThrow('No active document in session');
  });

  it('dispatches REPLACE_WORKING_COPY for normal runs', async () => {
    const origReplace = useSessionStore.getState().replaceWorkingCopy;
    useSessionStore.setState({
      replaceWorkingCopy: mockReplaceWorkingCopy,
      setSelectedPages: mockSetSelectedPages,
    });

    await runMacroRecipeAgainstSession({ id: 'r2', name: 'R2', steps: [] });

    expect(mockReplaceWorkingCopy).toHaveBeenCalledWith(
      expect.any(Uint8Array), 3
    );
    expect(mockSetSelectedPages).toHaveBeenCalledWith([2]);

    // restore
    useSessionStore.setState({
      replaceWorkingCopy: origReplace,
    });
  });

  it('saves extracted outputs when saveOutputs is true', async () => {
    mockExecuteMacroRecipe.mockResolvedValue({
      workingBytes: new Uint8Array([4, 5, 6]),
      pageCount: 3,
      selectedPages: [2],
      logs: ['ok'],
      extractedOutputs: [{ name: 'out.pdf', bytes: new Uint8Array([9]) }],
      outputs: [{ name: 'out.pdf', bytes: new Uint8Array([9]) }],
    });

    await runMacroRecipeAgainstSession({ id: 'r4', name: 'R4', steps: [] }, { saveOutputs: true });
    expect(mockSavePdfBytes).toHaveBeenCalledWith(new Uint8Array([9]), 'out.pdf', null);
  });
});

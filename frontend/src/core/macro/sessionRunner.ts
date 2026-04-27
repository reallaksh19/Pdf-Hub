import type { MacroRecipe } from './types';
import { executeMacroRecipe } from './executor';
import { useSessionStore } from '@/core/session/store';
import { FileAdapter } from '@/adapters/file/FileAdapter';

export async function runMacroRecipeAgainstSession(
  recipe: MacroRecipe,
  options?: {
    donorFiles?: Record<string, Uint8Array>;
    saveOutputs?: boolean;
    dryRun?: boolean;
    onProgress?: (progress: import('./executor').ExecutionProgress) => void;
  },
) {
  const session = useSessionStore.getState();

  if (!session.workingBytes || !session.fileName) {
    throw new Error('No active document in session');
  }

  const donorFiles = options?.donorFiles ?? {};
  const result = await executeMacroRecipe(
    {
      workingBytes: session.workingBytes,
      pageCount: session.pageCount,
      selectedPages: session.selectedPages,
      currentPage: session.viewState.currentPage,
      fileName: session.fileName,
      donorFiles,
      now: new Date(),
    },
    recipe,
    options?.onProgress
  );

  if (!options?.dryRun) {
    const { PdfEditAdapter } = await import('@/adapters/pdf-edit/PdfEditAdapter');
    const newPageCount = await PdfEditAdapter.countPages(result.finalBytes);
    const { dispatchCommand } = await import('@/core/commands/dispatch');
    await dispatchCommand({
      source: 'macro-runner',
      command: {
        type: 'REPLACE_WORKING_COPY',
        nextBytes: result.finalBytes,
        nextPageCount: newPageCount,
        reason: `Ran macro recipe ${recipe.name}`,
      },
    });
    useSessionStore.getState().setSelectedPages([]);
  }

  if (options?.saveOutputs) {
    for (const output of result.outputFiles) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  return result;
}

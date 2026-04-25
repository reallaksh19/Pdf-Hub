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
  },
) {
  const session = useSessionStore.getState();

  const donorFiles = options?.donorFiles ?? {};

  let workingBytes = session.workingBytes;
  let pageCount = session.pageCount;
  let selectedPages = session.selectedPages;
  let currentPage = session.viewState.currentPage;
  let fileName = session.fileName;

  if (recipe.init === 'new') {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    workingBytes = await doc.save();
    pageCount = 0;
    selectedPages = [];
    currentPage = 1;
    fileName = 'Generated Document.pdf';
  } else if (!workingBytes || !fileName) {
    throw new Error('No active document in session');
  }

  const result = await executeMacroRecipe(
    {
      workingBytes,
      pageCount,
      selectedPages,
      currentPage,
      fileName,
      donorFiles,
      now: new Date(),
    },
    recipe,
  );

  if (!options?.dryRun) {
    useSessionStore.getState().replaceWorkingCopy(result.workingBytes, result.pageCount);
    useSessionStore.getState().setSelectedPages(result.selectedPages);
  }

  if (options?.saveOutputs) {
    for (const output of result.extractedOutputs) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  return result;
}

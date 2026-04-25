import type { MacroRecipe } from './types';
import { executeMacroRecipe } from './executor';
import { useSessionStore } from '@/core/session/store';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { dispatchCommand } from '@/core/commands/dispatch';

export async function runMacroRecipeAgainstSession(
  recipe: MacroRecipe,
  options?: {
    donorFiles?: Record<string, Uint8Array>;
    saveOutputs?: boolean;
  },
) {
  let session = useSessionStore.getState();

  if (recipe.init === 'new' && (!session.workingBytes || !session.fileName)) {
    const emptyPdfBytes = await PdfEditAdapter.createEmptyPdf();
    const documentKey = `gen-${Date.now()}`;
    const fileName = recipe.name || 'Generated Document.pdf';
    session.openDocument({
      documentKey,
      fileName,
      bytes: emptyPdfBytes,
      pageCount: 0,
    });
    session = useSessionStore.getState();
  } else if (!session.workingBytes || !session.fileName) {
    throw new Error('No active document in session');
  }

  const donorFiles = options?.donorFiles ?? {};
  const result = await executeMacroRecipe(
    {
      workingBytes: session.workingBytes!,
      pageCount: session.pageCount,
      selectedPages: session.selectedPages,
      currentPage: session.viewState.currentPage,
      fileName: session.fileName!,
      donorFiles,
      now: new Date(),
    },
    recipe,
  );

  if (!recipe.dryRun) {
    await dispatchCommand(
      {
        type: 'REPLACE_WORKING_COPY',
        nextBytes: result.workingBytes,
        nextPageCount: result.pageCount,
      },
      'macro-runner',
    );
  }

  useSessionStore.getState().setSelectedPages(result.selectedPages);

  if (options?.saveOutputs) {
    for (const output of result.extractedOutputs) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  return result;
}

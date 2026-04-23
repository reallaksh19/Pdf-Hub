import { FileAdapter } from '@/adapters/file/FileAdapter';
import { dispatchCommand } from '@/core/commands/dispatch';
import { useSessionStore } from '@/core/session/store';
import { executeMacroRecipe } from './executor';
import type { MacroRecipe } from './types';

export async function runMacroRecipeAgainstSession(
  recipe: MacroRecipe,
  options?: {
    donorFiles?: Record<string, Uint8Array>;
    saveOutputs?: boolean;
    dryRun?: boolean;
  },
) {
  const session = useSessionStore.getState();

  if (!session.workingBytes || !session.fileName) {
    throw new Error('No active document in session');
  }

  const result = await executeMacroRecipe(
    {
      workingBytes: session.workingBytes,
      pageCount: session.pageCount,
      selectedPages: session.selectedPages,
      currentPage: session.viewState.currentPage,
      fileName: session.fileName,
      donorFiles: options?.donorFiles ?? {},
      now: new Date(),
    },
    recipe,
  );

  if (options?.dryRun !== true) {
    const commandResult = await dispatchCommand({
      source: 'macro-runner',
      command: {
        type: 'REPLACE_WORKING_COPY',
        nextBytes: result.workingBytes,
        nextPageCount: result.pageCount,
        reason: `Macro run: ${recipe.name}`,
      },
    });

    if (!commandResult.success) {
      throw new Error(commandResult.error?.message ?? commandResult.message);
    }

    useSessionStore.getState().setSelectedPages(result.selectedPages);
  }

  if (options?.saveOutputs) {
    for (const output of result.extractedOutputs) {
      await FileAdapter.savePdfBytes(output.bytes, output.name, null);
    }
  }

  return result;
}

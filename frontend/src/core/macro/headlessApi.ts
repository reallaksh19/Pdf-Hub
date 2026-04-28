import { executeMacroRecipe } from './executor';
import type { MacroRecipe } from './types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

export async function executeHeadlessMacro(
  basePdfBytes: Uint8Array,
  recipeDsl: string | MacroRecipe,
  fileName: string = 'headless.pdf',
  donorFiles: Record<string, Uint8Array> = {}
): Promise<Uint8Array> {
  const recipe: MacroRecipe = typeof recipeDsl === 'string' ? JSON.parse(recipeDsl) : recipeDsl;

  if (!recipe.id || !recipe.steps || !Array.isArray(recipe.steps)) {
    throw new Error('Invalid Headless Macro DSL: Missing id or steps array.');
  }

  const pageCount = await PdfEditAdapter.countPages(basePdfBytes);

  const result = await executeMacroRecipe(
    recipe,
    {
      workingBytes: basePdfBytes,
      pageCount,
      selectedPages: [],
      currentPage: 1,
      fileName,
      donorFiles,
      now: new Date(),
    }
  );

  return result.finalBytes;
}

declare global {
  interface Window {
    PDFHubHeadless?: {
      execute: typeof executeHeadlessMacro;
    };
  }
}

if (typeof window !== 'undefined') {
  window.PDFHubHeadless = {
    execute: executeHeadlessMacro,
  };
}
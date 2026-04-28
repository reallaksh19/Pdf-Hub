/* eslint-disable @typescript-eslint/no-explicit-any */
import { macroRegistry } from '../registry';
import type { StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext } from '../types';
import { PdfEditAdapter } from '../../../adapters/pdf-edit/PdfEditAdapter';

async function executeMergeFiles(
  step: any,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    if (!step.donorFileIds || step.donorFileIds.length === 0) {
      return { status: 'warning', message: 'No files to merge', sideEffects: [] };
    }

    let currentBytes = state.workingBytes;
    for (const donorId of step.donorFileIds) {
      const donorBytes = ctx.donorFiles?.[donorId];
      if (donorBytes) {
        currentBytes = await PdfEditAdapter.mergePdfs([currentBytes, donorBytes]);
      }
    }

    const pageCount = await PdfEditAdapter.countPages(currentBytes);
    return {
      status: 'success',
      message: `Merged ${step.donorFileIds.length} file(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount: pageCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeInsertPdf(
  step: any,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donorBytes = ctx.donorFiles?.[step.donorFileId];
    if (!donorBytes) {
      return { status: 'error', message: `Missing donor file: ${step.donorFileId}`, sideEffects: [] };
    }

    let atIndex = state.pageCount;
    if (step.position.mode === 'start') atIndex = 0;
    else if (step.position.mode === 'end') atIndex = state.pageCount;
    else if (step.position.mode === 'before') atIndex = Math.max(0, step.position.page - 1);
    else if (step.position.mode === 'after') atIndex = Math.min(state.pageCount, step.position.page);

    const updatedBytes = await PdfEditAdapter.insertPdf(state.workingBytes, atIndex, donorBytes);
    const pageCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Inserted PDF at page ${atIndex}`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: pageCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

macroRegistry.register('merge_files', executeMergeFiles);
macroRegistry.register('insert_pdf', executeInsertPdf);

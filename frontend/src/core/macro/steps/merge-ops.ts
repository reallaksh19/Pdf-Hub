import { macroRegistry, StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext, MacroStep } from '../types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { clamp } from './utils';

type MergeFilesStep = Extract<MacroStep, { op: 'merge_files' }>;

async function executeMergeFiles(
  step: MergeFilesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donors = step.donorFileIds
      .map((id) => ctx.donorFiles[id])
      .filter((value): value is Uint8Array => value instanceof Uint8Array);

    if (donors.length === 0) {
      return { status: 'warning', message: 'Skipped merge_files: no donor files found', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.merge(state.workingBytes, donors);
    const newCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Merged ${donors.length} donor file(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type InsertPdfStep = Extract<MacroStep, { op: 'insert_pdf' }>;

async function executeInsertPdf(
  step: InsertPdfStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donor = ctx.donorFiles[step.donorFileId];
    if (!donor) {
      return { status: 'warning', message: `Skipped insert_pdf: missing donor file ${step.donorFileId}`, sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.insertAt(
      state.workingBytes,
      donor,
      clamp(step.atIndex, 0, state.pageCount),
    );
    const newCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Inserted donor PDF at index ${step.atIndex}`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

macroRegistry.register('merge_files', executeMergeFiles);
macroRegistry.register('insert_pdf', executeInsertPdf);

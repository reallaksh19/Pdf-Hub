/* eslint-disable @typescript-eslint/no-explicit-any */
import { macroRegistry } from '../registry';
import type { StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext, PageSelector } from '../types';
import { PdfEditAdapter } from '../../../adapters/pdf-edit/PdfEditAdapter';

// PageSelector helper — reuse across all page-targeting executors
export function resolveSelector(selector: PageSelector | undefined, state: MacroMutableState): number[] {
  if (!selector) return state.selectedPages;
  if (selector.mode === 'all')      return Array.from({ length: state.pageCount }, (_, i) => i + 1);
  if (selector.mode === 'odd')      return Array.from({ length: state.pageCount }, (_, i) => i + 1).filter(p => p % 2 === 1);
  if (selector.mode === 'even')     return Array.from({ length: state.pageCount }, (_, i) => i + 1).filter(p => p % 2 === 0);
  if (selector.mode === 'selected') return state.selectedPages;
  if (selector.mode === 'list')     return selector.pages;
  if (selector.mode === 'range')    return Array.from({ length: selector.to - selector.from + 1 }, (_, i) => selector.from + i);
  if (selector.mode === 'current')  return state.selectedPages;
  return [];
}

async function executeRotatePages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const updatedBytes = await PdfEditAdapter.rotatePages(state.workingBytes, pages.map(p => p - 1), step.degrees);
    return {
      status: 'success',
      message: `Rotated ${pages.length} page(s) by ${step.degrees}°`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeExtractPages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const extractedBytes = await PdfEditAdapter.extractPages(state.workingBytes, pages.map(p => p - 1));
    return {
      status: 'success',
      message: `Extracted ${pages.length} page(s)`,
      sideEffects: [{ type: 'output_file', name: step.outputName || 'extracted.pdf', bytes: extractedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeSplitPages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const extractedBytes = await PdfEditAdapter.extractPages(state.workingBytes, pages.map(p => p - 1));
    const updatedBytes = await PdfEditAdapter.removePages(state.workingBytes, pages.map(p => p - 1));
    const pageCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Split pages`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: pageCount },
        { type: 'output_file', name: step.outputName ?? `split-${pages.join('-')}.pdf`, bytes: extractedBytes }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeDuplicatePages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const updatedBytes = await PdfEditAdapter.duplicatePages(state.workingBytes, pages.map(p => p - 1));
    const pageCount = await PdfEditAdapter.countPages(updatedBytes);
    return {
      status: 'success',
      message: `Duplicated ${pages.length} page(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: pageCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeRemovePages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const updatedBytes = await PdfEditAdapter.removePages(state.workingBytes, pages.map(p => p - 1));
    const pageCount = await PdfEditAdapter.countPages(updatedBytes);
    return {
      status: 'success',
      message: `Removed ${pages.length} page(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: pageCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeInsertBlankPage(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    let atIndex = 0;
    if (step.position.mode === 'start') atIndex = 0;
    else if (step.position.mode === 'end') atIndex = state.pageCount;
    else if (step.position.mode === 'before') atIndex = Math.max(0, step.position.page - 1);
    else if (step.position.mode === 'after') atIndex = Math.min(state.pageCount, step.position.page);

    let size = step.size;
    if (size === 'a4') size = { width: 595, height: 842 };
    else if (size === 'letter') size = { width: 612, height: 792 };
    else if (size === 'match-current') {
      const refIdx = Math.max(0, Math.min(state.pageCount - 1, atIndex === state.pageCount ? state.pageCount - 1 : atIndex));
      size = await PdfEditAdapter.getPageSize(state.workingBytes, refIdx);
    }

    const count = Math.max(1, step.count ?? 1);
    let currentBytes = state.workingBytes;
    for (let i = 0; i < count; i++) {
        currentBytes = await PdfEditAdapter.insertBlankPage(currentBytes, atIndex, size);
    }
    const pageCount = await PdfEditAdapter.countPages(currentBytes);
    return {
      status: 'success',
      message: `Inserted ${count} blank page(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount: pageCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeReplacePage(
  step: any,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donor = ctx.donorFiles[step.donorFileId];
    if (!donor) return { status: 'error', message: `Missing donor file: ${step.donorFileId}`, sideEffects: [] };
    const updatedBytes = await PdfEditAdapter.replacePage(state.workingBytes, step.targetPage - 1, donor, step.donorPage - 1);
    return {
      status: 'success',
      message: `Replaced page ${step.targetPage}`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeReorderPages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    if (step.order.length !== state.pageCount) {
      return { status: 'error', message: 'Order length does not match page count', sideEffects: [] };
    }
    const updatedBytes = await PdfEditAdapter.reorderPages(state.workingBytes, step.order.map((p: number) => p - 1));
    return {
      status: 'success',
      message: `Reordered pages`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function executeSelectPages(
  step: any,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    state.selectedPages = pages;
    return {
      status: 'success',
      message: `Selected ${pages.length} page(s)`,
      sideEffects: [],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

macroRegistry.register('rotate_pages', executeRotatePages);
macroRegistry.register('extract_pages', executeExtractPages);
macroRegistry.register('split_pages', executeSplitPages);
macroRegistry.register('duplicate_pages', executeDuplicatePages);
macroRegistry.register('remove_pages', executeRemovePages);
macroRegistry.register('insert_blank_page', executeInsertBlankPage);
macroRegistry.register('replace_page', executeReplacePage);
macroRegistry.register('reorder_pages', executeReorderPages);
macroRegistry.register('select_pages', executeSelectPages);

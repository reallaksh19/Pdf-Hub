import { macroRegistry, StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext, MacroStep } from '../types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { resolvePageSelector, resolveInsertIndex, resolveBlankPageSize } from './utils';

type RotatePagesStep = Extract<MacroStep, { op: 'rotate_pages' }>;

async function executeRotatePages(
  step: RotatePagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });
    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped rotate_pages: no pages selected', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.rotatePages(
      state.workingBytes,
      pages.map((p) => p - 1),
      step.degrees,
    );

    return {
      status: 'success',
      message: `Rotated pages ${pages.join(', ')} by ${step.degrees}°`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type ExtractPagesStep = Extract<MacroStep, { op: 'extract_pages' }>;

async function executeExtractPages(
  step: ExtractPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });
    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped extract_pages: no pages selected', sideEffects: [] };
    }

    const bytes = await PdfEditAdapter.extractPages(
      state.workingBytes,
      pages.map((p) => p - 1),
    );

    return {
      status: 'success',
      message: `Extracted pages: ${pages.join(', ')}`,
      sideEffects: [
        { type: 'output_file', name: step.outputName ?? `extract-${pages.join('-')}.pdf`, bytes }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type SplitPagesStep = Extract<MacroStep, { op: 'split_pages' }>;

async function executeSplitPages(
  step: SplitPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });
    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped split_pages: no pages selected', sideEffects: [] };
    }

    const extracted = await PdfEditAdapter.extractPages(
      state.workingBytes,
      pages.map((p) => p - 1),
    );

    const updatedBytes = await PdfEditAdapter.removePages(
      state.workingBytes,
      pages.map((p) => p - 1),
    );
    const newCount = await PdfEditAdapter.countPages(updatedBytes);

    // Selected pages are cleared by split
    state.selectedPages = [];

    return {
      status: 'success',
      message: `Split out pages: ${pages.join(', ')}`,
      sideEffects: [
        { type: 'output_file', name: step.outputName ?? `split-${pages.join('-')}.pdf`, bytes: extracted },
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type DuplicatePagesStep = Extract<MacroStep, { op: 'duplicate_pages' }>;

async function executeDuplicatePages(
  step: DuplicatePagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });
    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped duplicate_pages: no pages selected', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.duplicatePages(
      state.workingBytes,
      pages.map((p) => p - 1),
    );
    const newCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Duplicated pages: ${pages.join(', ')}`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type RemovePagesStep = Extract<MacroStep, { op: 'remove_pages' }>;

async function executeRemovePages(
  step: RemovePagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });
    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped remove_pages: no pages selected', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.removePages(
      state.workingBytes,
      pages.map((p) => p - 1),
    );
    const newCount = await PdfEditAdapter.countPages(updatedBytes);

    // Selected pages are cleared by remove
    state.selectedPages = [];

    return {
      status: 'success',
      message: `Removed pages: ${pages.join(', ')}`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type InsertBlankPageStep = Extract<MacroStep, { op: 'insert_blank_page' }>;

async function executeInsertBlankPage(
  step: InsertBlankPageStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const count = Math.max(1, step.count ?? 1);
    let currentBytes = state.workingBytes;
    let currentCount = state.pageCount;

    for (let index = 0; index < count; index += 1) {
      const atIndex = await resolveInsertIndex(step.position, ctx.currentPage, currentCount);
      const size = await resolveBlankPageSize(
        step.size,
        currentBytes,
        atIndex,
        currentCount,
      );

      currentBytes = await PdfEditAdapter.insertBlankPage(currentBytes, atIndex, size);
      currentCount = await PdfEditAdapter.countPages(currentBytes);
    }

    return {
      status: 'success',
      message: `Inserted ${count} blank page(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount: currentCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type ReplacePageStep = Extract<MacroStep, { op: 'replace_page' }>;

async function executeReplacePage(
  step: ReplacePageStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donor = ctx.donorFiles[step.donorFileId];
    if (!donor) {
      return { status: 'warning', message: `Skipped replace_page: missing donor file ${step.donorFileId}`, sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.replacePage(
      state.workingBytes,
      step.targetPage - 1,
      donor,
      step.donorPage - 1,
    );

    return {
      status: 'success',
      message: `Replaced page ${step.targetPage} with donor page ${step.donorPage}`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type ReorderPagesStep = Extract<MacroStep, { op: 'reorder_pages' }>;

async function executeReorderPages(
  step: ReorderPagesStep,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    if (step.order.length !== state.pageCount) {
      return { status: 'warning', message: 'Skipped reorder_pages: order length does not match page count', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.reorderPages(
      state.workingBytes,
      step.order.map((p) => p - 1),
    );
    const newCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: 'Reordered pages',
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type SelectPagesStep = Extract<MacroStep, { op: 'select_pages' }>;

async function executeSelectPages(
  step: SelectPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    state.selectedPages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });
    return {
      status: 'success',
      message: `Selected pages: ${state.selectedPages.join(', ') || 'none'}`,
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

import { macroRegistry, StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext, MacroStep } from '../types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { resolveInsertIndex } from './utils';

type AddContentPageStep = Extract<MacroStep, { op: 'add_content_page' }>;

async function executeAddContentPage(
  step: AddContentPageStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const { renderPageToImageBytes } = await import('../layout/pageRenderer');
    const imageBytes = await renderPageToImageBytes({
      size: step.size ?? 'a4',
      background: step.background,
      blocks: step.blocks,
    });

    const atIndex = await resolveInsertIndex(step.position, ctx.currentPage, state.pageCount);
    const size = step.size === 'letter' ? { width: 612, height: 792 } : { width: 595, height: 842 };

    let currentBytes = state.workingBytes;
    currentBytes = await PdfEditAdapter.insertBlankPage(currentBytes, atIndex, size);
    const newCount = await PdfEditAdapter.countPages(currentBytes);

    currentBytes = await PdfEditAdapter.insertImage(currentBytes, {
      pages: [atIndex],
      imageBytes,
      mimeType: 'image/png',
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    });

    return {
      status: 'success',
      message: `Generated content page at index ${atIndex + 1}`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type AddImageHeaderPageStep = Extract<MacroStep, { op: 'add_image_header_page' }>;

async function executeAddImageHeaderPage(
  step: AddImageHeaderPageStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const { renderPageToImageBytes } = await import('../layout/pageRenderer');

    const imageBytes = await renderPageToImageBytes({
      size: step.size ?? 'a4',
      blocks: [
        { type: 'image-header', src: step.imageSrc, height: step.headerHeight ?? 200 },
        { type: 'heading', text: step.title, level: 1 as const },
        ...(step.subtitle ? [{ type: 'heading' as const, text: step.subtitle, level: 3 as const, color: '#64748b' }] : []),
        { type: 'divider' },
        ...(step.bodyMarkdown ? [{ type: 'rich-text' as const, markdown: step.bodyMarkdown }] : []),
      ],
    });

    const atIndex = await resolveInsertIndex(step.position, ctx.currentPage, state.pageCount);
    const size = step.size === 'letter' ? { width: 612, height: 792 } : { width: 595, height: 842 };

    let currentBytes = state.workingBytes;
    currentBytes = await PdfEditAdapter.insertBlankPage(currentBytes, atIndex, size);
    const newCount = await PdfEditAdapter.countPages(currentBytes);

    currentBytes = await PdfEditAdapter.insertImage(currentBytes, {
      pages: [atIndex],
      imageBytes,
      mimeType: 'image/png',
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    });

    return {
      status: 'success',
      message: `Generated branded header page: "${step.title}" at index ${atIndex + 1}`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount }
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

macroRegistry.register('add_content_page', executeAddContentPage);
macroRegistry.register('add_image_header_page', executeAddImageHeaderPage);

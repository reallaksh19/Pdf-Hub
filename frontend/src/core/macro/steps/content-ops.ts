import { macroRegistry } from '../registry';
import type { StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext, MacroStep } from '../types';
import { PdfEditAdapter } from '../../../adapters/pdf-edit/PdfEditAdapter';
import { resolveSelector } from './page-ops';

type DrawTextOnPagesStep = Extract<MacroStep, { op: 'draw_text_on_pages' }>;
async function executeDrawTextOnPages(
  step: DrawTextOnPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage });
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const updatedBytes = await PdfEditAdapter.drawTextOnPages(state.workingBytes, {
      pages: pages.map((p) => p - 1),
      text: step.text,
      x: step.x,
      y: step.y,
      fontSize: step.fontSize,
      color: step.color ?? '#111827',
      opacity: step.opacity ?? 0.95,
      align: step.align ?? 'left',
      fileName: ctx.fileName,
      now: ctx.now ?? new Date(),
      enablePageNumberToken: step.pageNumberToken ?? true,
      enableFileNameToken: step.fileNameToken ?? false,
      enableDateToken: step.dateToken ?? false,
    });
    return {
      status: 'success',
      message: `Drew text on ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}
macroRegistry.register('draw_text_on_pages', executeDrawTextOnPages);

type InjectRichTextStep = Extract<MacroStep, { op: 'inject_rich_text' }>;
async function executeInjectRichText(
  step: InjectRichTextStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage });
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const updatedBytes = await PdfEditAdapter.drawTextOnPages(state.workingBytes, {
      pages: pages.map((p) => p - 1),
      text: step.text,
      x: step.x,
      y: step.y,
      fontSize: step.fontSize,
      color: step.color ?? '#0f172a',
      opacity: step.opacity ?? 1,
      align: step.textAlign === 'justify' ? 'left' : (step.textAlign ?? 'left'),
      fileName: ctx.fileName,
      now: ctx.now ?? new Date(),
      enablePageNumberToken: step.pageNumberToken ?? true,
      enableFileNameToken: step.fileNameToken ?? false,
      enableDateToken: step.dateToken ?? false,
    });
    return {
      status: 'success',
      message: `Injected rich text on ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}
macroRegistry.register('inject_rich_text', executeInjectRichText);

type HeaderFooterTextStep = Extract<MacroStep, { op: 'header_footer_text' }>;
async function executeHeaderFooterText(
  step: HeaderFooterTextStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage }).filter(page => {
      if (step.excludeFirstPage && page === 1) return false;
      if (step.excludeLastPage && page === state.pageCount) return false;
      return true;
    });

    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.addHeaderFooterText(state.workingBytes, {
      pages: pages.map((p) => p - 1),
      zone: step.zone,
      text: step.text,
      align: step.align,
      marginX: step.marginX,
      marginY: step.marginY,
      fontSize: step.fontSize,
      color: step.color ?? '#374151',
      opacity: step.opacity ?? 0.9,
      fileName: ctx.fileName,
      now: ctx.now ?? new Date(),
      enablePageNumberToken: step.pageNumberToken ?? true,
      enableFileNameToken: step.fileNameToken ?? false,
      enableDateToken: step.dateToken ?? false,
    });
    return {
      status: 'success',
      message: `Applied ${step.zone} text to ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}
macroRegistry.register('header_footer_text', executeHeaderFooterText);

type PlaceRichTextboxStep = Extract<MacroStep, { op: 'place_rich_textbox' }>;
async function executePlaceRichTextbox(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _step: PlaceRichTextboxStep,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: MacroExecutionContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _state: MacroMutableState,
): Promise<StepResult> {
  // Stub for Agent E
  return { status: 'success', message: 'Place rich textbox stub', sideEffects: [] };
}
macroRegistry.register('place_rich_textbox', executePlaceRichTextbox);

type PlaceTableStep = Extract<MacroStep, { op: 'place_table' }>;
async function executePlaceTable(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _step: PlaceTableStep,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: MacroExecutionContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _state: MacroMutableState,
): Promise<StepResult> {
  // Stub for Agent E
  return { status: 'success', message: 'Place table stub', sideEffects: [] };
}
macroRegistry.register('place_table', executePlaceTable);

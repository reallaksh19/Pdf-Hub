import { macroRegistry, StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext, MacroStep } from '../types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { resolvePageSelector } from './utils';

type DrawTextOnPagesStep = Extract<MacroStep, { op: 'draw_text_on_pages' }>;

async function executeDrawTextOnPages(
  step: DrawTextOnPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });

    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped draw_text_on_pages: no pages selected', sideEffects: [] };
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
      now: ctx.now,
      enablePageNumberToken: step.pageNumberToken ?? true,
      enableFileNameToken: step.fileNameToken ?? false,
      enableDateToken: step.dateToken ?? false,
    });

    return {
      status: 'success',
      message: `Drew text on pages: ${pages.join(', ')}`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type InsertImageStep = Extract<MacroStep, { op: 'insert_image' }>;

async function executeInsertImage(
  step: InsertImageStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });

    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped insert_image: no pages selected', sideEffects: [] };
    }

    let imageBytes: Uint8Array | undefined;
    let mimeType: 'image/jpeg' | 'image/png' = 'image/png';

    if (step.donorFileId && ctx.donorFiles[step.donorFileId]) {
       imageBytes = ctx.donorFiles[step.donorFileId];
       if (imageBytes[0] === 0xff && imageBytes[1] === 0xd8) {
         mimeType = 'image/jpeg';
       }
    } else if (step.base64Image) {
      const match = step.base64Image.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1] === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        const binaryString = atob(match[2]);
        imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            imageBytes[i] = binaryString.charCodeAt(i);
        }
      }
    }

    if (!imageBytes) {
      return { status: 'warning', message: 'Skipped insert_image: no valid image data found', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.insertImage(state.workingBytes, {
      pages: pages.map((p) => p - 1),
      imageBytes,
      mimeType,
      x: step.x,
      y: step.y,
      width: step.width,
      height: step.height,
      scale: step.scale,
    });

    return {
      status: 'success',
      message: `Inserted image to pages: ${pages.join(', ')}`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type InjectRichTextStep = Extract<MacroStep, { op: 'inject_rich_text' }>;

async function executeInjectRichText(
  step: InjectRichTextStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    });

    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped inject_rich_text: no pages selected', sideEffects: [] };
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
      now: ctx.now,
      enablePageNumberToken: step.pageNumberToken ?? true,
      enableFileNameToken: step.fileNameToken ?? false,
      enableDateToken: step.dateToken ?? false,
    });

    return {
      status: 'success',
      message: `Injected rich text to pages: ${pages.join(', ')}`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type HeaderFooterTextStep = Extract<MacroStep, { op: 'header_footer_text' }>;

async function executeHeaderFooterText(
  step: HeaderFooterTextStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolvePageSelector(step.selector, state.pageCount, {
      currentPage: ctx.currentPage,
      selectedPages: state.selectedPages,
    }).filter((page) => {
      if (step.excludeFirstPage && page === 1) {
        return false;
      }
      if (step.excludeLastPage && page === state.pageCount) {
        return false;
      }
      return true;
    });

    if (pages.length === 0) {
      return { status: 'warning', message: 'Skipped header_footer_text: no pages selected', sideEffects: [] };
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
      now: ctx.now,
      enablePageNumberToken: step.pageNumberToken ?? true,
      enableFileNameToken: step.fileNameToken ?? false,
      enableDateToken: step.dateToken ?? false,
    });

    return {
      status: 'success',
      message: `Applied ${step.zone} text to pages: ${pages.join(', ')}`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

type PlaceRichTextboxStep = Extract<MacroStep, { op: 'place_rich_textbox' }>;

async function executePlaceRichTextbox(
  step: PlaceRichTextboxStep,
  _ctx: MacroExecutionContext,
  _state: MacroMutableState,
): Promise<StepResult> {
  return { status: 'warning', message: `Not implemented yet: ${step.op}`, sideEffects: [] };
}

type PlaceTableStep = Extract<MacroStep, { op: 'place_table' }>;

async function executePlaceTable(
  step: PlaceTableStep,
  _ctx: MacroExecutionContext,
  _state: MacroMutableState,
): Promise<StepResult> {
  return { status: 'warning', message: `Not implemented yet: ${step.op}`, sideEffects: [] };
}

type AdjustImageStep = Extract<MacroStep, { op: 'adjust_image' }>;

async function executeAdjustImage(
  step: AdjustImageStep,
  _ctx: MacroExecutionContext,
  _state: MacroMutableState,
): Promise<StepResult> {
  return { status: 'warning', message: `Not implemented yet: ${step.op}`, sideEffects: [] };
}

macroRegistry.register('draw_text_on_pages', executeDrawTextOnPages);
macroRegistry.register('insert_image', executeInsertImage);
macroRegistry.register('inject_rich_text', executeInjectRichText);
macroRegistry.register('header_footer_text', executeHeaderFooterText);
macroRegistry.register('place_rich_textbox', executePlaceRichTextbox);
macroRegistry.register('place_table', executePlaceTable);
macroRegistry.register('adjust_image', executeAdjustImage);

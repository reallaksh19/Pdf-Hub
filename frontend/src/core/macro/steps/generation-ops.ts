/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { macroRegistry } from '../registry';
import type { StepResult, MacroMutableState } from '../registry';
import type { MacroExecutionContext } from '../types';
import { PdfEditAdapter } from '../../../adapters/pdf-edit/PdfEditAdapter';
import { resolveSelector } from './page-ops';

async function executeInsertImage(
  step: any,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    let imageBytes: Uint8Array | undefined;
    let mimeType: 'image/jpeg' | 'image/png' = 'image/png';

    if (step.donorFileId && ctx.donorFiles?.[step.donorFileId]) {
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
      return { status: 'error', message: 'No valid image data found', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.insertImage(state.workingBytes, {
      pages: pages.map(p => p - 1),
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
      message: `Inserted image to ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: updatedBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

// Stubs for Agent E
async function executeAddContentPage(
  _step: any,
  _ctx: MacroExecutionContext,
  _state: MacroMutableState,
): Promise<StepResult> {
  return { status: 'success', message: `add_content_page stub`, sideEffects: [] };
}
async function executeAddImageHeaderPage(
  _step: any,
  _ctx: MacroExecutionContext,
  _state: MacroMutableState,
): Promise<StepResult> {
  return { status: 'success', message: `add_image_header_page stub`, sideEffects: [] };
}
async function executeAdjustImage(
  _step: any,
  _ctx: MacroExecutionContext,
  _state: MacroMutableState,
): Promise<StepResult> {
  return { status: 'success', message: `adjust_image stub`, sideEffects: [] };
}

macroRegistry.register('insert_image', executeInsertImage);
macroRegistry.register('add_content_page', executeAddContentPage);
macroRegistry.register('add_image_header_page', executeAddImageHeaderPage);
macroRegistry.register('adjust_image', executeAdjustImage);

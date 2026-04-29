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

import html2canvas from 'html2canvas';

type PlaceRichTextboxStep = Extract<MacroStep, { op: 'place_rich_textbox' }>;
async function executePlaceRichTextbox(
  step: PlaceRichTextboxStep,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    // Render HTML to PNG bytes via offscreen DOM
    const pngBytes = await renderHtmlToPng(step.content, step.width, step.height ?? 80, step.styles);

    let currentBytes = state.workingBytes;

    for (const pageNumber of pages) {
      currentBytes = await PdfEditAdapter.insertImage(currentBytes, {
        pages: [pageNumber - 1],
        x:           step.x,
        y:           step.y,
        width:       step.width,
        height:      step.height ?? 80,
        imageBytes:  pngBytes,
        opacity:     step.styles.opacity ?? 1,
        borderWidth: step.styles.borderWidth,
        borderColor: step.styles.borderColor,
      });
    }

    return {
      status: 'success',
      message: `Placed rich text on ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: currentBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function renderHtmlToPng(
  htmlContent: string,
  width: number,
  height: number,
  styles: import('../../writer/types').PlacedElementStyles,
): Promise<Uint8Array> {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position:        'absolute',
    left:            '-9999px',
    top:             '-9999px',
    width:           `${width}px`,
    height:          `${height}px`,
    overflow:        'hidden',
    backgroundColor: styles.backgroundColor ?? 'transparent',
    fontSize:        styles.fontSize ? `${styles.fontSize}px` : '12px',
    fontFamily:      styles.fontFamily ?? 'sans-serif',
    color:           styles.color ?? '#000000',
    padding:         styles.padding ? `${styles.padding}px` : '4px',
    lineHeight:      styles.lineHeight ? String(styles.lineHeight) : '1.4',
    textAlign:       styles.textAlign ?? 'left',
    boxSizing:       'border-box',
  });
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      width,
      height,
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });

    return await new Promise<Uint8Array>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('html2canvas returned no blob')); return; }
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf))).catch(reject);
      }, 'image/png');
    });
  } finally {
    document.body.removeChild(container);
  }
}
macroRegistry.register('place_rich_textbox', executePlaceRichTextbox);

type PlaceTableStep = Extract<MacroStep, { op: 'place_table' }>;
async function executePlaceTable(
  step: PlaceTableStep,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    const pngBytes = await renderTableToPng(step);

    const rowHeight = step.styles?.rowHeight ?? 24;
    const height    = (1 + step.rows.length) * rowHeight;

    let currentBytes = state.workingBytes;
    for (const pageNumber of pages) {
      currentBytes = await PdfEditAdapter.insertImage(currentBytes, {
        pages: [pageNumber - 1],
        x:          step.x,
        y:          step.y,
        width:      step.width,
        height,
        imageBytes: pngBytes,
      });
    }

    return {
      status: 'success',
      message: `Placed table (${step.headers.length} cols × ${step.rows.length} rows) on ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: currentBytes }],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}

async function renderTableToPng(step: PlaceTableStep): Promise<Uint8Array> {
  const { headers, rows, styles = {}, width } = step;
  const rowHeight   = styles.rowHeight   ?? 24;
  const fontSize    = styles.fontSize    ?? 11;
  const headerBg    = styles.headerBg    ?? '#f1f5f9';
  const borderColor = styles.borderColor ?? '#d1d5db';

  const colWidth = Math.floor(width / headers.length);
  const headerCells = headers.map(h =>
    `<td style="padding:4px 6px;font-weight:500;background:${headerBg};border:1px solid ${borderColor};width:${colWidth}px">${h}</td>`
  ).join('');
  const bodyRows = rows.map(row =>
    `<tr>${row.map(cell =>
      `<td style="padding:4px 6px;border:1px solid ${borderColor};width:${colWidth}px">${cell}</td>`
    ).join('')}</tr>`
  ).join('');

  const tableHtml = `
    <table style="border-collapse:collapse;width:${width}px;font-size:${fontSize}px;font-family:sans-serif">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;

  const totalHeight = (1 + rows.length) * rowHeight;
  return renderHtmlToPng(tableHtml, width, totalHeight, {});
}
macroRegistry.register('place_table', executePlaceTable);

type AdjustImageStep = {
  op:           'adjust_image';
  selector:     import('../types').PageSelector;
  x:            number;
  y:            number;
  width:        number;
  height:       number;
  opacity?:     number;
  borderWidth?: number;
  borderColor?: string;
  rotation?:    number;
  base64Image?: string;
  donorFileId?: string;
};

async function executeAdjustImage(
  step: AdjustImageStep,
  ctx: import('../types').MacroExecutionContext,
  state: import('../registry').MacroMutableState,
): Promise<import('../registry').StepResult> {
  try {
    let imageBytes: string | Uint8Array | undefined;

    if (step.base64Image) {
      imageBytes = step.base64Image;
    } else if (step.donorFileId) {
      const donorBytes = ctx.fileRegistry?.get(step.donorFileId) || ctx.donorFiles?.[step.donorFileId];
      if (!donorBytes) {
        return {
          status:     'error',
          message:    `donorFileId "${step.donorFileId}" not found in file registry`,
          sideEffects: [],
        };
      }
      imageBytes = donorBytes;
    } else {
      return {
        status:     'error',
        message:    'adjust_image requires either base64Image or donorFileId',
        sideEffects: [],
      };
    }

    const pages = resolveSelector(step.selector, state);
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    let currentBytes = state.workingBytes;

    for (const pageNumber of pages) {
      currentBytes = await PdfEditAdapter.insertImage(currentBytes, {
        pages: [pageNumber - 1],
        x:           step.x,
        y:           step.y,
        width:       step.width,
        height:      step.height,
        imageBytes,
        opacity:     step.opacity,
        borderWidth: step.borderWidth,
        borderColor: step.borderColor,
        rotation:    step.rotation,
      });
    }

    return {
      status:     'success',
      message:    `Placed image on ${pages.length} page(s)`,
      sideEffects: [{ type: 'bytes_updated', bytes: currentBytes }],
    };
  } catch (err) {
    return {
      status:     'error',
      message:    err instanceof Error ? err.message : String(err),
      sideEffects: [],
    };
  }
}
macroRegistry.register('adjust_image', executeAdjustImage as unknown as import('../registry').StepExecutor<Extract<MacroStep, { op: 'adjust_image' }>>);

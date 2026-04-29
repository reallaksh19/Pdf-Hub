const fs = require('fs');
let content = fs.readFileSync('frontend/src/core/macro/steps/content-ops.ts', 'utf8');

const regex = /type PlaceRichTextboxStep = Extract<MacroStep, \{ op: 'place_rich_textbox' \}>;[\s\S]*?macroRegistry\.register\('place_table', executePlaceTable\);/g;

const replacement = `import html2canvas from 'html2canvas';

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
      message: \`Placed rich text on \${pages.length} page(s)\`,
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
    width:           \`\${width}px\`,
    height:          \`\${height}px\`,
    overflow:        'hidden',
    backgroundColor: styles.backgroundColor ?? 'transparent',
    fontSize:        styles.fontSize ? \`\${styles.fontSize}px\` : '12px',
    fontFamily:      styles.fontFamily ?? 'sans-serif',
    color:           styles.color ?? '#000000',
    padding:         styles.padding ? \`\${styles.padding}px\` : '4px',
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
      message: \`Placed table (\${step.headers.length} cols × \${step.rows.length} rows) on \${pages.length} page(s)\`,
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
    \`<td style="padding:4px 6px;font-weight:500;background:\${headerBg};border:1px solid \${borderColor};width:\${colWidth}px">\${h}</td>\`
  ).join('');
  const bodyRows = rows.map(row =>
    \`<tr>\${row.map(cell =>
      \`<td style="padding:4px 6px;border:1px solid \${borderColor};width:\${colWidth}px">\${cell}</td>\`
    ).join('')}</tr>\`
  ).join('');

  const tableHtml = \`
    <table style="border-collapse:collapse;width:\${width}px;font-size:\${fontSize}px;font-family:sans-serif">
      <thead><tr>\${headerCells}</tr></thead>
      <tbody>\${bodyRows}</tbody>
    </table>
  \`;

  const totalHeight = (1 + rows.length) * rowHeight;
  return renderHtmlToPng(tableHtml, width, totalHeight, {});
}
macroRegistry.register('place_table', executePlaceTable);`;

content = content.replace(regex, replacement);
if (!content.includes('html2canvas')) {
    console.log("Not found to replace properly");
}
fs.writeFileSync('frontend/src/core/macro/steps/content-ops.ts', content);

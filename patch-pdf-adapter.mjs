import { readFileSync, writeFileSync } from 'fs';

const FILE = 'frontend/src/adapters/pdf-edit/PdfEditAdapter.ts';
let content = readFileSync(FILE, 'utf8');

const INTERFACE_ANCHOR = 'export class PdfEditAdapter {';

const INTERFACE_BLOCK = `export interface InsertImageOptions {
  x:            number;
  y:            number;
  width:        number;
  height:       number;
  imageBytes:   Uint8Array | string;
  opacity?:     number;
  borderWidth?: number;
  borderColor?: string;
  rotation?:    number;
  mimeType?:    'image/jpeg' | 'image/png';
}

`;

if (!content.includes(INTERFACE_ANCHOR)) {
  throw new Error('Anchor not found — check exact text in PdfEditAdapter.ts');
}
if (content.includes('InsertImageOptions')) {
  console.log('InsertImageOptions already present — skipping interface insertion');
} else {
  content = content.replace(INTERFACE_ANCHOR, INTERFACE_BLOCK + INTERFACE_ANCHOR);
  writeFileSync(FILE, content, 'utf8');
  console.log('Interface inserted');
}

// Find the exact start of the insertImage method
const METHOD_START_ANCHOR = '  static async insertImage(';
const startIdx = content.indexOf(METHOD_START_ANCHOR);
if (startIdx === -1) throw new Error('insertImage method not found');

// Walk forward counting braces to find the method end
let depth = 0;
let endIdx = startIdx;
let foundFirstBrace = false;
for (let i = startIdx; i < content.length; i++) {
  if (content[i] === '{') { depth++; foundFirstBrace = true; }
  if (content[i] === '}') { depth--; }
  if (foundFirstBrace && depth === 0) { endIdx = i + 1; break; }
}

const OLD_METHOD = content.slice(startIdx, endIdx);

const NEW_METHOD = `  static async insertImage(
    baseBytes: Uint8Array,
    options: InsertImageOptions & { pages: number[]; scale?: number },
  ): Promise<Uint8Array> {
    const { PDFDocument, rgb, degrees, BlendMode } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(baseBytes);

    // Decode imageBytes
    let rawBytes: Uint8Array;
    if (typeof options.imageBytes === 'string') {
      const base64 = options.imageBytes.includes(',')
        ? options.imageBytes.split(',')[1]
        : options.imageBytes;
      rawBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    } else {
      rawBytes = options.imageBytes;
    }

    // Embed — detect PNG vs JPEG by magic bytes
    const isPng = options.mimeType === 'image/png' || (rawBytes[0] === 0x89 && rawBytes[1] === 0x50);
    const image  = isPng
      ? await pdfDoc.embedPng(rawBytes)
      : await pdfDoc.embedJpg(rawBytes);

    let drawWidth = image.width;
    let drawHeight = image.height;

    if (options.width && options.height) {
      drawWidth = options.width;
      drawHeight = options.height;
    } else if (options.scale) {
      drawWidth = image.width * options.scale;
      drawHeight = image.height * options.scale;
    }

    for (const pageIndex of options.pages) {
      const page = pdfDoc.getPage(pageIndex);
      const pageHeight = page.getHeight();
      const drawY = pageHeight - options.y - drawHeight;

      // Border rect (drawn behind image)
      const borderWidth = options.borderWidth ?? 0;
      if (borderWidth > 0) {
        const c = hexToRgb(options.borderColor ?? '#000000');
        page.drawRectangle({
          x: options.x, y: drawY,
          width: drawWidth, height: drawHeight,
          borderColor: rgb(c.r, c.g, c.b),
          borderWidth,
          color: undefined,
        });
      }

      // Image
      page.drawImage(image, {
        x:       options.x,
        y:       drawY,
        width:   drawWidth,
        height:  drawHeight,
        opacity: options.opacity ?? 1,
        rotate:  degrees(options.rotation ?? 0),
        blendMode: BlendMode.Normal,
      });
    }

    return await pdfDoc.save();
  }`;

content = content.replace(OLD_METHOD, NEW_METHOD);
writeFileSync(FILE, content, 'utf8');
console.log('insertImage replaced');

/**
 * clientOcr.ts
 *
 * Provides a lazy-loaded wrapper around tesseract.js for client-side OCR.
 */

export async function recognizeImage(base64DataUrl: string): Promise<string> {
  // Lazily import tesseract to keep main bundle size small
  const Tesseract = await import('tesseract.js');

  // Initialize worker with English.
  // Note: Tesseract.js will automatically fetch the worker core and lang data from unpkg by default.
  const worker = await Tesseract.createWorker('eng');

  try {
    const ret = await worker.recognize(base64DataUrl);
    return ret.data.text;
  } finally {
    await worker.terminate();
  }
}

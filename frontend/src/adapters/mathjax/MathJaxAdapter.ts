export class MathJaxAdapter {
  private static fallbackSvg(latex: string, width: number, height: number, fontSize: number): string {
    const safeLatex = latex
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#f8d7da" stroke="#f5c6cb" stroke-width="2"/>
  <text x="10" y="${fontSize + 5}" font-family="monospace" font-size="${fontSize}px" fill="#721c24">${safeLatex}</text>
  <text x="10" y="${fontSize * 2 + 10}" font-family="sans-serif" font-size="12px" fill="#721c24">(MathJax failed to render)</text>
</svg>`;
  }

  public static async renderToSvg(
    latex: string,
    width: number,
    height: number,
    fontSize: number = 16
  ): Promise<string> {
    try {
      if (typeof window !== 'undefined' && (window as any).MathJax) {
        const MathJax = (window as any).MathJax;

        if (MathJax.startup && MathJax.startup.promise) {
           await MathJax.startup.promise;
        }

        const node = await MathJax.tex2svgPromise(latex, { display: true });
        const svgNode = node.querySelector('svg');
        if (svgNode) {
          svgNode.setAttribute('width', `${width}px`);
          svgNode.setAttribute('height', `${height}px`);
          return svgNode.outerHTML;
        }
      }
      return this.fallbackSvg(latex, width, height, fontSize);
    } catch (e) {
      console.error('MathJax render error:', e);
      return this.fallbackSvg(latex, width, height, fontSize);
    }
  }
}

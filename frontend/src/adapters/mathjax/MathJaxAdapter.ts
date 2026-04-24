import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

export class MathJaxAdapter {
  private html: unknown;

  constructor() {
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);

    const tex = new TeX({ packages: AllPackages });
    const svg = new SVG({ fontCache: 'local' });

    this.html = mathjax.document('', {
      InputJax: tex,
      OutputJax: svg,
    });
  }

  async renderLatex(latex: string, container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const htmlDoc = this.html as {
          convert: (str: string, opts: object) => unknown,
          adaptor: { innerHTML: (node: unknown) => string }
        };
        const node = htmlDoc.convert(latex, {
          display: true,
        });

        const svgHTML = htmlDoc.adaptor.innerHTML(node);
        container.innerHTML = svgHTML;
        resolve();
      } catch (error) {
        // Fallback
        container.innerHTML = `<div style="font-family: monospace; color: red;">${latex}</div>`;
        reject(error);
      }
    });
  }

  async renderAll(equations: { id: string; latex: string }[]): Promise<void> {
    for (const eq of equations) {
      const container = document.getElementById(`eq-${eq.id}`);
      if (container) {
        await this.renderLatex(eq.latex, container);
      }
    }
  }
}

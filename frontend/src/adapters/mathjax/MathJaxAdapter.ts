import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: ['base', 'ams', 'require', 'autoload'] });
const svg = new SVG({ fontCache: 'local' });

const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

export class MathJaxAdapter {
  static async renderLatex(latex: string, container: HTMLElement): Promise<void> {
    try {
      const node = html.convert(latex, {
        display: true,
      });

      const svgString = adaptor.innerHTML(node);

      container.innerHTML = svgString;
    } catch (error) {
      console.warn('MathJax render error, falling back to raw text:', error);

      container.innerHTML = '';
      const fallbackDiv = document.createElement('div');
      fallbackDiv.style.fontFamily = 'monospace';
      fallbackDiv.style.padding = '8px';
      fallbackDiv.style.backgroundColor = '#fef2f2';
      fallbackDiv.style.color = '#dc2626';
      fallbackDiv.style.border = '1px dashed #f87171';
      fallbackDiv.style.borderRadius = '4px';
      fallbackDiv.innerText = latex;

      container.appendChild(fallbackDiv);
    }
  }
}

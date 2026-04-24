import Konva from 'konva';
import type { PdfAnnotation } from '@/core/annotations/types';
import { deserializeKonvaNodeToAnnotation, serializeAnnotationToKonvaConfig } from './serializer';

interface SerializedKonvaChild {
  attrs: Record<string, unknown> & { id: string };
  className: string;
}

interface SerializedKonvaLayer {
  children: SerializedKonvaChild[];
}

export class KonvaAdapter {
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;
  private transformer: Konva.Transformer | null = null;

  initStage(container: HTMLDivElement, width: number, height: number): Konva.Stage {
    this.stage = new Konva.Stage({
      container,
      width,
      height,
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.transformer = new Konva.Transformer();
    this.layer.add(this.transformer);

    // Prevent the default scrolling behavior when interacting with canvas
    container.style.touchAction = 'none';

    return this.stage;
  }

  setScale(scale: number): void {
    if (this.stage) {
      this.stage.scale({ x: scale, y: scale });
      this.stage.draw();
    }
  }

  addObject(annotation: PdfAnnotation): Konva.Shape | Konva.Group | null {
    if (!this.layer) return null;

    let node: Konva.Shape | Konva.Group;
    const config = serializeAnnotationToKonvaConfig(annotation);
    config.zIndex = typeof annotation.data.zIndex === 'number' ? annotation.data.zIndex : 0;

    // Choose correct Konva Node based on the annotation type
    switch (annotation.type) {
      case 'textbox':
      case 'comment':
      case 'callout':
      case 'sticky-note':
        node = new Konva.Text({ ...config, text: annotation.data.text as string || 'Text', fill: 'black', fontSize: 16 });
        break;
      case 'highlight':
        node = new Konva.Rect({ ...config, fill: 'yellow', opacity: 0.4, cornerRadius: 4 });
        break;
      case 'underline':
        node = new Konva.Line({ ...config, points: [0, config.height || 0, config.width || 0, config.height || 0], stroke: 'black', strokeWidth: 1 });
        break;
      case 'strikeout':
        node = new Konva.Line({ ...config, points: [0, (config.height || 0)/2, config.width || 0, (config.height || 0)/2], stroke: 'black', strokeWidth: 1 });
        break;
      case 'shape':
        node = new Konva.Rect({ ...config, stroke: 'red', strokeWidth: 2 });
        break;
      case 'freehand':
        node = new Konva.Line({ ...config, points: annotation.data.points as number[], stroke: 'black', strokeWidth: 2, tension: 0.5 });
        break;
      case 'line':
      case 'arrow':
        node = new Konva.Line({ ...config, points: annotation.data.points as number[], stroke: 'black', strokeWidth: 2 });
        break;
      case 'stamp':
        node = new Konva.Text({ ...config, text: annotation.data.text as string || 'Stamp', fill: 'red', fontSize: 24, fontStyle: 'bold' });
        break;
      default:
        node = new Konva.Rect({ ...config, fill: 'gray', opacity: 0.5 });
        break;
    }

    // Add draggable capability for editor mode if not locked
    if (annotation.data.locked !== true) {
      node.draggable(true);
    } else {
      node.draggable(false);
    }

    node.on('click', () => {
      if (this.transformer && annotation.data.locked !== true) {
        this.transformer.nodes([node]);
        this.layer?.draw();
      }
    });

    this.layer.add(node);

    // Ensure nodes are sorted by zIndex after addition
    const children = this.layer.children?.slice() || [];
    children.sort((a, b) => {
        const za = (a.attrs.zIndex as number) || 0;
        const zb = (b.attrs.zIndex as number) || 0;
        return za - zb;
    });
    children.forEach(child => child.moveToTop());
    this.transformer?.moveToTop();

    this.layer.draw();
    return node;
  }

  removeObject(id: string): void {
    if (!this.layer) return;
    const node = this.layer.findOne(`#${id}`);
    if (node) {
      if (this.transformer && this.transformer.nodes().includes(node as Konva.Node)) {
          this.transformer.nodes([]);
      }
      node.destroy();
      this.layer.draw();
    }
  }

  serialize(pageNumber: number): PdfAnnotation[] {
    if (!this.layer) return [];

    // Konva.Layer().toJSON() provides children
    const layerJSON = JSON.parse(this.layer.toJSON()) as SerializedKonvaLayer;
    const annotations: PdfAnnotation[] = layerJSON.children
      .filter(child => child.className !== 'Transformer')
      .map((child) => {
        const { attrs, className } = child;
        const baseObj = deserializeKonvaNodeToAnnotation(attrs, className);
        return {
          ...baseObj,
          id: attrs.id,
          pageNumber,
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as PdfAnnotation;
      });

    return annotations;
  }

  deserialize(annotations: PdfAnnotation[]): void {
    if (!this.layer) return;

    if (this.transformer) {
      this.transformer.nodes([]);
    }

    // Destroy all children except transformer
    this.layer.children?.slice().forEach(child => {
        if (child.className !== 'Transformer') {
            child.destroy();
        }
    });

    annotations.forEach(ann => this.addObject(ann));
    this.layer.draw();
  }
}

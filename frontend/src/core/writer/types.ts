export type WriterTool = 'select' | 'place-text' | 'place-image' | 'place-table';

export type TransformHandle = 'nw' | 'ne' | 'se' | 'sw' | 'move';

export interface PlacedElement {
  id: string;
  type: 'rich-text' | 'image' | 'table';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    padding?: number;
    lineHeight?: number;
    opacity?: number;
    borderWidth?: number;
    borderColor?: string;
  };
  zIndex: number;
  locked: boolean;
}

export type WriterTool = 'select' | 'place-text' | 'place-image' | 'place-table';

export type TransformHandle = 'move' | 'nw' | 'ne' | 'se' | 'sw';

export interface PlacedElementStyles {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  lineHeight?: number | string;
}

export interface PlacedElement {
  id: string;
  type: 'rich-text' | 'image' | 'table';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // JSON or raw string based on type
  styles: PlacedElementStyles;
  zIndex: number;
  locked: boolean;
}

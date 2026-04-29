export type WriterTool = 'select' | 'place-text' | 'place-image' | 'place-table';
export type TransformHandle = 'nw' | 'ne' | 'se' | 'sw' | 'move';

export interface WriterStyles {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  lineHeight?: number;
}

export interface PlacedElement {
  id: string;
  type: 'rich-text' | 'image' | 'table';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // JSON for table, HTML for text, base64 for image
  styles: WriterStyles;
  zIndex: number;
  locked: boolean;
}

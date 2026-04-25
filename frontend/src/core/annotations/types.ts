import type { ReviewMetadata } from '../review/types';

export type AnnotationType =
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'squiggly'
  | 'shape'
  | 'shape-rect'
  | 'shape-ellipse'
  | 'shape-polygon'
  | 'shape-cloud'
  | 'freehand'
  | 'ink'
  | 'stamp'
  | 'sticky-note'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout'
  | 'redaction';

export type ReviewStatus = 'open' | 'resolved' | 'rejected';

export interface AnnotationStyle {
  stroke?: string;
  fill?: string;
  textColor?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface AnnotationData extends Record<string, unknown> {
  text?: string;
  title?: string;
  content?: string;
  review?: ReviewMetadata;

  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  opacity?: number;

  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;

  rotation?: number;
  locked?: boolean;
  zIndex?: number;
  autoSize?: boolean;

  anchor?: Point2D;
  knee?: Point2D;
  leaderStyle?: 'straight' | 'elbow';
  arrowHead?: 'open' | 'filled' | 'none';

  lineStartCap?: 'none' | 'arrow' | 'circle' | 'square';
  lineEndCap?: 'none' | 'arrow' | 'circle' | 'square';

  paths?: Array<number[]>;
  points?: number[];

  stampLabel?: string;
  stampImageDataUrl?: string;
  stampStyle?: 'approved' | 'rejected' | 'draft' | 'confidential' | 'custom';

  isCollapsed?: boolean;
  author?: string;

  reviewStatus?: ReviewStatus;
  style?: AnnotationStyle;
}

export interface PdfAnnotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  rect: Rect;
  data: AnnotationData;
  createdAt: number;
  updatedAt: number;
}

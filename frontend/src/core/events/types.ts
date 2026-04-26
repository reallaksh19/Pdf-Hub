export type DocumentEvent =
  | { type: 'DOCUMENT_LOADED'; fileId: string; pageCount: number }
  | { type: 'PAGES_REORDERED'; order: number[] }
  | { type: 'PAGES_DELETED'; deletedIndices: number[] }
  | { type: 'PAGES_ADDED'; insertIndex: number; count: number }
  | { type: 'ANNOTATION_ADDED'; annotationId: string }
  | { type: 'ANNOTATION_UPDATED'; annotationId: string }
  | { type: 'ANNOTATION_DELETED'; annotationId: string };

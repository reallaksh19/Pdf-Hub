export type DocumentEvent =
  | { type: 'PAGES_REORDERED'; order: number[] }
  | { type: 'PLACEHOLDER_1' }
  | { type: 'PLACEHOLDER_2' }
  | { type: 'PLACEHOLDER_3' }
  | { type: 'PLACEHOLDER_4' }
  | { type: 'PLACEHOLDER_5' }
  | { type: 'PLACEHOLDER_6' };

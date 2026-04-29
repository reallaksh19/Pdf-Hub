const fs = require('fs');

let types = fs.readFileSync('frontend/src/core/macro/types.ts', 'utf8');

const regex = /\| \{ op: 'place_rich_textbox'; selector\?: PageSelector; x: number; y: number; width: number \}\n  \| \{ op: 'place_table'; selector\?: PageSelector; x: number; y: number; width: number \}\n  \| \{ op: 'adjust_image'; selector\?: PageSelector; x: number; y: number; width: number \}/;

const replacement = `  | {
      op: 'place_rich_textbox';
      selector: PageSelector;
      x: number;
      y: number;
      width: number;
      height?: number;
      content: string;
      styles: import('../writer/types').PlacedElementStyles;
    }
  | {
      op: 'place_table';
      selector: PageSelector;
      x: number;
      y: number;
      width: number;
      headers: string[];
      rows: string[][];
      styles?: {
        headerBg?: string;
        borderColor?: string;
        fontSize?: number;
        rowHeight?: number;
      };
    }
  | {
      op: 'adjust_image';
      selector?: PageSelector;
      x: number;
      y: number;
      width: number;
    }`;

types = types.replace(regex, replacement);
fs.writeFileSync('frontend/src/core/macro/types.ts', types);

// Create PlacedElementStyles type
let writerTypes = fs.readFileSync('frontend/src/core/writer/types.ts', 'utf8');
if (!writerTypes.includes('export interface PlacedElementStyles')) {
  writerTypes += `
export interface PlacedElementStyles {
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  padding?: number;
  lineHeight?: number;
  textAlign?: 'left'|'center'|'right'|'justify';
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
}`;
  fs.writeFileSync('frontend/src/core/writer/types.ts', writerTypes);
}

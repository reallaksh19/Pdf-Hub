export interface WriterState {
  isWriting: boolean;
}

export interface WriterActions {
  dummyAction: () => void;
}
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
}
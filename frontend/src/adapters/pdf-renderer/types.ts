export interface RenderedPage {
  width: number;
  height: number;
  scale: number;
}

export interface RenderToken {
  cancel: () => Promise<void>;
  completed: Promise<void>;
}
// Amended for Agent C usage

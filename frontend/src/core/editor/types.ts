export type ActiveTool =
  | 'select'
  | 'hand'
  | 'textbox'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'squiggly'
  | 'shape'
  | 'shape-cloud'
  | 'shape-polygon'
  | 'freehand'
  | 'ink'
  | 'stamp'
  | 'sticky-note'
  | 'comment'
  | 'line'
  | 'arrow'
  | 'callout'
  | 'redaction';

export type SidebarTab =
  | 'thumbnails'
  | 'bookmarks'
  | 'comments'
  | 'search'
  | 'macros';

export type InspectorTab = 'properties' | 'style' | 'metadata' | 'review';
export type RibbonTab = 'file' | 'organize' | 'annotate' | 'macro' | 'view';

export interface EditorState {
  activeTool: ActiveTool;
  sidebarTab: SidebarTab;
  inspectorTab: InspectorTab;
  activeRibbonTab: RibbonTab;
  leftPanelWidth: number;
  rightPanelWidth: number;
}

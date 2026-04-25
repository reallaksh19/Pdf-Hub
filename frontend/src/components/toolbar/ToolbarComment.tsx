import React from 'react';
import {
  Type,
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough,
  Square,
  Stamp,
  MessageSquare,
  Undo,
  Redo,
  MoveRight,
  Minus,
  MessageCircle,
  Eye,
  EyeOff,
  AlignLeft,
  AlignStartVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Waves,
  PenTool,
  Cloud,
  Hexagon,
  SquareSquare,
  RectangleHorizontal,
} from 'lucide-react';
import { useEditorStore } from '@/core/editor/store';
import { useAnnotationStore } from '@/core/annotations/store';
import { useSessionStore } from '@/core/session/store';
import { useReviewStore } from '@/core/review/store';
import type { ActiveTool } from '@/core/editor/types';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';

export const ToolbarComment: React.FC = () => {
  const { activeTool, setActiveTool } = useEditorStore();
  const {
    undo,
    redo,
    history,
    future,
    selectedAnnotationIds,
    copySelection,
    pasteClipboard,
    duplicateSelection,
    alignSelection,
    distributeSelection,
    deleteSelection,
    toggleLockSelection,
    setReviewStatusForSelection,
  } = useAnnotationStore();

  const { viewState } = useSessionStore();
  const { hideResolved, setHideResolved } = useReviewStore();
  const hasSelection = selectedAnnotationIds.length > 0;

  const handleToolClick = (tool: Exclude<ActiveTool, 'select' | 'hand'>) => {
    setActiveTool(activeTool === tool ? 'select' : tool);
  };

  const getToolVariant = (tool: string) =>
    activeTool === tool ? 'secondary' : 'ghost';

  return (
    <div
      className="flex items-center space-x-1 shrink-0"
      role="toolbar"
      aria-label="Annotation tools"
    >
      <Tooltip content="Text Box">
        <Button variant={getToolVariant('textbox')} size="icon" onClick={() => handleToolClick('textbox')}>
          <Type className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Highlight">
        <Button variant={getToolVariant('highlight')} size="icon" onClick={() => handleToolClick('highlight')}>
          <Highlighter className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Underline">
        <Button variant={getToolVariant('underline')} size="icon" onClick={() => handleToolClick('underline')}>
          <UnderlineIcon className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Strikeout">
        <Button variant={getToolVariant('strikeout')} size="icon" onClick={() => handleToolClick('strikeout')}>
          <Strikethrough className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Squiggly Underline">
        <Button variant={getToolVariant('squiggly')} size="icon" onClick={() => handleToolClick('squiggly')}>
          <Waves className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Sticky Note">
        <Button variant={getToolVariant('sticky-note')} size="icon" onClick={() => handleToolClick('sticky-note')}>
          <MessageSquare className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Comment Box">
        <Button variant={getToolVariant('comment')} size="icon" onClick={() => handleToolClick('comment')}>
          <MessageCircle className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Shape">
        <Button variant={getToolVariant('shape')} size="icon" onClick={() => handleToolClick('shape')}>
          <Square className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Cloud Shape">
        <Button variant={getToolVariant('shape-cloud')} size="icon" onClick={() => handleToolClick('shape-cloud')}>
          <Cloud className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Polygon">
        <Button variant={getToolVariant('shape-polygon')} size="icon" onClick={() => handleToolClick('shape-polygon')}>
          <Hexagon className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Stamp">
        <Button variant={getToolVariant('stamp')} size="icon" onClick={() => handleToolClick('stamp')}>
          <Stamp className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Redaction">
        <Button variant={getToolVariant('redaction')} size="icon" onClick={() => handleToolClick('redaction')}>
          <SquareSquare className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Ink">
        <Button variant={getToolVariant('ink')} size="icon" onClick={() => handleToolClick('ink')}>
          <PenTool className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Line">
        <Button variant={getToolVariant('line')} size="icon" onClick={() => handleToolClick('line')}>
          <Minus className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Arrow">
        <Button variant={getToolVariant('arrow')} size="icon" onClick={() => handleToolClick('arrow')}>
          <MoveRight className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" onClick={copySelection} disabled={!hasSelection}>
        Copy
      </Button>
      <Button variant="ghost" size="sm" onClick={() => pasteClipboard(viewState.currentPage)}>
        Paste
      </Button>
      <Button variant="ghost" size="sm" onClick={duplicateSelection} disabled={!hasSelection}>
        Duplicate
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteSelection} disabled={!hasSelection}>
        Delete
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Tooltip content="Align Left">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alignSelection('left')} disabled={selectedAnnotationIds.length < 2}>
          <AlignLeft className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Align Top">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alignSelection('top')} disabled={selectedAnnotationIds.length < 2}>
          <AlignStartVertical className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Distribute Horizontally">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => distributeSelection('horizontal')} disabled={selectedAnnotationIds.length < 3}>
          <AlignHorizontalSpaceBetween className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Distribute Vertically">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => distributeSelection('vertical')} disabled={selectedAnnotationIds.length < 3}>
          <AlignVerticalSpaceBetween className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" onClick={toggleLockSelection} disabled={!hasSelection}>
        Lock
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setReviewStatusForSelection('open')} disabled={!hasSelection}>
        Open
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setReviewStatusForSelection('resolved')} disabled={!hasSelection}>
        Resolve
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setReviewStatusForSelection('rejected')} disabled={!hasSelection}>
        Reject
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Tooltip content="Undo">
        <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0}>
          <Undo className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Redo">
        <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}>
          <Redo className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      <Tooltip content={hideResolved ? "Show Resolved" : "Hide Resolved"}>
        <Button variant={hideResolved ? "secondary" : "ghost"} size="icon" onClick={() => setHideResolved(!hideResolved)}>
          {hideResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </Tooltip>
    </div>
  );
};
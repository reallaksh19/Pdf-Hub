import React, { useRef, useState, useCallback } from 'react';
import { useWriterStore } from '../../core/writer/store';
import { RichTextEditorPanel } from './RichTextEditorPanel';
import { TableEditorPanel } from './TableEditorPanel';
import type { PlacedElement, TransformHandle } from '../../core/writer/types';
import './WriterElementNode.css';

interface Props {
  element: PlacedElement;
  scale:   number;
}

export const WriterElementNode: React.FC<Props> = ({ element, scale }) => {
  const { updateElement, removeElement, setSelectedId, selectedId, bringForward, sendBackward } =
    useWriterStore();

  const isSelected = selectedId === element.id;

  const [editMode, setEditMode] = useState<'rich-text' | 'table' | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);

  // Drag state refs (not state — no re-render needed during drag)
  const dragRef = useRef<{
    handle:   TransformHandle;
    startX:   number;
    startY:   number;
    origX:    number;
    origY:    number;
    origW:    number;
    origH:    number;
  } | null>(null);

  // Screen → PDF space
  const toPdf = useCallback((px: number) => px / scale, [scale]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle: TransformHandle) => {
      if (element.locked) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      setSelectedId(element.id);

      dragRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX:  element.x,
        origY:  element.y,
        origW:  element.width,
        origH:  element.height,
      };
    },
    [element, setSelectedId],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const { handle, startX, startY, origX, origY, origW, origH } = dragRef.current;

      const dx = toPdf(e.clientX - startX);
      const dy = toPdf(e.clientY - startY);

      let patch: Partial<PlacedElement> = {};

      if (handle === 'move') {
        patch = { x: origX + dx, y: origY + dy };
      } else {
        // Resize — corner handles
        const minSize = 20 / scale;
        if (handle === 'se') patch = { width: Math.max(minSize, origW + dx), height: Math.max(minSize, origH + dy) };
        if (handle === 'sw') patch = { x: origX + dx, width: Math.max(minSize, origW - dx), height: Math.max(minSize, origH + dy) };
        if (handle === 'ne') patch = { y: origY + dy, width: Math.max(minSize, origW + dx), height: Math.max(minSize, origH - dy) };
        if (handle === 'nw') patch = { x: origX + dx, y: origY + dy, width: Math.max(minSize, origW - dx), height: Math.max(minSize, origH - dy) };
      }

      // Live preview — update directly (no undo snapshot during drag)
      useWriterStore.setState(s => ({
        elements: s.elements.map(el => el.id === element.id ? { ...el, ...patch } : el),
      }));
    },
    [element.id, scale, toPdf],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    // Snapshot to undo stack on release
    updateElement(element.id, {});  // empty patch to trigger snapshot
  }, [element.id, updateElement]);

  const handleDoubleClick = useCallback(() => {
    if (element.type === 'rich-text') setEditMode('rich-text');
    if (element.type === 'table')     setEditMode('table');
    if (element.type === 'image') {
      // Open file picker
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          updateElement(element.id, { content: ev.target?.result as string });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }, [element.type, element.id, updateElement]);

  // Screen-space dimensions
  const sx = element.x * scale;
  const sy = element.y * scale;
  const sw = element.width  * scale;
  const sh = element.height * scale;

  const HANDLE_SIZE = 8;

  const handles: { id: TransformHandle; cursor: string }[] = [
    { id: 'nw', cursor: 'nw-resize' },
    { id: 'ne', cursor: 'ne-resize' },
    { id: 'se', cursor: 'se-resize' },
    { id: 'sw', cursor: 'sw-resize' },
  ];

  return (
    <>
      <div
        style={{
          position:     'absolute',
          left:         sx,
          top:          sy,
          width:        sw,
          height:       sh,
          zIndex:       element.zIndex,
          pointerEvents: 'all',
          outline:      isSelected ? '1.5px dashed #3b82f6' : '1px solid transparent',
          boxSizing:    'border-box',
          cursor:       element.locked ? 'default' : 'move',
          userSelect:   'none',
          // Show content preview
          overflow:     'hidden',
          fontSize:     (element.styles.fontSize ?? 12) * scale,
          color:        element.styles.color ?? 'inherit',
          backgroundColor: element.styles.backgroundColor ?? 'transparent',
          padding:      (element.styles.padding ?? 0) * scale,
          opacity:      element.styles.opacity ?? 1,
          border:       element.styles.borderWidth
            ? `${element.styles.borderWidth * scale}px solid ${element.styles.borderColor ?? '#000'}`
            : undefined,
        }}
        onPointerDown={e => handlePointerDown(e, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={e => { e.preventDefault(); setShowContextMenu(true); }}
      >
        {element.type === 'rich-text' && (
          <div
            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            dangerouslySetInnerHTML={{ __html: element.content || '<span style="opacity:0.4">Double-click to edit</span>' }}
          />
        )}
        {element.type === 'image' && element.content && (
          <img src={element.content} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} alt="" />
        )}
        {element.type === 'table' && (
          <div style={{ fontSize: 10, opacity: 0.5, padding: 4, pointerEvents: 'none' }}>Table — double-click to edit</div>
        )}
      </div>

      {/* Resize handles — only when selected */}
      {isSelected && handles.map(h => (
        <div
          key={h.id}
          style={{
            position:  'absolute',
            width:     HANDLE_SIZE,
            height:    HANDLE_SIZE,
            background: '#3b82f6',
            border:    '1.5px solid white',
            borderRadius: 2,
            zIndex:    element.zIndex + 1,
            pointerEvents: 'all',
            cursor:    h.cursor,
            // Recalculate absolute position based on handle corner
            left: h.id === 'nw' || h.id === 'sw' ? sx - HANDLE_SIZE/2 : sx + sw - HANDLE_SIZE/2,
            top:  h.id === 'nw' || h.id === 'ne' ? sy - HANDLE_SIZE/2 : sy + sh - HANDLE_SIZE/2,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            // eslint-disable-next-line react-hooks/refs
            handlePointerDown(e, h.id);
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      ))}

      {/* Context menu */}
      {showContextMenu && isSelected && (
        <div
          style={{
            position: 'absolute', left: sx, top: sy + sh + 4,
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: 6, padding: '4px 0', zIndex: 999, minWidth: 140,
            pointerEvents: 'all',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {[
            { label: 'Bring forward',  action: () => bringForward(element.id) },
            { label: 'Send backward',  action: () => sendBackward(element.id) },
            { label: '──', action: () => {} },
            { label: 'Delete',         action: () => removeElement(element.id) },
          ].map((item, i) => (
            item.label === '──'
              ? <div key={i} style={{ height: 1, background: 'var(--color-border-tertiary)', margin: '2px 0' }} />
              : <div
                  key={i}
                  style={{ padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: item.label === 'Delete' ? 'var(--color-text-danger)' : 'var(--color-text-primary)' }}
                  onClick={() => { item.action(); setShowContextMenu(false); }}
                >
                  {item.label}
                </div>
          ))}
        </div>
      )}

      {/* Dismiss context menu on outside click */}
      {showContextMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={() => setShowContextMenu(false)}
        />
      )}

      {/* Editor panels */}
      {editMode === 'rich-text' && (
        <RichTextEditorPanel
          element={element}
          scale={scale}
          onClose={() => setEditMode(null)}
        />
      )}
      {editMode === 'table' && (
        <TableEditorPanel
          element={element}
          scale={scale}
          onClose={() => setEditMode(null)}
        />
      )}
    </>
  );
};

import React, { useCallback } from 'react';
import { useWriterStore } from '../../core/writer/store';
import { WriterElementNode } from './WriterElementNode';
import type { PlacedElement } from '../../core/writer/types';

interface Props {
  pageNumber:     number;
  scale:          number;
  pageDimensions: { width: number; height: number } | null;
}

let elementIdCounter = 0;
function nextId(): string {
  return `wel-${Date.now()}-${elementIdCounter++}`;
}

/**
 * Transparent overlay above the PDF canvas for one page.
 *
 * Behaviour:
 * - When activeTool is 'select': pointer-events pass-through (no capture).
 * - When activeTool is a placement tool: captures pointer events,
 *   cursor crosshair, places element on click.
 *
 * z-index: 10 (above canvas z-0, below annotations z-20).
 */
export const WriterOverlay: React.FC<Props> = ({ pageNumber, scale, pageDimensions }) => {
  const { elements, activeTool, addElement, setActiveTool, setSelectedId } =
    useWriterStore();

  const pageElements = elements
    .filter(e => e.pageNumber === pageNumber)
    .sort((a, b) => a.zIndex - b.zIndex);

  const isPlacing = activeTool !== 'select';

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlacing || !pageDimensions) return;

      // Prevent event from reaching annotation layer
      e.stopPropagation();

      // Convert screen coords to PDF space
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const pdfX = screenX / scale;
      const pdfY = screenY / scale;

      const typeMap = {
        'place-text':  'rich-text',
        'place-image': 'image',
        'place-table': 'table',
      } as const;

      const elementType = typeMap[activeTool as keyof typeof typeMap];
      if (!elementType) return;

      const newElement: PlacedElement = {
        id:         nextId(),
        type:       elementType,
        pageNumber,
        x:          pdfX,
        y:          pdfY,
        width:      200 / scale,   // default 200px screen → PDF space
        height:     80  / scale,
        content:    elementType === 'table'
                      ? JSON.stringify({ headers: ['Col 1', 'Col 2'], rows: [], columnWidths: [], borderColor: '#d1d5db', headerBg: '#f1f5f9' })
                      : '',
        styles:     {},
        zIndex:     elements.length,
        locked:     false,
      };

      addElement(newElement);
      setSelectedId(newElement.id);
      setActiveTool('select');   // return to select after placement
    },
    [isPlacing, pageDimensions, scale, activeTool, elements.length, pageNumber, addElement, setActiveTool, setSelectedId],
  );

  if (!pageDimensions) return null;

  return (
    <div
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        width:         pageDimensions.width * scale,
        height:        pageDimensions.height * scale,
        zIndex:        10,
        pointerEvents: isPlacing ? 'all' : 'none',   // pass-through when selecting
        cursor:        isPlacing ? 'crosshair' : 'default',
        overflow:      'hidden',
      }}
      onClick={handleOverlayClick}
    >
      {/* Grid hint when in placement mode */}
      {isPlacing && (
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }}
          width={pageDimensions.width * scale}
          height={pageDimensions.height * scale}
        >
          {/* 20px vertical lines */}
          {Array.from({ length: Math.ceil((pageDimensions.width * scale) / 20) }, (_, i) => (
            <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={pageDimensions.height * scale} stroke="currentColor" strokeWidth={0.5} />
          ))}
          {/* 20px horizontal lines */}
          {Array.from({ length: Math.ceil((pageDimensions.height * scale) / 20) }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 20} x2={pageDimensions.width * scale} y2={i * 20} stroke="currentColor" strokeWidth={0.5} />
          ))}
        </svg>
      )}

      {pageElements.map(element => (
        <WriterElementNode
          key={element.id}
          element={element}
          scale={scale}
        />
      ))}
    </div>
  );
};

import React from 'react';
import type { Rect } from '../../../core/annotations/types';

interface SelectionHandlesProps {
  rect: Rect;
  onTransformStart: (e: React.PointerEvent, mode: string) => void;
}

export const SelectionHandles: React.FC<SelectionHandlesProps> = ({ rect, onTransformStart }) => {
  const handleSize = 8;
  const positions = [
    { mode: 'nw-resize', x: -handleSize/2, y: -handleSize/2 },
    { mode: 'ne-resize', x: rect.width - handleSize/2, y: -handleSize/2 },
    { mode: 'sw-resize', x: -handleSize/2, y: rect.height - handleSize/2 },
    { mode: 'se-resize', x: rect.width - handleSize/2, y: rect.height - handleSize/2 },
  ];

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: rect.width, height: rect.height,
          border: '1px dashed #1a73e8',
          pointerEvents: 'none',
        }}
      />
      {positions.map(p => (
        <div
          key={p.mode}
          style={{
            position: 'absolute',
            left: p.x, top: p.y,
            width: handleSize, height: handleSize,
            backgroundColor: '#fff',
            border: '1px solid #1a73e8',
            cursor: p.mode,
            pointerEvents: 'all',
          }}
          onPointerDown={e => {
            e.stopPropagation();
            onTransformStart(e, p.mode);
          }}
        />
      ))}
    </>
  );
};

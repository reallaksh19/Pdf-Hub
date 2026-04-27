import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const LineNode: React.FC<AnnotationNodeProps<'line'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart, scale, points
}) => {
  const color = annotation.data?.color ?? '#1a73e8';

  const linePoints = points ?? [
    { x: 0, y: 0 },
    { x: rect.width, y: rect.height }
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        cursor: 'pointer', pointerEvents: 'all',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      <svg width={rect.width} height={rect.height} style={{ overflow: 'visible' }}>
        <line
          x1={linePoints[0]?.x ?? 0} y1={linePoints[0]?.y ?? 0}
          x2={linePoints[1]?.x ?? rect.width} y2={linePoints[1]?.y ?? rect.height}
          stroke={color}
          strokeWidth={isSelected ? 2.5 : 2}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

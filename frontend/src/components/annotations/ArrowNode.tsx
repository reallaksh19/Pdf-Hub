import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const ArrowNode: React.FC<AnnotationNodeProps<'arrow'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart, scale, points
}) => {
  const color = annotation.data?.color ?? '#1a73e8';

  const linePoints = points ?? [
    { x: 0, y: 0 },
    { x: rect.width, y: rect.height }
  ];

  const dx = (linePoints[1]?.x ?? rect.width) - (linePoints[0]?.x ?? 0);
  const dy = (linePoints[1]?.y ?? rect.height) - (linePoints[0]?.y ?? 0);
  const angle = Math.atan2(dy, dx);
  const arrowLen = 10;

  const p2x = linePoints[1]?.x ?? rect.width;
  const p2y = linePoints[1]?.y ?? rect.height;

  const arrow1x = p2x - arrowLen * Math.cos(angle - Math.PI / 6);
  const arrow1y = p2y - arrowLen * Math.sin(angle - Math.PI / 6);
  const arrow2x = p2x - arrowLen * Math.cos(angle + Math.PI / 6);
  const arrow2y = p2y - arrowLen * Math.sin(angle + Math.PI / 6);

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
          x2={p2x} y2={p2y}
          stroke={color}
          strokeWidth={isSelected ? 2.5 : 2}
          strokeLinecap="round"
        />
        <polyline
          points={`${arrow1x},${arrow1y} ${p2x},${p2y} ${arrow2x},${arrow2y}`}
          fill="none"
          stroke={color}
          strokeWidth={isSelected ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

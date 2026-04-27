import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const ShapePolygonNode: React.FC<AnnotationNodeProps<'shape-polygon'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart, scale,
}) => {
  const borderColor = annotation.data?.borderColor ?? '#1a73e8';
  const fillColor = annotation.data?.fillColor ?? 'transparent';
  // simple triangle for default polygon if points not provided
  const points = annotation.data?.points?.map((p: any) => `${p.x * scale},${p.y * scale}`).join(' ')
    ?? `${rect.width/2},0 ${rect.width},${rect.height} 0,${rect.height}`;

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
        <polygon
          points={points}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2.5 : 2}
        />
      </svg>
    </div>
  );
};

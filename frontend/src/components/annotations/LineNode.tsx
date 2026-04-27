import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';
import { SelectionHandles } from './shared/SelectionHandles';

export const LineNode: React.FC<AnnotationNodeProps<'line'>> = ({
  annotation, rect, scale, isSelected, onSelect, onTransformStart,
}) => {
  const color = annotation.data?.borderColor ?? '#111827';
  const width = annotation.data?.borderWidth ?? 2;
  const points = (annotation.data?.points ?? [0, rect.height / 2, rect.width, rect.height / 2]).map(p => p * scale);

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y, width: rect.width, height: rect.height,
        cursor: 'pointer', pointerEvents: 'all',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <line x1={points[0]} y1={points[1]} x2={points[2]} y2={points[3]} stroke={color} strokeWidth={width} />
      </svg>
      {isSelected && <SelectionHandles rect={rect} onTransformStart={onTransformStart} />}
    </div>
  );
};

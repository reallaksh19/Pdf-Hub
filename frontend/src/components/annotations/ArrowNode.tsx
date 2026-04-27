import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';
import { SelectionHandles } from './shared/SelectionHandles';

export const ArrowNode: React.FC<AnnotationNodeProps<'arrow'>> = ({
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
        <defs>
          <marker id={`arrow-${annotation.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        </defs>
        <line x1={points[0]} y1={points[1]} x2={points[2]} y2={points[3]} stroke={color} strokeWidth={width} markerEnd={`url(#arrow-${annotation.id})`} />
      </svg>
      {isSelected && <SelectionHandles rect={rect} onTransformStart={onTransformStart} />}
    </div>
  );
};

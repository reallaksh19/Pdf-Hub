import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const StickyNoteNode: React.FC<AnnotationNodeProps<'sticky-note'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart,
}) => {
  const color = annotation.data?.color ?? '#facc15';

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        backgroundColor: color,
        border: '1px solid #ca8a04',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        cursor: 'pointer', pointerEvents: 'all',
        outline: isSelected ? '2px dashed #1a73e8' : 'none',
        padding: 4,
        fontSize: 12,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      {annotation.data?.content}
    </div>
  );
};

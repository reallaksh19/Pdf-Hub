import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const RedactionNode: React.FC<AnnotationNodeProps<'redaction'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart,
}) => {
  const color = annotation.data?.color ?? '#000000';

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        backgroundColor: color,
        cursor: 'pointer', pointerEvents: 'all',
        outline: isSelected ? '2px dashed #ff0000' : 'none',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    />
  );
};

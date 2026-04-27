import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const ShapeRectNode: React.FC<AnnotationNodeProps<'shape-rect'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart,
}) => {
  const borderColor = annotation.data?.borderColor ?? '#1a73e8';
  const fillColor = annotation.data?.fillColor ?? 'transparent';

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        border: `2px solid ${borderColor}`,
        backgroundColor: fillColor,
        cursor: 'pointer', pointerEvents: 'all',
        outline: isSelected ? '2px dashed #1a73e8' : 'none',
        boxSizing: 'border-box',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    />
  );
};

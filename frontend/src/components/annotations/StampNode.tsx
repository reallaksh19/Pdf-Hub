import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const StampNode: React.FC<AnnotationNodeProps<'stamp'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart,
}) => {
  const imageUrl = annotation.data?.imageUrl;

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        cursor: 'pointer', pointerEvents: 'all',
        outline: isSelected ? '2px dashed #1a73e8' : 'none',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="stamp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', border: '2px solid red', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>No Image</div>
      )}
    </div>
  );
};

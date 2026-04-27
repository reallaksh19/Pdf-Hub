import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const CommentNode: React.FC<AnnotationNodeProps<'comment'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: 24, height: 24, // Comments are usually fixed size icons
        cursor: 'pointer', pointerEvents: 'all',
        outline: isSelected ? '2px dashed #1a73e8' : 'none',
        backgroundColor: '#facc15',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
  );
};

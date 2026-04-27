import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const TextboxNode: React.FC<AnnotationNodeProps<'textbox'>> = ({
  annotation, rect, scale, isSelected, isEditing, editingValue,
  onSelect, onTransformStart, onDoubleClick, onCommitEdit,
}) => {
  const color = annotation.data?.color ?? '#000000';
  const fontSize = (annotation.data?.fontSize ?? 12) * scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        cursor: 'pointer', pointerEvents: 'all',
        outline: isSelected ? '1px dashed #1a73e8' : 'none',
        color,
        fontSize,
        boxSizing: 'border-box',
        overflow: 'hidden',
        padding: 4,
        background: annotation.data?.fillColor ?? 'transparent',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
      onDoubleClick={onDoubleClick}
    >
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={editingValue}
            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontSize: 'inherit', color: 'inherit' }}
            onBlur={e => onCommitEdit?.(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) onCommitEdit?.((e.target as HTMLTextAreaElement).value); }}
          />
        ) : (
          <span style={{ whiteSpace: 'pre-wrap' }}>{annotation.data?.content ?? ''}</span>
        )}
    </div>
  );
};

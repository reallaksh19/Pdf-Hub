import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';
import { computeCalloutPath } from '../../core/annotations/callout-geometry';

export const CalloutNode: React.FC<AnnotationNodeProps<'callout'>> = ({
  annotation, rect, scale, isSelected, isEditing, editingValue,
  onSelect, onTransformStart, onDoubleClick, onCommitEdit,
  anchorPoint, onAnchorDragStart,
}) => {
  const borderColor = annotation.data?.borderColor ?? '#1a73e8';
  const fillColor   = annotation.data?.fillColor   ?? '#ffffff';

  // Compute leader line in scaled space
  const geometry = anchorPoint
    ? computeCalloutPath(
        { x: anchorPoint.x * scale, y: anchorPoint.y * scale },
        rect,
      )
    : null;

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      {/* Leader line rendered as SVG — outside the box rect */}
      {geometry && (
        <svg
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
          width={0} height={0}
        >
          <polyline
            points={[
              `${geometry.edgePoint.x},${geometry.edgePoint.y}`,
              `${geometry.elbowPoint.x},${geometry.elbowPoint.y}`,
              `${geometry.anchorPoint.x},${geometry.anchorPoint.y}`,
            ].join(' ')}
            fill="none"
            stroke={borderColor}
            strokeWidth={1.5}
          />
          {/* Draggable anchor handle */}
          {anchorPoint && onAnchorDragStart && (
            <circle
              cx={geometry.anchorPoint.x} cy={geometry.anchorPoint.y}
              r={5} fill={borderColor} cursor="crosshair"
              style={{ pointerEvents: 'all' }}
              onPointerDown={onAnchorDragStart}
            />
          )}
        </svg>
      )}

      {/* Text box */}
      <div
        style={{
          position: 'absolute',
          left: rect.x, top: rect.y, width: rect.width, height: rect.height,
          background: fillColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 4,
          padding: 4,
          fontSize: (annotation.data?.fontSize ?? 12) * scale,
          cursor: 'pointer',
          pointerEvents: 'all',
          outline: isSelected ? `2px solid ${borderColor}` : 'none',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
        onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
        onDoubleClick={onDoubleClick}
      >
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={editingValue}
            style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontSize: 'inherit' }}
            onBlur={e => onCommitEdit?.(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) onCommitEdit?.((e.target as HTMLTextAreaElement).value); }}
          />
        ) : (
          <span style={{ whiteSpace: 'pre-wrap' }}>{annotation.data?.content ?? ''}</span>
        )}
      </div>
    </div>
  );
};

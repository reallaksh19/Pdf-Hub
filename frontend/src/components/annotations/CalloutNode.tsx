import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';
import { computeCalloutPath } from '../../core/annotations/callout-geometry';

export const CalloutNode: React.FC<AnnotationNodeProps<'callout'> & {
  anchorPoint?: { x: number; y: number };
  onAnchorDragStart?: (e: React.PointerEvent<SVGCircleElement>) => void;
}> = ({
  annotation, rect, scale, isSelected, isEditing, editingValue,
  onSelect, onTransformStart, onDoubleClick, onCommitEdit,
  anchorPoint, onAnchorDragStart,
}) => {
  const borderColor = annotation.data?.borderColor ?? '#475569';
  const fillColor   = annotation.data?.backgroundColor   ?? '#ffffff';

  // Compute leader line in scaled space
  const geometry = anchorPoint
    ? computeCalloutPath(
        { x: anchorPoint.x * scale, y: anchorPoint.y * scale },
        rect,
      )
    : null;

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      {geometry && (
        <svg
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
          width={0} height={0}
        >
          <polyline
            points={[
              `${geometry.edgePoint.x},${geometry.edgePoint.y}`,
              `${geometry.anchorPoint.x},${geometry.anchorPoint.y}`,
            ].join(' ')}
            fill="none"
            stroke={borderColor}
            strokeWidth={1.5}
          />
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
      <div
        style={{
          position: 'absolute',
          left: rect.x, top: rect.y, width: rect.width, height: rect.height,
          background: fillColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 4,
          padding: 4,
          color: annotation.data?.textColor ?? '#111827',
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
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onCommitEdit?.(e.currentTarget.value); }}
          />
        ) : (
          <span style={{ whiteSpace: 'pre-wrap' }}>{annotation.data?.text ?? ''}</span>
        )}
      </div>
    </div>
  );
};

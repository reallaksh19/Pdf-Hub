import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';
import { SelectionHandles } from './shared/SelectionHandles';

/**
 * Renders free-hand ink annotation as SVG paths.
 *
 * data.paths: Array<Array<{ x: number; y: number }>>
 * Each inner array is one continuous stroke.
 * Coordinates are in PDF space (unscaled); we scale them here.
 *
 * COMMON FAILURE MODE: rendering a placeholder <div> because data.paths
 * is not consumed. This component must always render SVG paths.
 */
export const InkNode: React.FC<AnnotationNodeProps<'ink'>> = ({
  annotation,
  rect,
  scale,
  isSelected,
  onSelect,
  onTransformStart,
}) => {
  const paths: Array<Array<{ x: number; y: number }>> = annotation.data?.paths ?? [];
  const strokeColor = annotation.data?.color ?? '#000000';
  const strokeWidth = (annotation.data?.strokeWidth ?? 2) * scale;

  // Convert path arrays to SVG path data strings
  const pathDStrings = paths.map(points => {
    if (points.length === 0) return '';
    const [first, ...rest] = points;
    const move = `M ${(first.x * scale).toFixed(2)} ${(first.y * scale).toFixed(2)}`;
    const lines = rest.map(p => `L ${(p.x * scale).toFixed(2)} ${(p.y * scale).toFixed(2)}`);
    return `${move} ${lines.join(' ')}`;
  }).filter(Boolean);

  if (pathDStrings.length === 0) {
    // Fallback: render a visible error indicator so missing data is obvious
    return (
      <div
        style={{
          position: 'absolute',
          left: rect.x, top: rect.y,
          width: rect.width, height: rect.height,
          border: '1px dashed red',
          fontSize: 10,
          color: 'red',
        }}
      >
        ink: no paths
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        cursor: 'pointer',
        pointerEvents: 'all',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      <svg
        width={rect.width}
        height={rect.height}
        style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}
      >
        {pathDStrings.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {isSelected && (
        <SelectionHandles rect={rect} onTransformStart={onTransformStart} />
      )}
    </div>
  );
};

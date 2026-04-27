import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

export const SquigglyNode: React.FC<AnnotationNodeProps<'squiggly'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart,
}) => {
  const color = annotation.data?.color ?? '#00ff00';
  const freq = 4;
  const amp = 2;
  const numWaves = Math.floor(rect.width / freq);
  let pathD = `M 0 ${rect.height}`;
  for (let i = 1; i <= numWaves; i++) {
    const x = i * freq;
    const y = rect.height + (i % 2 === 0 ? -amp : amp);
    pathD += ` L ${x} ${y}`;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        cursor: 'pointer', pointerEvents: 'all',
      }}
      onPointerDown={e => { onSelect(e); onTransformStart(e, 'move'); }}
    >
      <svg width={rect.width} height={rect.height} style={{ overflow: 'visible' }}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={isSelected ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

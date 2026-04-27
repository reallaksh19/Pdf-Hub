import React from 'react';
import type { AnnotationNodeProps } from '../../core/annotations/types';

function cloudPath(rect: {x: number, y: number, width: number, height: number}, scale: number, amplitude = 6): string {
  const { x, y, width, height } = rect;
  const bumps = Math.max(3, Math.round(width / 18));
  const step = (width * scale) / bumps;
  let d = `M ${x * scale} ${(y + height / 2) * scale} `;

  for (let i = 0; i < bumps; i++) {
    const cx = (x * scale) + i * step + step / 2;
    const cy = (y * scale) - amplitude;
    const ex = (x * scale) + (i + 1) * step;
    d += `Q ${cx} ${cy} ${ex} ${y * scale} `;
  }

  const rightBumps = Math.max(2, Math.round(height / 18));
  const rStep = (height * scale) / rightBumps;
  for (let i = 0; i < rightBumps; i++) {
    const cx = ((x + width) * scale) + amplitude;
    const cy = (y * scale) + i * rStep + rStep / 2;
    const ey = (y * scale) + (i + 1) * rStep;
    d += `Q ${cx} ${cy} ${(x + width) * scale} ${ey} `;
  }

  const botBumps = Math.max(3, Math.round(width / 18));
  const bStep = (width * scale) / botBumps;
  for (let i = 0; i < botBumps; i++) {
    const cx = ((x + width) * scale) - i * bStep - bStep / 2;
    const cy = ((y + height) * scale) + amplitude;
    const ex = ((x + width) * scale) - (i + 1) * bStep;
    d += `Q ${cx} ${cy} ${ex} ${(y + height) * scale} `;
  }

  const leftBumps = Math.max(2, Math.round(height / 18));
  const lStep = (height * scale) / leftBumps;
  for (let i = 0; i < leftBumps; i++) {
    const cx = (x * scale) - amplitude;
    const cy = ((y + height) * scale) - i * lStep - lStep / 2;
    const ey = ((y + height) * scale) - (i + 1) * lStep;
    d += `Q ${cx} ${cy} ${x * scale} ${ey} `;
  }

  return d + " Z";
}

export const ShapeCloudNode: React.FC<AnnotationNodeProps<'shape-cloud'>> = ({
  annotation, rect, isSelected, onSelect, onTransformStart, scale,
}) => {
  const borderColor = annotation.data?.borderColor ?? '#1a73e8';
  const fillColor = annotation.data?.fillColor ?? 'transparent';

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
          d={cloudPath({ x: 0, y: 0, width: rect.width / scale, height: rect.height / scale }, scale)}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 2.5 : 2}
        />
      </svg>
    </div>
  );
};

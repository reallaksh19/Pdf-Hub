import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text, Line, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import type { PdfAnnotation } from '@/core/annotations/types';

interface AnnotationOverlayProps {
  annotations: PdfAnnotation[];
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  onTransformEnd: (id: string, newAttrs: unknown) => void;
  isReadOnly?: boolean;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  pageNumber,
  width,
  height,
  scale,
  selectedIds,
  onSelect,
  onTransformEnd,
  isReadOnly = false,
}) => {
  const trRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    if (trRef.current && layerRef.current) {
      const selectedNodes = selectedIds
        .map((id) => layerRef.current.findOne(`#${id}`))
        .filter(Boolean);
      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, annotations]); // need annotations to re-run if instances change

  const renderAnnotation = (ann: PdfAnnotation) => {
    const isSelected = selectedIds.includes(ann.id);
    const locked = ann.data.locked === true;
    const draggable = !isReadOnly && !locked;

    const commonProps = {
      id: ann.id,
      x: ann.rect.x,
      y: ann.rect.y,
      width: ann.rect.width,
      height: ann.rect.height,
      draggable,
      onClick: (e: unknown) => {
        e.cancelBubble = true;
        onSelect(ann.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
      },
      onDragEnd: (e: unknown) => {
        onTransformEnd(ann.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      },
      onTransformEnd: (e: unknown) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onTransformEnd(ann.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation()
        });
      },
      rotation: ann.data.rotation as number || 0,
      opacity: ann.data.opacity as number || 1,
    };

    const textStyle = {
      fontFamily: (ann.data.fontFamily as string) || 'Inter, Outfit, sans-serif',
      fontSize: (ann.data.fontSize as number) || 16,
      fill: (ann.data.textColor as string) || '#000000',
      align: (ann.data.textAlign as string) || 'left',
      fontStyle: (ann.data.fontWeight as string) === 'bold' ? 'bold' : 'normal',
    };

    switch (ann.type) {
      case 'highlight':
        return (
          <Rect
            key={ann.id}
            {...commonProps}
            fill={(ann.data.backgroundColor as string) || '#fde047'}
            opacity={0.4}
            cornerRadius={4}
            shadowColor={isSelected ? '#3b82f6' : 'transparent'}
            shadowBlur={isSelected ? 10 : 0}
            stroke={isSelected ? '#3b82f6' : 'transparent'}
            strokeWidth={isSelected ? 2 : 0}
          />
        );
      case 'textbox':
      case 'comment':
      case 'sticky-note':
      case 'callout': {
        const isGlass = ['comment', 'sticky-note', 'callout'].includes(ann.type);
        const bgColor = (ann.data.backgroundColor as string) || (isGlass ? 'rgba(255,255,255,0.8)' : 'transparent');
        const strokeColor = (ann.data.borderColor as string) || (isSelected ? '#3b82f6' : 'transparent');
        const strokeW = (ann.data.borderWidth as number) || (isSelected ? 2 : 0);
        const radius = ann.type === 'sticky-note' ? 12 : 4;

        return (
          <Group key={ann.id} {...commonProps}>
            <Rect
              width={ann.rect.width}
              height={ann.rect.height}
              fill={bgColor}
              stroke={strokeColor}
              strokeWidth={strokeW}
              cornerRadius={radius}
              shadowColor={isSelected ? '#3b82f6' : 'rgba(0,0,0,0.1)'}
              shadowBlur={isSelected ? 10 : 4}
              shadowOffsetY={2}
            />
            <Text
              text={(ann.data.text as string) || 'Text'}
              width={ann.rect.width - 8}
              height={ann.rect.height - 8}
              x={4}
              y={4}
              {...textStyle}
            />
          </Group>
        );
      }
      case 'shape':
        return (
          <Rect
            key={ann.id}
            {...commonProps}
            fill={(ann.data.backgroundColor as string) || 'transparent'}
            stroke={(ann.data.borderColor as string) || '#ef4444'}
            strokeWidth={(ann.data.borderWidth as number) || 2}
            shadowColor={isSelected ? '#3b82f6' : 'transparent'}
            shadowBlur={isSelected ? 10 : 0}
          />
        );
      case 'line':
      case 'arrow':
      case 'freehand':
      case 'underline':
      case 'strikeout': {
         const points = (ann.data.points as number[]) || [0, 0, ann.rect.width, ann.rect.height];
         return (
           <Line
             key={ann.id}
             {...commonProps}
             points={points}
             stroke={(ann.data.borderColor as string) || '#000000'}
             strokeWidth={(ann.data.borderWidth as number) || 2}
             tension={ann.type === 'freehand' ? 0.5 : 0}
             shadowColor={isSelected ? '#3b82f6' : 'transparent'}
             shadowBlur={isSelected ? 10 : 0}
           />
         );
      }
      case 'stamp':
        return (
          <Text
            key={ann.id}
            {...commonProps}
            text={(ann.data.text as string) || 'Stamp'}
            fill={(ann.data.textColor as string) || '#ef4444'}
            fontSize={24}
            fontStyle="bold"
            shadowColor={isSelected ? '#3b82f6' : 'transparent'}
            shadowBlur={isSelected ? 10 : 0}
          />
        );
      default:
        return null;
    }
  };

  const sortedAnnotations = [...annotations].sort((a, b) => {
    const za = (a.data.zIndex as number) || 0;
    const zb = (b.data.zIndex as number) || 0;
    return za - zb;
  });

  return (
    <Stage
      width={width * scale}
      height={height * scale}
      scaleX={scale}
      scaleY={scale}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
      onMouseDown={(e) => {
        // clicked on stage - clear selection
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          onSelect('', false);
        }
      }}
    >
      <Layer ref={layerRef}>
        {sortedAnnotations.filter(a => a.pageNumber === pageNumber).map(renderAnnotation)}
        {!isReadOnly && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};

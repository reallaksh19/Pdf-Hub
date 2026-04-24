import React, { useEffect, useRef, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group, Shape, Line, Circle, Transformer } from 'react-konva';
import Konva from 'konva';
import type { PdfAnnotation } from '@/core/annotations/types';

interface AnnotationOverlayProps {
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
  annotations: PdfAnnotation[];
  selectedAnnotationIds: string[];
  activeTool: string;
  onSetSelection: (ids: string[]) => void;
  onUpdateAnnotation: (id: string, patch: Partial<PdfAnnotation>) => void;
  onClearSelection: () => void;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  pageNumber,
  scale,
  width,
  height,
  annotations,
  selectedAnnotationIds,
  activeTool,
  onSetSelection,
  onUpdateAnnotation,
  onClearSelection,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const isSelectTool = activeTool === 'select';

  const sortedAnnotations = useMemo(() => {
    return [...annotations].sort((a, b) => {
      const zA = a.data.zIndex || 0;
      const zB = b.data.zIndex || 0;
      return zA - zB;
    });
  }, [annotations]);

  useEffect(() => {
    if (!transformerRef.current || !layerRef.current || !isSelectTool) {
      if (transformerRef.current) {
         transformerRef.current.nodes([]);
      }
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const selectedNodes = selectedAnnotationIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node) => node !== undefined) as Konva.Node[];

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedAnnotationIds, isSelectTool, annotations]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelectTool) return;

    if (e.target === e.target.getStage()) {
      onClearSelection();
      return;
    }

    if (e.target.getParent()?.className === 'Transformer') {
      return;
    }

    const clickedOnAnnotation = e.target.hasName('annotation');
    if (clickedOnAnnotation) {
      const id = e.target.id();
      const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      const isSelected = selectedAnnotationIds.includes(id);

      if (!metaPressed && !isSelected) {
        onSetSelection([id]);
      } else if (metaPressed && isSelected) {
        const nodes = selectedAnnotationIds.slice();
        nodes.splice(nodes.indexOf(id), 1);
        onSetSelection(nodes);
      } else if (metaPressed && !isSelected) {
        const nodes = selectedAnnotationIds.concat([id]);
        onSetSelection(nodes);
      }
    }
  };

  const renderAnnotation = (ann: PdfAnnotation) => {
    const isSelected = selectedAnnotationIds.includes(ann.id);
    const { rect, data, type } = ann;
    const isLocked = data.locked === true;

    const commonProps = {
      id: ann.id,
      name: 'annotation',
      x: rect.x * scale,
      y: rect.y * scale,
      width: rect.width * scale,
      height: rect.height * scale,
      draggable: isSelectTool && !isLocked,
      rotation: data.rotation || 0,
      opacity: data.opacity ?? 1,
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        onUpdateAnnotation(ann.id, {
          rect: {
            ...rect,
            x: e.target.x() / scale,
            y: e.target.y() / scale,
          },
        });
      },
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onUpdateAnnotation(ann.id, {
          rect: {
            x: node.x() / scale,
            y: node.y() / scale,
            width: Math.max(5, node.width() * scaleX) / scale,
            height: Math.max(5, node.height() * scaleY) / scale,
          },
          data: {
             ...ann.data,
             rotation: node.rotation()
          }
        });
      },
    };

    const style = data.style || {};
    const fill = data.backgroundColor || style.fill || (type === 'highlight' ? 'rgba(255, 255, 0, 0.4)' : 'transparent');
    const stroke = data.borderColor || style.stroke || (type === 'shape' ? '#ef4444' : 'transparent');
    const strokeWidth = (data.borderWidth ?? style.strokeWidth ?? (type === 'shape' ? 2 : 0)) * scale;
    const textColor = data.textColor || style.textColor || '#000000';
    const fontSize = (data.fontSize || style.fontSize || 12) * scale;
    const isGlass = type === 'sticky-note' || type === 'callout' || type === 'comment';
    const cornerRadius = type === 'sticky-note' || type === 'comment' ? 12 : (type === 'highlight' ? 4 : 0);

    switch (type) {
      case 'textbox':
      case 'sticky-note':
      case 'callout':
      case 'comment':
        return (
          <Group key={ann.id} {...commonProps}>
            <Rect
              width={commonProps.width}
              height={commonProps.height}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              cornerRadius={cornerRadius}
              shadowColor={isGlass ? 'rgba(0,0,0,0.1)' : 'transparent'}
              shadowBlur={isGlass ? 10 : 0}
              shadowOffset={{ x: 0, y: isGlass ? 4 : 0 }}
              shadowOpacity={isGlass ? 1 : 0}
            />
            <Text
              text={data.text || ''}
              fill={textColor}
              fontSize={fontSize}
              width={commonProps.width}
              height={commonProps.height}
              padding={8 * scale}
              align={data.textAlign || 'left'}
              verticalAlign="top"
              fontStyle={data.fontWeight === 'bold' ? 'bold' : 'normal'}
              fontFamily="Inter, Outfit, sans-serif"
            />
          </Group>
        );
      case 'highlight':
      case 'shape':
        return (
          <Rect
            key={ann.id}
            {...commonProps}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            cornerRadius={cornerRadius}
            shadowColor={isSelected ? '#3b82f6' : 'transparent'}
            shadowBlur={isSelected ? 8 : 0}
            shadowOpacity={isSelected ? 0.8 : 0}
          />
        );
      case 'freehand':
      case 'line':
      case 'arrow':
        const points = (data.points || []).map((p: number) => p * scale);
        return (
          <Line
            key={ann.id}
            {...commonProps}
            points={points}
            stroke={stroke !== 'transparent' ? stroke : '#000000'}
            strokeWidth={strokeWidth || 2 * scale}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      default:
        return (
          <Rect
            key={ann.id}
            {...commonProps}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: isSelectTool ? 'auto' : 'none' }}>
      <Stage
        width={width}
        height={height}
        onMouseDown={handleStageClick}
        ref={stageRef}
      >
        <Layer ref={layerRef}>
          {sortedAnnotations.map(renderAnnotation)}
          {isSelectTool && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#3b82f6"
              anchorStroke="#3b82f6"
              anchorFill="#ffffff"
              anchorSize={8}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

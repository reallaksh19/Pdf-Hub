import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Transformer, Rect, Circle, Ellipse, Line, Text, Group } from 'react-konva';
import { Html } from 'react-konva-utils';
import Konva from 'konva';
import { useAnnotationStore } from '@/core/annotations/store';
import { useEditorStore } from '@/core/editor/store';
import type { PdfAnnotation } from '@/core/annotations/types';

interface AnnotationOverlayProps {
  pageNumber: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({ pageNumber, scale, pageWidth, pageHeight }) => {
  const { annotations, updateAnnotation, selectedAnnotationIds, setSelection, clearSelection } = useAnnotationStore();
  const { activeTool } = useEditorStore();
  const pageAnnotations = annotations.filter((a) => a.pageNumber === pageNumber);

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (transformerRef.current && layerRef.current) {
      const nodes = selectedAnnotationIds
        .map((id) => layerRef.current?.findOne(`#${id}`))
        .filter(Boolean) as Konva.Node[];
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedAnnotationIds]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    updateAnnotation(id, {
      rect: {
        ...pageAnnotations.find(a => a.id === id)!.rect,
        x: node.x() / scale,
        y: node.y() / scale,
      }
    });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, id: string) => {
    const node = e.target;
    const annotation = pageAnnotations.find((a) => a.id === id);
    if (!annotation) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateAnnotation(id, {
      rect: {
        x: node.x() / scale,
        y: node.y() / scale,
        width: Math.max(5, (annotation.rect.width * scaleX)),
        height: Math.max(5, (annotation.rect.height * scaleY)),
      },
      data: {
        ...annotation.data,
        rotation: node.rotation(),
      }
    });
  };

  const renderAnnotation = (annotation: PdfAnnotation) => {
    const isLocked = annotation.data.locked === true;
    const draggable = !isLocked && (activeTool === 'select' || activeTool === 'hand');
    const x = annotation.rect.x * scale;
    const y = annotation.rect.y * scale;
    const width = annotation.rect.width * scale;
    const height = annotation.rect.height * scale;
    const rotation = (annotation.data.rotation as number) || 0;

    const isTextLike = ['textbox', 'sticky-note', 'comment', 'callout'].includes(annotation.type);

    if (isTextLike) {
      const bgColor = typeof annotation.data.backgroundColor === 'string'
        ? annotation.data.backgroundColor
        : annotation.type === 'comment' ? 'rgba(255, 247, 204, 0.7)' : 'rgba(255, 255, 255, 0.7)';
      const borderColor = typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#60a5fa';
      const textColor = typeof annotation.data.textColor === 'string' ? annotation.data.textColor : '#0f172a';
      const fontSize = typeof annotation.data.fontSize === 'number' ? annotation.data.fontSize : 12;


      let leaderLine = null;
      if (annotation.type === 'callout' && annotation.data.anchor) {
        const anchor = annotation.data.anchor as { x: number; y: number };
        const lineEndX = width / 2;
        const lineEndY = height / 2;
        const anchorX = (anchor.x * scale) - x;
        const anchorY = (anchor.y * scale) - y;

        leaderLine = (
           <Line
             points={[anchorX, anchorY, lineEndX, lineEndY]}
             stroke={borderColor}
             strokeWidth={1}
             listening={false}
           />
        );
      }

      return (
        <Group
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) {
              setSelection([...selectedAnnotationIds, annotation.id]);
            } else {
              setSelection([annotation.id]);
            }
          }}
        >
          {leaderLine}
          <Rect
            width={width}
            height={height}
            fill="transparent"
          />
          <Html divProps={{ style: { pointerEvents: 'none' } }}>
            <div
              style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: bgColor,
                border: `${annotation.data.borderWidth || 1}px solid ${borderColor}`,
                color: textColor,
                fontSize: `${fontSize * scale}px`,
                padding: '4px',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: annotation.type === 'comment' ? '12px' : '4px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s'
              }}
            >
              {(annotation.data.text as string) || (annotation.data.content as string) || ''}
            </div>
          </Html>
        </Group>
      );
    }

    if (annotation.type === 'highlight') {
      return (
        <Rect
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={(annotation.data.backgroundColor as string) || 'yellow'}
          opacity={typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 0.38}
          cornerRadius={4}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        />
      );
    }


    if (annotation.type === 'shape' || annotation.type === 'rectangle') {
      return (
        <Rect
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={(annotation.data.borderColor as string) || 'red'}
          strokeWidth={(annotation.data.borderWidth as number) || 2}
          fill={(annotation.data.backgroundColor as string) || 'transparent'}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        />
      );
    }

    if (annotation.type === 'ellipse') {
      return (
        <Ellipse
          key={annotation.id}
          id={annotation.id}
          x={x + width / 2}
          y={y + height / 2}
          radiusX={width / 2}
          radiusY={height / 2}
          stroke={(annotation.data.borderColor as string) || 'red'}
          strokeWidth={(annotation.data.borderWidth as number) || 2}
          fill={(annotation.data.backgroundColor as string) || 'transparent'}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        />
      );
    }

    if (annotation.type === 'file-attachment') {
      return (
        <Group
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        >
          <Rect width={32} height={32} fill="#f1f5f9" cornerRadius={4} />
          <Text text="📎" fontSize={16} x={8} y={8} />
        </Group>
      );
    }
    if (annotation.type === 'freehand' || annotation.type === 'ink' || annotation.type === 'line' || annotation.type === 'arrow' || annotation.type === 'underline' || annotation.type === 'strikeout' || annotation.type === 'squiggly' || annotation.type === 'polygon' || annotation.type === 'polyline') {
      let points = (annotation.data.points as number[])?.map((p, i) => p * scale) || [];
      if (points.length === 0) {
         if (annotation.type === 'underline') points = [0, height, width, height];
         else if (annotation.type === 'strikeout') points = [0, height / 2, width, height / 2];
         else points = [0, 0, width, height];
      }

      return (
        <Group
          key={annotation.id}
          id={annotation.id}
          x={x}
          y={y}
          rotation={rotation}
          draggable={draggable}
          onDragEnd={(e) => handleDragEnd(e, annotation.id)}
          onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
          onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
          }}
        >
          <Line
            points={points}
            stroke={(annotation.data.borderColor as string) || 'red'}
            strokeWidth={(annotation.data.borderWidth as number) || 2}
            tension={(annotation.type === 'freehand' || annotation.type === 'ink') ? 0.5 : 0}
            lineCap="round"
            lineJoin="round"
            dash={annotation.type === 'squiggly' ? [2, 2] : undefined}
            closed={annotation.type === 'polygon'}
            fill={annotation.type === 'polygon' ? ((annotation.data.backgroundColor as string) || 'rgba(0,0,255,0.1)') : undefined}
          />
        </Group>
      );
    }

    return (
      <Rect
        key={annotation.id}
        id={annotation.id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="gray"
        opacity={0.5}
        rotation={rotation}
        draggable={draggable}
        onDragEnd={(e) => handleDragEnd(e, annotation.id)}
        onTransformEnd={(e) => handleTransformEnd(e, annotation.id)}
        onClick={(e) => {
            if (activeTool !== 'select') return;
            e.cancelBubble = true;
            if (e.evt.shiftKey) setSelection([...selectedAnnotationIds, annotation.id]);
            else setSelection([annotation.id]);
        }}
      />
    );
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: activeTool === 'select' || activeTool === 'hand' ? 'auto' : 'none' }}>
      <Stage
        ref={stageRef}
        width={pageWidth * scale}
        height={pageHeight * scale}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer ref={layerRef}>
          {pageAnnotations.map(renderAnnotation)}
          <Transformer
            ref={transformerRef}
            ignoreStroke={true}
            padding={5}
            borderStroke="#2563eb"
            anchorStroke="#2563eb"
            anchorFill="#ffffff"
            anchorSize={8}
            anchorCornerRadius={4}
          />
        </Layer>
      </Stage>
    </div>
  );
};

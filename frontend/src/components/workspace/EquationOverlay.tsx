import React, { useEffect, useState } from 'react';
import type { PdfAnnotation } from '@/core/annotations/types';
import { MathJaxAdapter } from '@/adapters/mathjax/MathJaxAdapter';

interface EquationOverlayProps {
  pageNumber: number;
  scale: number;
  equations: PdfAnnotation[];
  selectedAnnotationIds: string[];
  activeTool: string;
  onSetSelection: (ids: string[]) => void;
  onUpdateAnnotation: (id: string, patch: Partial<PdfAnnotation>) => void;
}

export const EquationOverlay: React.FC<EquationOverlayProps> = ({
  scale,
  equations,
  selectedAnnotationIds,
  activeTool,
  onSetSelection,
  onUpdateAnnotation,
}) => {
  const isSelectTool = activeTool === 'select';

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {equations.map((eq) => (
        <EquationNode
          key={eq.id}
          equation={eq}
          scale={scale}
          isSelected={selectedAnnotationIds.includes(eq.id)}
          isInteractive={isSelectTool}
          onClick={() => {
            if (isSelectTool) {
               onSetSelection([eq.id]);
            }
          }}
          onUpdate={(patch) => onUpdateAnnotation(eq.id, patch)}
        />
      ))}
    </div>
  );
};

interface EquationNodeProps {
  equation: PdfAnnotation;
  scale: number;
  isSelected: boolean;
  isInteractive: boolean;
  onClick: () => void;
  onUpdate: (patch: Partial<PdfAnnotation>) => void;
}

const EquationNode: React.FC<EquationNodeProps> = ({
  equation,
  scale,
  isSelected,
  isInteractive,
  onClick,
  onUpdate
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const { rect, data } = equation;

  const text = data.text || '';

  useEffect(() => {
    let isMounted = true;
    const renderMath = async () => {
      const fontSize = data.fontSize || 16;
      const svg = await MathJaxAdapter.renderToSvg(text, rect.width * scale, rect.height * scale, fontSize * scale);
      if (isMounted) {
        setSvgContent(svg);
      }
    };
    if (text) {
      renderMath();
    }
    return () => { isMounted = false; };
  }, [text, rect.width, rect.height, scale, data.fontSize]);

  return (
    <div
      onClick={(e) => {
        if (isInteractive) {
           e.stopPropagation();
           onClick();
        }
      }}
      className={`absolute ${isInteractive ? 'cursor-pointer pointer-events-auto' : ''}`}
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
        outline: isSelected ? '2px solid #3b82f6' : 'none',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      }}
    >
      <div
         dangerouslySetInnerHTML={{ __html: svgContent }}
         style={{ width: '100%', height: '100%' }}
      />
      {isSelected && (
        <div className="absolute top-0 right-0 transform translate-x-full -translate-y-full p-1 bg-white border border-gray-200 rounded shadow-sm text-xs">
          <button
             className="text-blue-500 hover:text-blue-700 pointer-events-auto"
             onClick={(e) => {
               e.stopPropagation();
               const newLatex = window.prompt('Edit Equation LaTeX', text);
               if (newLatex !== null && newLatex !== text) {
                  onUpdate({ data: { ...data, text: newLatex } });
               }
             }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

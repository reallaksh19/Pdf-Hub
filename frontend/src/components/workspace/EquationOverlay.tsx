import React, { useEffect, useRef } from 'react';
import { MathJaxAdapter } from '@/adapters/mathjax/MathJaxAdapter';
import { Edit2 } from 'lucide-react';

interface EquationBlock {
  id: string;
  latex?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status?: 'complete' | 'equation-failed';
  imageUrl?: string;
}

interface EquationOverlayProps {
  equations: EquationBlock[];
  scale: number;
  onEditEquation?: (id: string, currentLatex: string) => void;
}

const EquationNode: React.FC<{
  equation: EquationBlock;
  scale: number;
  onEdit: () => void;
}> = ({ equation, scale, onEdit }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (equation.status !== 'equation-failed' && equation.latex && containerRef.current) {
      MathJaxAdapter.renderLatex(equation.latex, containerRef.current);
    }
  }, [equation.latex, equation.status]);

  return (
    <div
      style={{
        position: 'absolute',
        left: equation.x * scale,
        top: equation.y * scale,
        width: equation.width * scale,
        height: equation.height * scale,
        backgroundColor: equation.status === 'equation-failed' ? 'rgba(254, 226, 226, 0.5)' : 'transparent',
      }}
      className="group"
    >
      {equation.status === 'equation-failed' ? (
        <div className="w-full h-full border-2 border-dashed border-red-400 flex flex-col items-center justify-center p-2 relative">
          {equation.imageUrl && (
            <img src={equation.imageUrl} alt="Failed equation" className="max-w-full max-h-full object-contain mb-2 opacity-50" />
          )}
          <span className="text-red-600 text-xs font-medium">Equation Failed</span>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute -top-3 -right-3 p-1.5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-blue-600"
        title="Edit Equation"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export const EquationOverlay: React.FC<EquationOverlayProps> = ({ equations, scale, onEditEquation }) => {
  if (!equations || equations.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <div className="relative w-full h-full pointer-events-auto">
        {equations.map((eq) => (
          <EquationNode
            key={eq.id}
            equation={eq}
            scale={scale}
            onEdit={() => onEditEquation && onEditEquation(eq.id, eq.latex || '')}
          />
        ))}
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { MathJaxAdapter } from '@/adapters/mathjax/MathJaxAdapter';

interface EquationData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  latex: string;
  status: 'complete' | 'equation-failed';
}

interface EquationOverlayProps {
  equations: EquationData[];
  scale: number;
  onEdit: (id: string) => void;
}

export const EquationOverlay: React.FC<EquationOverlayProps> = ({
  equations,
  scale,
  onEdit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathjaxRef = useRef<MathJaxAdapter | null>(null);

  useEffect(() => {
    if (!mathjaxRef.current) {
      mathjaxRef.current = new MathJaxAdapter();
    }

    const renderEqs = async () => {
      const adapter = mathjaxRef.current;
      if (!adapter) return;

      const eqsToRender = equations.filter((eq) => eq.status === 'complete');
      await adapter.renderAll(eqsToRender);
    };

    renderEqs();
  }, [equations, scale]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {equations.map((eq) => (
        <div
          key={eq.id}
          className="absolute"
          style={{
            left: eq.x * scale,
            top: eq.y * scale,
            width: eq.width * scale,
            height: eq.height * scale,
            pointerEvents: 'auto',
          }}
        >
          {eq.status === 'complete' ? (
            <div
              id={`eq-${eq.id}`}
              className="w-full h-full flex items-center justify-center bg-white/80 backdrop-blur-sm rounded border border-gray-200 shadow-sm"
            >
              {/* MathJax will render here */}
            </div>
          ) : (
            <div className="w-full h-full border-2 border-red-500 border-dashed bg-red-50/50 flex items-center justify-center">
              <span className="text-red-500 text-xs font-bold">Failed to render</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(eq.id);
            }}
            className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-xs z-10 cursor-pointer"
            title="Edit Equation"
          >
            Edit
          </button>
        </div>
      ))}
    </div>
  );
};

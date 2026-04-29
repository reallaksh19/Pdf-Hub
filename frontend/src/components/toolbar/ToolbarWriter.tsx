import React from 'react';
import { useWriterStore } from '../../core/writer/store';
import { bakeWriterElementsIntoPdf } from '../../core/writer/exporter';
import { useSessionStore } from '../../core/session/store';
import { Type, Image, Table, MousePointer2, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { PdfEditAdapter } from '../../adapters/pdf-edit/PdfEditAdapter';

export const ToolbarWriter: React.FC = () => {
  const { activeTool, setActiveTool, undo, redo, elements, clearPage } = useWriterStore();
  const { workingBytes, replaceWorkingCopy } = useSessionStore();

  const handleBake = async () => {
    if (!workingBytes || elements.length === 0) return;
    try {
      const bakedBytes = await bakeWriterElementsIntoPdf(workingBytes, elements);
      const pageCount = await PdfEditAdapter.countPages(bakedBytes);
      replaceWorkingCopy(bakedBytes, pageCount);
      // Clear all pages
      elements.forEach(el => clearPage(el.pageNumber));
    } catch {
      // ignore
    }
  };

  const renderToolButton = (tool: string, Icon: React.ElementType, label: string) => (
    <button
      onClick={() => setActiveTool(tool as "select" | "place-text" | "place-image" | "place-table")}
      style={{
        background: activeTool === tool ? '#e2e8f0' : 'transparent',
        border: 'none',
        padding: '6px 12px',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
      title={label}
    >
      <Icon size={16} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '0 12px' }}>
      <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #e2e8f0', paddingRight: 12 }}>
        <button onClick={undo} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><ArrowLeft size={16} /></button>
        <button onClick={redo} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><ArrowRight size={16} /></button>
      </div>

      {renderToolButton("select", MousePointer2, "Select")}
      {renderToolButton("place-text", Type, "Text")}
      {renderToolButton("place-image", Image, "Image")}
      {renderToolButton("place-table", Table, "Table")}

      <div style={{ flex: 1 }} />

      <button
        onClick={handleBake}
        disabled={elements.length === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: elements.length > 0 ? '#3b82f6' : '#cbd5e1',
          color: 'white',
          border: 'none',
          padding: '6px 16px',
          borderRadius: 6,
          cursor: elements.length > 0 ? 'pointer' : 'not-allowed',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <Save size={16} /> Bake & Export
      </button>
    </div>
  );
};

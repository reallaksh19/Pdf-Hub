import React, { useState } from 'react';
import { useWriterStore } from '../../core/writer/store';
import type { PlacedElement } from '../../core/writer/types';

interface Props {
  element: PlacedElement;
  scale: number;
  onClose: () => void;
}

export const TableEditorPanel: React.FC<Props> = ({ element, scale, onClose }) => {
  const { updateElement } = useWriterStore();
  const [data, setData] = useState<{ headers: string[], rows: string[][] }>(() => {
    try {
      return JSON.parse(element.content || '{"headers":[],"rows":[]}');
    } catch {
      return { headers: ['Col 1', 'Col 2'], rows: [['', ''], ['', '']] };
    }
  });

  const handleCommit = () => {
    updateElement(element.id, { content: JSON.stringify(data) });
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x * scale,
        top: element.y * scale,
        zIndex: element.zIndex + 10,
        background: 'white',
        border: '1px solid #ccc',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 12 }}>Table Editor</strong>
        <button onClick={handleCommit} style={{ fontSize: 12 }}>Done</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', gap: 4 }}>
           {data.headers.map((h, i) => (
             <input
               key={i}
               value={h}
               onChange={e => {
                 const newHeaders = [...data.headers];
                 newHeaders[i] = e.target.value;
                 setData({ ...data, headers: newHeaders });
               }}
               style={{ width: 60, fontSize: 12 }}
             />
           ))}
           <button onClick={() => setData({ ...data, headers: [...data.headers, `Col ${data.headers.length + 1}`], rows: data.rows.map(r => [...r, '']) })} style={{ fontSize: 12 }}>+ Col</button>
        </div>

        {data.rows.map((row, rIdx) => (
           <div key={rIdx} style={{ display: 'flex', gap: 4 }}>
             {row.map((cell, cIdx) => (
               <input
                 key={cIdx}
                 value={cell}
                 onChange={e => {
                   const newRows = [...data.rows];
                   newRows[rIdx][cIdx] = e.target.value;
                   setData({ ...data, rows: newRows });
                 }}
                 style={{ width: 60, fontSize: 12 }}
               />
             ))}
             <button onClick={() => {
                const newRows = [...data.rows];
                newRows.splice(rIdx, 1);
                setData({ ...data, rows: newRows });
             }} style={{ fontSize: 12 }}>x</button>
           </div>
        ))}
        <button onClick={() => setData({ ...data, rows: [...data.rows, Array(data.headers.length).fill('')] })} style={{ fontSize: 12 }}>+ Row</button>
      </div>
    </div>
  );
};

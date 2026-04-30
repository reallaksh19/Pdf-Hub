import React, { useState } from 'react';
import { useWriterStore } from '../../core/writer/store';
import type { PlacedElement } from '../../core/writer/types';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';

interface Props {
  element: PlacedElement;
  scale: number;
  onClose: () => void;
}

interface TableData {
  headers: string[];
  rows: string[][];
  borderColor?: string;
  headerBg?: string;
}

export const TableEditorPanel: React.FC<Props> = ({ element, scale, onClose }) => {
  const { updateElement } = useWriterStore();
  const [data, setData] = useState<TableData>(() => {
    try {
      return JSON.parse(element.content || '{"headers":[],"rows":[]}');
    } catch {
      return { headers: [], rows: [], borderColor: '#d1d5db', headerBg: '#f1f5f9' };
    }
  });

  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const updateTable = (newData: TableData) => {
    setData(newData);
    updateElement(element.id, { content: JSON.stringify(newData) });
  };

  const handleHeaderChange = (idx: number, val: string) => {
    const newHeaders = [...data.headers];
    newHeaders[idx] = val;
    updateTable({ ...data, headers: newHeaders });
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const newRows = [...data.rows];
    newRows[rIdx] = [...newRows[rIdx]];
    newRows[rIdx][cIdx] = val;
    updateTable({ ...data, rows: newRows });
  };

  const addRow = () => {
    const newRow = Array(Math.max(data.headers.length, 1)).fill('');
    updateTable({ ...data, rows: [...data.rows, newRow] });
  };

  const addCol = () => {
    const newHeaders = [...data.headers, `Col ${data.headers.length + 1}`];
    const newRows = data.rows.map(r => [...r, '']);
    updateTable({ ...data, headers: newHeaders, rows: newRows });
  };

  const deleteRow = () => {
    if (selectedRow === null) return;
    const newRows = data.rows.filter((_, i) => i !== selectedRow);
    updateTable({ ...data, rows: newRows });
    setSelectedRow(null);
  };

  const deleteCol = () => {
    if (selectedCol === null) return;
    const newHeaders = data.headers.filter((_, i) => i !== selectedCol);
    const newRows = data.rows.map(r => r.filter((_, i) => i !== selectedCol));
    updateTable({ ...data, headers: newHeaders, rows: newRows });
    setSelectedCol(null);
  };

  return (
    <div style={{
      position: 'absolute',
      left: element.x * scale,
      top: (element.y + element.height) * scale + 10,
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-secondary)',
      borderRadius: 8,
      padding: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 320,
    }}
    onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Tooltip content="Add Column">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addCol}>
            <Plus className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Delete Selected Column">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={deleteCol} disabled={selectedCol === null}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </Tooltip>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-tertiary)', margin: '0 4px' }} />

        <Tooltip content="Add Row">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addRow}>
            <Plus className="w-4 h-4 rotate-90" />
          </Button>
        </Tooltip>
        <Tooltip content="Delete Selected Row">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={deleteRow} disabled={selectedRow === null}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </Tooltip>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Tooltip content="Border Color">
            <input type="color" value={data.borderColor || '#d1d5db'} onChange={e => updateTable({ ...data, borderColor: e.target.value })} className="w-6 h-6 p-0 border-0 cursor-pointer" />
          </Tooltip>
          <Tooltip content="Header Background">
            <input type="color" value={data.headerBg || '#f1f5f9'} onChange={e => updateTable({ ...data, headerBg: e.target.value })} className="w-6 h-6 p-0 border-0 cursor-pointer" />
          </Tooltip>
        </div>

        <Tooltip content="Close">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 ml-2" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="overflow-auto max-h-[300px]">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {data.headers.map((h, i) => (
                <th key={i} style={{ border: `1px solid ${data.borderColor || '#ccc'}`, padding: 4, background: data.headerBg || '#f1f5f9', position: 'relative' }}>
                  <input
                    value={h}
                    onChange={e => handleHeaderChange(i, e.target.value)}
                    onFocus={() => setSelectedCol(i)}
                    style={{ width: '100%', minWidth: 60, background: 'transparent', border: 'none', outline: 'none', fontWeight: 500, fontSize: 13, color: 'var(--color-text-primary)' }}
                  />
                  {selectedCol === i && <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rIdx) => (
              <tr key={rIdx} className="relative">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ border: `1px solid ${data.borderColor || '#ccc'}`, padding: 4, position: 'relative' }}>
                    <input
                      value={cell}
                      onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                      onFocus={() => { setSelectedCol(cIdx); setSelectedRow(rIdx); }}
                      style={{ width: '100%', minWidth: 60, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-text-primary)' }}
                    />
                    {selectedRow === rIdx && <div className="absolute inset-0 border-y-2 border-blue-500 pointer-events-none z-10" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
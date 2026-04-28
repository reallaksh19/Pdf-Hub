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

  // Basic initial parsing
  let initialData = { headers: ['Col 1', 'Col 2'], rows: [['', '']], columnWidths: [], borderColor: '#d1d5db', headerBg: '#f1f5f9' };
  try {
    if (element.content) initialData = JSON.parse(element.content);
  } catch {
    // Ignore parse errors and use default
  }

  const [data, setData] = useState(initialData);

  const handleSave = () => {
    updateElement(element.id, { content: JSON.stringify(data) });
    onClose();
  };

  return (
    <div style={{
      position: 'absolute',
      left: element.x * scale,
      top: (element.y + element.height) * scale + 10,
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '10px' }}>
        Table Editor (Simplified for testing)
        <br/>
        <label>
          Columns:
          <input
            type="number"
            value={data.headers.length}
            onChange={(e) => {
              const num = parseInt(e.target.value) || 1;
              setData({...data, headers: Array(num).fill('Col')});
            }}
          />
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

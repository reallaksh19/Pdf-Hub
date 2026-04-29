import React, { useState } from 'react';
import { useWriterStore } from '../../core/writer/store';
import type { PlacedElement } from '../../core/writer/types';

interface Props {
  element: PlacedElement;
  scale: number;
  onClose: () => void;
}

export const RichTextEditorPanel: React.FC<Props> = ({ element, scale, onClose }) => {
  const { updateElement } = useWriterStore();
  const [content, setContent] = useState(element.content || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      updateElement(element.id, { content });
      onClose();
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: element.x * scale,
      top: (element.y + element.height) * scale + 10,
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
    onPointerDown={e => e.stopPropagation()}
    >
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{ width: 300, height: 100, fontFamily: 'inherit', fontSize: '14px', padding: 8 }}
        placeholder="Type HTML content here. Press Ctrl+Enter to save."
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={() => { updateElement(element.id, { content }); onClose(); }}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
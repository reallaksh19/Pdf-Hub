import React, { useState, useEffect } from 'react';
import { useWriterStore } from '../../core/writer/store';
import type { PlacedElement } from '../../core/writer/types';

interface Props {
  element: PlacedElement;
  scale: number;
  onClose: () => void;
}

export const RichTextEditorPanel: React.FC<Props> = ({ element, scale, onClose }) => {
  const { updateElement } = useWriterStore();
  const [content, setContent] = useState(element.content);

  useEffect(() => {
    // Initial sync
  }, []);

  const handleCommit = () => {
    updateElement(element.id, { content });
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: element.height * scale,
        zIndex: element.zIndex + 10,
        background: 'white',
        border: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div style={{ padding: 4, background: '#f1f5f9', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleCommit} style={{ fontSize: 12 }}>Done</button>
      </div>
      <textarea
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          resize: 'none',
          padding: 4,
          fontFamily: element.styles.fontFamily || 'sans-serif',
          fontSize: (element.styles.fontSize || 12) * scale,
          color: element.styles.color || 'black',
          background: element.styles.backgroundColor || 'transparent',
        }}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleCommit();
          }
        }}
        autoFocus
      />
    </div>
  );
};

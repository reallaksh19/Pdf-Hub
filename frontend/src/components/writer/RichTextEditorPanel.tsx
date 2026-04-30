import React, { useRef, useEffect } from 'react';
import { useWriterStore } from '../../core/writer/store';
import type { PlacedElement } from '../../core/writer/types';
import { Bold, Italic, Underline, List, ListOrdered, Save, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useState } from 'react';
import { sanitizeHtml } from '../../core/writer/htmlSanitizer';

interface Props {
  element: PlacedElement;
  scale: number;
  onClose: () => void;
}

export const RichTextEditorPanel: React.FC<Props> = ({ element, scale, onClose }) => {
  const { updateElement } = useWriterStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  // Initialize with content, or empty paragraph
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== element.content) {
      // Only update innerHTML if it's strictly different to avoid losing caret position
      editorRef.current.innerHTML = element.content || '<p></p>';
    }
  }, [element.content]);

  useEffect(() => {
    // Focus on mount
    editorRef.current?.focus();
  }, []);

  const saveContent = () => {
    if (editorRef.current) {
      updateElement(element.id, { content: editorRef.current.innerHTML });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      saveContent();
      onClose();
    }
  };

  const execCmd = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Look for image items in the clipboard
    const items = e.clipboardData.items;
    let handledImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        handledImage = true;
        const file = items[i].getAsFile();
        if (!file) continue;

        e.preventDefault(); // Stop default paste

        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          // Create an image element and insert it at the cursor position
          document.execCommand('insertImage', false, base64);

          // Wait a tick and then find the newly inserted image to style it
          setTimeout(() => {
            if (!editorRef.current) return;
            const imgs = editorRef.current.getElementsByTagName('img');
            // Assuming the last image is the one just pasted
            if (imgs.length > 0) {
               const img = imgs[imgs.length - 1];
               // Add default styles so it fits within the editor and exports nicely
               img.style.maxWidth = '100%';
               img.style.maxHeight = '300px';
               img.style.objectFit = 'contain';
               saveContent();
            }
          }, 0);
        };
        reader.readAsDataURL(file);
        break; // Only handle the first image
      }
    }

    // If it's not an image, try to grab text/html to sanitize it before pasting.
    if (!handledImage) {
      const htmlContent = e.clipboardData.getData('text/html');
      if (htmlContent) {
        e.preventDefault(); // Stop native unsafe paste
        const sanitized = sanitizeHtml(htmlContent);
        document.execCommand('insertHTML', false, sanitized);
      }
      setTimeout(saveContent, 0); // Save the content after paste completes
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: element.x * scale,
      top: (element.y + element.height) * scale + 10,
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-secondary)',
      borderRadius: 8,
      padding: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: 340,
    }}
    onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        <Tooltip content="Bold (Ctrl+B)">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('bold')}>
            <Bold className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Italic (Ctrl+I)">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('italic')}>
            <Italic className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Underline (Ctrl+U)">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('underline')}>
            <Underline className="w-4 h-4" />
          </Button>
        </Tooltip>
        <div style={{ width: 1, height: 16, background: 'var(--color-border-tertiary)', margin: '0 4px' }} />
        <Tooltip content="Bullet List">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('insertUnorderedList')}>
            <List className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Numbered List">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCmd('insertOrderedList')}>
            <ListOrdered className="w-4 h-4" />
          </Button>
        </Tooltip>

        <div className="flex-1" />

        <Tooltip content="Save (Ctrl+Enter)">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 dark:text-blue-400" onClick={() => { saveContent(); onClose(); }}>
            <Save className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Discard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onBlur={saveContent}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName === 'IMG') {
            setSelectedImage(e.target as HTMLImageElement);
          } else {
            setSelectedImage(null);
          }
        }}
        style={{
          minHeight: 120,
          fontFamily: 'inherit',
          fontSize: '14px',
          padding: '4px 8px',
          outline: 'none',
          color: 'var(--color-text-primary)',
          overflowY: 'auto',
          maxHeight: '400px'
        }}
      />

      {selectedImage && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 justify-center">
          <span className="text-xs text-slate-500 font-medium mr-2">Image Size:</span>
          <Tooltip content="Shrink Image">
             <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  if (!editorRef.current) return;
                  const currentWidth = selectedImage.style.width ? parseInt(selectedImage.style.width) : 100;
                  const newWidth = Math.max(10, currentWidth - 10);

                  // Clone the image node to modify it safely without violating React state immutability
                  const newImg = selectedImage.cloneNode() as HTMLImageElement;
                  newImg.style.width = `${newWidth}%`;
                  newImg.style.maxWidth = 'none';

                  selectedImage.replaceWith(newImg);
                  setSelectedImage(newImg);
                  saveContent();
                }}
              >
                <ZoomOut className="w-3 h-3" />
             </Button>
          </Tooltip>
          <Tooltip content="Enlarge Image">
             <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  if (!editorRef.current) return;
                  const currentWidth = selectedImage.style.width ? parseInt(selectedImage.style.width) : 100;
                  const newWidth = Math.min(100, currentWidth + 10);

                  // Clone the image node to modify it safely without violating React state immutability
                  const newImg = selectedImage.cloneNode() as HTMLImageElement;
                  newImg.style.width = `${newWidth}%`;
                  newImg.style.maxWidth = 'none';

                  selectedImage.replaceWith(newImg);
                  setSelectedImage(newImg);
                  saveContent();
                }}
              >
                <ZoomIn className="w-3 h-3" />
             </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
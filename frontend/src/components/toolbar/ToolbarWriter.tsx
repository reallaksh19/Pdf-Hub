import React from 'react';
import { Button } from '@/components/ui/Button';
import { MousePointer2, Type, Image as ImageIcon, Table, Save } from 'lucide-react';
import { useWriterStore } from '@/core/writer/store';
import { useSessionStore } from '@/core/session/store';
import { bakeWriterElementsIntoPdf } from '@/core/writer/exporter';
import { useToastStore } from '@/core/toast/store';

export const ToolbarWriter: React.FC = () => {
  const { activeTool, setActiveTool, elements, clearPage } = useWriterStore();
  const { workingBytes, replaceWorkingCopy, pageCount } = useSessionStore();
  const { addToast } = useToastStore();

  const handleExport = async () => {
    if (!workingBytes || elements.length === 0) return;
    try {
      const newBytes = await bakeWriterElementsIntoPdf(workingBytes, elements);
      replaceWorkingCopy(newBytes, pageCount);
      // Clear writer elements after successful bake
      const pages = Array.from(new Set(elements.map(e => e.pageNumber)));
      pages.forEach(p => clearPage(p));
      addToast({ type: 'success', title: 'Exported', message: `Baked ${elements.length} element(s) to PDF.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Export Failed', message: String(err) });
    }
  };

  return (
    <div className="flex items-center space-x-1 p-1">
      <Button
        variant={activeTool === 'select' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setActiveTool('select')}
        className="h-8"
      >
        <MousePointer2 className="w-4 h-4 mr-2" />
        Select
      </Button>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      <Button
        variant={activeTool === 'place-text' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setActiveTool('place-text')}
        className="h-8"
      >
        <Type className="w-4 h-4 mr-2" />
        Text Box
      </Button>
      <Button
        variant={activeTool === 'place-image' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setActiveTool('place-image')}
        className="h-8"
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Image
      </Button>
      <Button
        variant={activeTool === 'place-table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setActiveTool('place-table')}
        className="h-8"
      >
        <Table className="w-4 h-4 mr-2" />
        Table
      </Button>

      <div className="flex-1" />

      <Button
        variant="primary"
        size="sm"
        onClick={() => void handleExport()}
        disabled={elements.length === 0}
        className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Save className="w-4 h-4 mr-2" />
        Bake & Export
      </Button>
    </div>
  );
};

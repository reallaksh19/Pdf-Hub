import React from 'react';
import { UploadCloud, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { VList } from 'virtua';
import { AnnotationOverlay } from './AnnotationOverlay';
import { EquationOverlay } from './EquationOverlay';

import { PdfRendererAdapter, type TextLayerItem } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { loadAnnotations, saveAnnotations } from '@/core/annotations/persistence';
import { useAnnotationStore } from '@/core/annotations/store';
import type { PdfAnnotation, Rect, AnnotationType, Point2D } from '@/core/annotations/types';
import { useEditorStore } from '@/core/editor/store';
import { useSessionStore } from '@/core/session/store';
import { useReviewStore } from '@/core/review/store';
import { useSearchStore } from '@/core/search/store';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

type TransformState =
  | {
      ids: string[];
      targetId: string;
      mode: 'move' | 'resize';
      startClientX: number;
      startClientY: number;
      startRects: Record<string, Rect>;
      startAnchors: Record<string, Point2D | null>;
      startPoints: Record<string, number[] | null>;
      pageWidth: number;
      pageHeight: number;
    }
  | null;

type AnchorDragState =
  | {
      id: string;
      startClientX: number;
      startClientY: number;
      startAnchor: Point2D;
      pageWidth: number;
      pageHeight: number;
    }
  | null;

type TextSelectionDraft = {
  text: string;
  rects: Rect[];
  unionRect: Rect;
};

export const DocumentWorkspace: React.FC = () => {
  const {
    annotations,
    setAnnotations,
    addAnnotation,
    updateAnnotation,
    updateManyAnnotations,
    setActiveAnnotationId,
    selectedAnnotationIds,
    setSelection,
    toggleSelection,
    clearSelection,
  } = useAnnotationStore();

  const {
    workingBytes,
    documentKey,
    viewState,
    setPage,
    setZoom,
    openDocument,
  } = useSessionStore();

  const { activeTool } = useEditorStore();
  const { hideResolved } = useReviewStore();

  const [pdfDoc, setPdfDoc] = React.useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const lastPanPos = React.useRef<{ x: number; y: number } | null>(null);

  const handleBrowse = async () => {
    try {
      const [picked] = await FileAdapter.pickPdfFiles(false);
      if (!picked) return;

      const safeBytes = new Uint8Array(picked.bytes);
      const pageCount = await PdfEditAdapter.countPages(safeBytes);
      const nextDocumentKey = await FileAdapter.hashBytes(safeBytes);

      openDocument({
        documentKey: nextDocumentKey,
        fileName: picked.name,
        bytes: safeBytes,
        pageCount,
        saveHandle: picked.handle ?? null,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setLoadError(String(err));
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    let previousDoc: PDFDocumentProxy | null = null;

    const load = async () => {
      if (!workingBytes) {
        setPdfDoc(null);
        setLoadError(null);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const doc = await PdfRendererAdapter.loadDocument(workingBytes);
        if (cancelled) {
          await doc.destroy();
          return;
        }

        previousDoc = doc;
        setPdfDoc(doc);
      } catch (err) {
        if (!cancelled) {
          setLoadError(String(err));
          setPdfDoc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (previousDoc) void previousDoc.destroy();
    };
  }, [workingBytes]);

  React.useEffect(() => {
    const loadStored = async () => {
      if (!documentKey) return;
      const stored = await loadAnnotations(documentKey);
      setAnnotations(stored);
    };
    void loadStored();
  }, [documentKey, setAnnotations]);

  React.useEffect(() => {
    if (!documentKey) return;

    const timer = window.setTimeout(() => {
      void saveAnnotations(documentKey, annotations);
    }, 400);

    const flushNow = () => {
      void saveAnnotations(documentKey, useAnnotationStore.getState().annotations);
    };

    window.addEventListener('pagehide', flushNow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', flushNow);
    };
  }, [annotations, documentKey]);

  React.useLayoutEffect(() => {
    if (!pdfDoc || !containerRef.current || viewState.fitMode === 'manual') return;

    let resizeTimer: number;

    const handleResize = async () => {
      if (!pdfDoc || !containerRef.current) return;
      try {
        const page = await pdfDoc.getPage(viewState.currentPage);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current.clientWidth - 32;
        const containerHeight = containerRef.current.clientHeight - 32;

        if (viewState.fitMode === 'width') {
          const newZoom = (containerWidth / viewport.width) * 100;
          setZoom(Math.floor(newZoom));
        } else if (viewState.fitMode === 'page') {
          const scaleWidth = containerWidth / viewport.width;
          const scaleHeight = containerHeight / viewport.height;
          const newZoom = Math.min(scaleWidth, scaleHeight) * 100;
          setZoom(Math.floor(newZoom));
        }
      } catch {
        // Ignore viewport calculation failures during transitional renders.
      }
    };

    const observer = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => void handleResize(), 100);
    });

    observer.observe(containerRef.current);
    void handleResize();

    return () => {
      observer.disconnect();
      window.clearTimeout(resizeTimer);
    };
  }, [pdfDoc, viewState.fitMode, viewState.currentPage, setZoom]);

  if (!workingBytes) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-950/50">
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Open a PDF to begin
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Annotation layer revamp is active in this build.
          </p>
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            onClick={handleBrowse}
          >
            Browse Files
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-slate-500">Loading PDF…</div>;
  }

  if (loadError) {
    return <div className="h-full flex items-center justify-center text-red-600">Failed to load PDF: {loadError}</div>;
  }

  if (!pdfDoc) return null;

  const renderPage = (index: number) => {
    const pageNumber = index + 1;
    return (
      <div key={pageNumber} className="flex justify-center mb-8">
        <PageSurface
          doc={pdfDoc}
          pageNumber={pageNumber}
          scale={viewState.zoom / 100}
          activeTool={activeTool}
          pageAnnotations={annotations
            .filter((annotation) => annotation.pageNumber === pageNumber)
            .filter((annotation) => !hideResolved || annotation.data.review?.status !== 'resolved')
            .slice()
            .sort((a, b) => readZIndex(a) - readZIndex(b))}
          selectedAnnotationIds={selectedAnnotationIds}
          onActivate={() => setPage(pageNumber)}
          onCreateAnnotation={(annotation) => {
            addAnnotation(annotation);
            setSelection([annotation.id]);
            setActiveAnnotationId(annotation.id);
          }}
          onCreateManyAnnotations={(items) => {
            items.forEach((item) => addAnnotation(item));
            if (items.length > 0) {
              const ids = items.map((item) => item.id);
              setSelection(ids);
              setActiveAnnotationId(ids[0] ?? null);
            }
          }}
          onSetSingleSelection={(id) => {
            setSelection([id]);
            setActiveAnnotationId(id);
          }}
          onToggleSelection={(id) => {
            toggleSelection(id);
            setActiveAnnotationId(id);
          }}
          onSetSelection={(ids) => {
            setSelection(ids);
            setActiveAnnotationId(ids[0] ?? null);
          }}
          onClearSelection={clearSelection}
          onCommitAnnotation={(id, patch) => {
            updateAnnotation(id, patch);
          }}
          onCommitManyAnnotations={(updates) => {
            updateManyAnnotations(updates);
          }}
        />
      </div>
    );
  };

  const renderSingle = () => (
    <div className="flex flex-col items-center">
      {renderPage(viewState.currentPage - 1)}
    </div>
  );

  const renderTwoPage = () => {
    const pages: React.ReactNode[] = [];
    let i = 0;
    while (i < pdfDoc.numPages) {
      if (i === 0) {
        pages.push(
          <div key={`spread-${i}`} className="flex justify-center gap-8 mb-8 w-full">
            <div className="flex-1 flex justify-end" />
            <div className="flex-1 flex justify-start">{renderPage(i)}</div>
          </div>,
        );
        i += 1;
      } else {
        const leftIndex = i;
        const rightIndex = i + 1 < pdfDoc.numPages ? i + 1 : null;
        pages.push(
          <div key={`spread-${i}`} className="flex justify-center gap-8 mb-8 w-full max-w-[2000px]">
            <div className="flex-1 flex justify-end">{renderPage(leftIndex)}</div>
            <div className="flex-1 flex justify-start">
              {rightIndex !== null ? renderPage(rightIndex) : null}
            </div>
          </div>,
        );
        i += 2;
      }
    }

    const currentSpreadIndex =
      viewState.currentPage === 1 ? 0 : Math.floor(viewState.currentPage / 2);

    return <div className="flex flex-col items-center w-full">{pages[currentSpreadIndex]}</div>;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'hand') return;
    setIsPanning(true);
    lastPanPos.current = { x: event.clientX, y: event.clientY };
    if (containerRef.current) {
      containerRef.current.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || activeTool !== 'hand' || !lastPanPos.current || !containerRef.current) return;
    const dx = event.clientX - lastPanPos.current.x;
    const dy = event.clientY - lastPanPos.current.y;
    containerRef.current.scrollBy(-dx, -dy);
    lastPanPos.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'hand') return;
    setIsPanning(false);
    lastPanPos.current = null;
    if (containerRef.current && containerRef.current.hasPointerCapture(event.pointerId)) {
      containerRef.current.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-200 dark:bg-slate-950 overflow-auto ${
        activeTool === 'hand' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="min-h-full flex flex-col items-center py-8">
        {viewState.viewMode === 'continuous' ? (
          <VList
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {Array.from({ length: pdfDoc.numPages }, (_, index) => renderPage(index))}
          </VList>
        ) : viewState.viewMode === 'single' ? (
          renderSingle()
        ) : (
          renderTwoPage()
        )}
      </div>
    </div>
  );
};

interface PageSurfaceProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  activeTool: string;
  pageAnnotations: PdfAnnotation[];
  selectedAnnotationIds: string[];
  onActivate: () => void;
  onCreateAnnotation: (annotation: PdfAnnotation) => void;
  onCreateManyAnnotations: (annotations: PdfAnnotation[]) => void;
  onSetSingleSelection: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onClearSelection: () => void;
  onCommitAnnotation: (id: string, patch: Partial<PdfAnnotation>) => void;
  onCommitManyAnnotations: (updates: Array<{ id: string; data: Partial<PdfAnnotation> }>) => void;
}

const PageSurface: React.FC<PageSurfaceProps> = ({
  doc,
  pageNumber,
  scale,
  activeTool,
  pageAnnotations,
  selectedAnnotationIds,
  onActivate,
  onCreateAnnotation,
  onCreateManyAnnotations,
  onSetSingleSelection,
  onToggleSelection,
  onSetSelection,
  onClearSelection,
  onCommitAnnotation,
  onCommitManyAnnotations,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pageRef = React.useRef<HTMLDivElement | null>(null);
  const { hits, activeHitId } = useSearchStore();
  const isSelectTool = activeTool === 'select';
  const isTextMarkTool =
    activeTool === 'highlight' || activeTool === 'underline' || activeTool === 'strikeout';
  const isNoteTool = activeTool === 'comment' || activeTool === 'callout';
  const isPlacementOnlyTool =
    activeTool === 'textbox' ||
    activeTool === 'shape' ||
    activeTool === 'line' ||
    activeTool === 'arrow' ||
    activeTool === 'stamp';

  const [size, setSize] = React.useState({ width: 800, height: 1000 });
  const [textItems, setTextItems] = React.useState<TextLayerItem[]>([]);
  const [draftRects, setDraftRects] = React.useState<Record<string, Rect>>({});
  const [draftAnchors, setDraftAnchors] = React.useState<Record<string, Point2D | null>>({});
  const [draftLinePoints, setDraftLinePoints] = React.useState<Record<string, number[]>>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const [marquee, setMarquee] = React.useState<Rect | null>(null);
  const [textSelectionDraft, setTextSelectionDraft] = React.useState<TextSelectionDraft | null>(null);
  const transformRef = React.useRef<TransformState>(null);
  const anchorDragRef = React.useRef<AnchorDragState>(null);
  const draftRectsRef = React.useRef<Record<string, Rect>>({});
  const draftAnchorsRef = React.useRef<Record<string, Point2D | null>>({});
  const draftLinePointsRef = React.useRef<Record<string, number[]>>({});

  React.useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      if (!cancelled) {
        setSize({ width: viewport.width, height: viewport.height });
      }

      if (!cancelled && canvasRef.current) {
        await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);
      }

      const items = await PdfRendererAdapter.getPageTextItems(page, scale);
      if (!cancelled) {
        setTextItems(items);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);

  React.useEffect(() => {
    draftRectsRef.current = draftRects;
  }, [draftRects]);

  React.useEffect(() => {
    draftAnchorsRef.current = draftAnchors;
  }, [draftAnchors]);

  React.useEffect(() => {
    draftLinePointsRef.current = draftLinePoints;
  }, [draftLinePoints]);

  const pageWidth = size.width / scale;
  const pageHeight = size.height / scale;

  const clampRect = React.useCallback(
    (rect: Rect): Rect => {
      const width = Math.max(8, Math.min(rect.width, pageWidth));
      const height = Math.max(8, Math.min(rect.height, pageHeight));
      const x = Math.max(0, Math.min(rect.x, pageWidth - width));
      const y = Math.max(0, Math.min(rect.y, pageHeight - height));

      return { x, y, width, height };
    },
    [pageHeight, pageWidth],
  );

  const clearTextSelectionDraft = React.useCallback(() => {
    setTextSelectionDraft(null);
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // Ignore browser selection API edge cases.
    }
  }, []);

  const commitTextEdit = (annotation: PdfAnnotation, value: string) => {
    const currentRect = draftRectsRef.current[annotation.id];
    const nextRect =
      annotation.data.autoSize !== false && isTextLike(annotation.type)
        ? autoSizeRectForText(
            value,
            readFontSize(annotation),
            currentRect ?? annotation.rect,
          )
        : currentRect ?? annotation.rect;

    onCommitAnnotation(annotation.id, {
      rect: nextRect,
      data: {
        ...annotation.data,
        text: value,
      },
    });
    setEditingId(null);
  };

  const startTransform = (
    event: React.MouseEvent<HTMLDivElement>,
    annotation: PdfAnnotation,
    mode: 'move' | 'resize',
  ) => {
    if (annotation.data.locked === true) return;

    event.stopPropagation();
    clearTextSelectionDraft();

    const selectedOnPage = pageAnnotations
      .filter((item) => selectedAnnotationIds.includes(item.id) && item.data.locked !== true)
      .map((item) => item.id);

    const ids =
      mode === 'move' &&
      selectedOnPage.includes(annotation.id) &&
      selectedOnPage.length > 1
        ? selectedOnPage
        : [annotation.id];

    if (!(mode === 'move' && ids.length > 1)) {
      onSetSingleSelection(annotation.id);
    }

    const startRects: Record<string, Rect> = {};
    const startAnchors: Record<string, Point2D | null> = {};
    const startPoints: Record<string, number[] | null> = {};

    ids.forEach((id) => {
      const item = pageAnnotations.find((value) => value.id === id);
      if (!item) return;
      startRects[id] = draftRectsRef.current[id] ?? item.rect;
      startAnchors[id] = readAnchor(item, draftAnchorsRef.current[id] ?? null);
      startPoints[id] = readPoints(item, draftLinePointsRef.current[id] ?? null);
    });

    transformRef.current = {
      ids,
      targetId: annotation.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRects,
      startAnchors,
      startPoints,
      pageWidth: size.width / scale,
      pageHeight: size.height / scale,
    };

    const onMove = (moveEvent: MouseEvent) => {
      const current = transformRef.current;
      if (!current) return;

      const dx = (moveEvent.clientX - current.startClientX) / scale;
      const dy = (moveEvent.clientY - current.startClientY) / scale;

      if (current.mode === 'move') {
        const nextRects: Record<string, Rect> = {};
        const nextAnchors: Record<string, Point2D | null> = {};

        current.ids.forEach((id) => {
          const baseRect = current.startRects[id];
          nextRects[id] = clampRect({
            ...baseRect,
            x: baseRect.x + dx,
            y: baseRect.y + dy,
          });

          const anchor = current.startAnchors[id];
          nextAnchors[id] = anchor
            ? {
                x: clamp(anchor.x + dx, 0, current.pageWidth),
                y: clamp(anchor.y + dy, 0, current.pageHeight),
              }
            : null;
        });

        setDraftRects((state) => ({ ...state, ...nextRects }));
        setDraftAnchors((state) => ({ ...state, ...nextAnchors }));
      } else {
        const baseRect = current.startRects[current.targetId];
        const target = pageAnnotations.find((item) => item.id === current.targetId);
        if (!target) return;

        const resized = clampRect({
          ...baseRect,
          width: baseRect.width + dx,
          height: baseRect.height + dy,
        });

        const scaled =
          target.type === 'line' || target.type === 'arrow'
            ? resizeLineLikeRect(baseRect, resized, current.startPoints[current.targetId])
            : { rect: resized, points: null };

        if (target.type === 'line' || target.type === 'arrow') {
          const linePoints = scaled.points;
          if (Array.isArray(linePoints)) {
            setDraftLinePoints((state) => ({
              ...state,
              [current.targetId]: linePoints,
            }));
          }
        }

        setDraftRects((state) => ({
          ...state,
          [current.targetId]: scaled.rect,
        }));
      }
    };

    const onUp = () => {
      const current = transformRef.current;
      if (!current) return;

      if (current.mode === 'move') {
        const liveRects = draftRectsRef.current;
        const liveAnchors = draftAnchorsRef.current;
        onCommitManyAnnotations(
          current.ids.map((id) => ({
            id,
            data: {
              rect: liveRects[id] ?? current.startRects[id],
              data: {
                ...(pageAnnotations.find((item) => item.id === id)?.data ?? {}),
                ...(current.startAnchors[id]
                  ? { anchor: liveAnchors[id] ?? current.startAnchors[id] }
                  : {}),
              },
            } as Partial<PdfAnnotation>,
          })),
        );
      } else {
        const item = pageAnnotations.find((value) => value.id === current.targetId);
        if (item) {
          const liveRects = draftRectsRef.current;
          const livePoints = draftLinePointsRef.current;
          const nextRect = liveRects[current.targetId] ?? current.startRects[current.targetId];
          const nextPoints = livePoints[current.targetId];
          const patch: Partial<PdfAnnotation> = { rect: nextRect };
          if (
            (item.type === 'line' || item.type === 'arrow') &&
            Array.isArray(nextPoints)
          ) {
            patch.data = { ...item.data, points: nextPoints };
          }
          onCommitAnnotation(current.targetId, patch);
        }
      }

      setDraftRects((state) => {
        const next = { ...state };
        current.ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setDraftAnchors((state) => {
        const next = { ...state };
        current.ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setDraftLinePoints((state) => {
        const next = { ...state };
        current.ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });

      transformRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startAnchorDrag = (
    event: React.MouseEvent<HTMLDivElement>,
    annotation: PdfAnnotation,
  ) => {
    if (annotation.data.locked === true) return;

    const anchor = readAnchor(annotation, draftAnchors[annotation.id] ?? null);
    if (!anchor) return;

    event.stopPropagation();
    clearTextSelectionDraft();
    onSetSingleSelection(annotation.id);

    anchorDragRef.current = {
      id: annotation.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startAnchor: anchor,
      pageWidth,
      pageHeight,
    };

    const onMove = (moveEvent: MouseEvent) => {
      const current = anchorDragRef.current;
      if (!current) return;

      const dx = (moveEvent.clientX - current.startClientX) / scale;
      const dy = (moveEvent.clientY - current.startClientY) / scale;

      setDraftAnchors((state) => ({
        ...state,
        [current.id]: {
          x: clamp(current.startAnchor.x + dx, 0, current.pageWidth),
          y: clamp(current.startAnchor.y + dy, 0, current.pageHeight),
        },
      }));
    };

    const onUp = () => {
      const current = anchorDragRef.current;
      if (!current) return;

      const item = pageAnnotations.find((value) => value.id === current.id);
      if (item) {
        const liveAnchors = draftAnchorsRef.current;
        onCommitAnnotation(current.id, {
          data: {
            ...item.data,
            anchor: liveAnchors[current.id] ?? current.startAnchor,
          },
        });
      }

      setDraftAnchors((state) => {
        const next = { ...state };
        delete next[current.id];
        return next;
      });

      anchorDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTextSelectionMouseUp = () => {
    if (!(isSelectTool || isTextMarkTool || isNoteTool) || !pageRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setTextSelectionDraft(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setTextSelectionDraft(null);
      return;
    }

    const pageRect = pageRef.current.getBoundingClientRect();
    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects())
      .map((domRect) => domRectToPageRect(domRect, pageRect, scale))
      .filter((rect) => rect.width > 2 && rect.height > 2);

    if (rects.length === 0) {
      setTextSelectionDraft(null);
      return;
    }

    const draft = {
      text,
      rects,
      unionRect: unionRects(rects),
    };

    if (isTextMarkTool || isNoteTool) {
      if (activeTool === 'highlight') {
        const items = draft.rects.map((rect) => buildHighlightAnnotation(pageNumber, rect));
        onCreateManyAnnotations(items);
      } else if (activeTool === 'underline') {
        const items = draft.rects.map((rect) => buildUnderlineAnnotation(pageNumber, rect));
        onCreateManyAnnotations(items);
      } else if (activeTool === 'strikeout') {
        const items = draft.rects.map((rect) => buildStrikeoutAnnotation(pageNumber, rect));
        onCreateManyAnnotations(items);
      } else if (activeTool === 'comment' || activeTool === 'callout') {
        const item = buildCalloutFromSelection(
          pageNumber,
          draft.unionRect,
          draft.text,
          pageWidth,
          pageHeight,
        );
        if (activeTool === 'comment') {
          item.type = 'comment';
          item.data.backgroundColor = '#fff7cc';
          item.data.borderColor = '#d4b106';
          item.data.title = 'Note';
        }
        onCreateAnnotation(item);
      }

      clearTextSelectionDraft();
      useEditorStore.getState().setActiveTool('select');
    } else {
      setTextSelectionDraft(draft);
    }
  };

  const createHighlightsFromSelection = () => {
    if (!textSelectionDraft) return;
    const items = textSelectionDraft.rects.map((rect) =>
      buildHighlightAnnotation(pageNumber, rect),
    );
    onCreateManyAnnotations(items);
    clearTextSelectionDraft();
  };

  const createUnderlineFromSelection = () => {
    if (!textSelectionDraft) return;
    const items = textSelectionDraft.rects.map((rect) =>
      buildUnderlineAnnotation(pageNumber, rect),
    );
    onCreateManyAnnotations(items);
    clearTextSelectionDraft();
  };

  const createStrikeoutFromSelection = () => {
    if (!textSelectionDraft) return;
    const items = textSelectionDraft.rects.map((rect) =>
      buildStrikeoutAnnotation(pageNumber, rect),
    );
    onCreateManyAnnotations(items);
    clearTextSelectionDraft();
  };

  const createNoteFromSelection = (type: 'comment' | 'callout' = 'comment') => {
    if (!textSelectionDraft) return;
    const item = buildCalloutFromSelection(
      pageNumber,
      textSelectionDraft.unionRect,
      textSelectionDraft.text,
      pageWidth,
      pageHeight,
    );
    if (type === 'comment') {
      item.type = 'comment';
      item.data.backgroundColor = '#fff7cc';
      item.data.borderColor = '#d4b106';
      item.data.title = 'Note';
    }
    onCreateAnnotation(item);
    clearTextSelectionDraft();
  };

  const marqueeRef = React.useRef<Rect | null>(null);
  React.useEffect(() => {
    marqueeRef.current = marquee;
  }, [marquee]);

  const startMarquee = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'select') return;
    if (event.target !== event.currentTarget) return;

    clearTextSelectionDraft();
    const hostRect = event.currentTarget.getBoundingClientRect();
    const startX = (event.clientX - hostRect.left) / scale;
    const startY = (event.clientY - hostRect.top) / scale;
    let latestMarquee: Rect = { x: startX, y: startY, width: 0, height: 0 };
    setMarquee(latestMarquee);

    const onMove = (moveEvent: MouseEvent) => {
      const x = (moveEvent.clientX - hostRect.left) / scale;
      const y = (moveEvent.clientY - hostRect.top) / scale;
      latestMarquee = {
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY),
      };
      setMarquee(latestMarquee);
    };

    const onUp = () => {
      const currentMarquee = marqueeRef.current ?? latestMarquee;
      if (currentMarquee) {
        const hitIds = pageAnnotations
          .filter((annotation) => intersects(annotation.rect, currentMarquee))
          .map((annotation) => annotation.id);

        if (event.metaKey || event.ctrlKey) {
          hitIds.forEach((id) => onToggleSelection(id));
        } else if (hitIds.length > 0) {
          onSetSelection(hitIds);
        } else {
          onClearSelection();
        }
      }

      setMarquee(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onActivate();

    const hostRect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - hostRect.left) / scale;
    const y = (event.clientY - hostRect.top) / scale;

    if (
      activeTool === 'textbox' ||
      activeTool === 'comment' ||
      activeTool === 'stamp' ||
      activeTool === 'highlight' ||
      activeTool === 'shape' ||
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'callout'
    ) {
      clearTextSelectionDraft();
      onCreateAnnotation(buildAnnotation(activeTool as AnnotationType, pageNumber, x, y));
      return;
    }

    if (activeTool === 'select' && event.target !== event.currentTarget) {
      return;
    }

    clearTextSelectionDraft();
    onClearSelection();
  };

  return (
    <div
      ref={pageRef}
      className="relative bg-white dark:bg-slate-900 shadow-md mb-8 transition-all hover:ring-1 hover:ring-slate-300"
      style={{ width: size.width, minHeight: size.height }}
      onClick={onActivate}
    >
      <canvas ref={canvasRef} className="block" />

      <div
        className="absolute inset-0"
        style={{
          pointerEvents: isSelectTool || isTextMarkTool || isNoteTool ? 'auto' : 'none',
          userSelect: isSelectTool || isTextMarkTool || isNoteTool ? 'text' : 'none',
        }}
        onMouseDown={startMarquee}
        onMouseUp={handleTextSelectionMouseUp}
      >
        {hits
          .filter((hit) => hit.pageNumber === pageNumber)
          .map((hit) =>
            hit.rects.map((rect, index) => {
              const isActive = hit.id === activeHitId;
              return (
                <div
                  key={`hit-${hit.id}-${index}`}
                  className={`absolute pointer-events-none ${
                    isActive ? 'bg-orange-300/35 border border-orange-500/60' : 'bg-yellow-200/30 border border-yellow-400/35'
                  }`}
                  style={{
                    left: rect.x * scale,
                    top: rect.y * scale,
                    width: rect.width * scale,
                    height: rect.height * scale,
                  }}
                />
              );
            }),
          )}

        {textItems.map((item) => (
          <span
            key={item.id}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
              fontSize: item.fontSize,
              lineHeight: `${item.height}px`,
              whiteSpace: 'pre',
              color: 'rgba(0,0,0,0.01)',
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      {textSelectionDraft && (
        <>
          {textSelectionDraft.rects.map((rect, index) => (
            <div
              key={`sel-${index}`}
              className="absolute pointer-events-none bg-yellow-300/35 border border-yellow-400/40"
              style={{
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
              }}
            />
          ))}

          {isSelectTool && (
            <div
              className="absolute z-30 flex items-center gap-2 rounded-lg bg-slate-900 text-white px-2 py-1 shadow-lg"
              style={{
                left: Math.max(6, textSelectionDraft.unionRect.x * scale),
                top: Math.max(6, textSelectionDraft.unionRect.y * scale - 34),
              }}
            >
              <button
                className="text-xs hover:text-yellow-300"
                onClick={createHighlightsFromSelection}
              >
                Highlight
              </button>
              <button
                className="text-xs hover:text-red-300"
                onClick={createUnderlineFromSelection}
              >
                Underline
              </button>
              <button
                className="text-xs hover:text-red-300"
                onClick={createStrikeoutFromSelection}
              >
                Strikeout
              </button>
              <button
                className="text-xs hover:text-blue-300"
                onClick={() => createNoteFromSelection('comment')}
              >
                Note
              </button>
              <button
                className="text-xs hover:text-blue-300"
                onClick={() => createNoteFromSelection('callout')}
              >
                Callout
              </button>
              <button
                className="text-xs opacity-70 hover:opacity-100"
                onClick={clearTextSelectionDraft}
              >
                x
              </button>
            </div>
          )}
        </>
      )}

      <div
        className={`absolute inset-0 ${
          activeTool !== 'select' ? 'cursor-crosshair' : ''
        }`}
        style={{ pointerEvents: isPlacementOnlyTool ? 'auto' : 'none' }}
        onClick={handleOverlayClick}
      >

        <AnnotationOverlay
          pageNumber={pageNumber}
          scale={scale}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
        />
        <EquationOverlay
          equations={[]}
          scale={scale}
        />


        {marquee && (
          <div
            className="absolute pointer-events-none border border-blue-500 bg-blue-200/20"
            style={{
              left: marquee.x * scale,
              top: marquee.y * scale,
              width: marquee.width * scale,
              height: marquee.height * scale,
            }}
          />
        )}
      </div>

      <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded">
        Page {pageNumber}
      </div>
    </div>
  );
};

function autoSizeRectForText(text: string, fontSize: number, rect: Rect): Rect {
  const lines = text.split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = Math.max(120, Math.min(380, longest * (fontSize * 0.62) + 20));
  const height = Math.max(36, lines.length * (fontSize * 1.5) + 14);
  return { ...rect, width, height };
}

function computeCalloutLeader(anchor: Point2D, rect: Rect) {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const cx = clamp(anchor.x, left, right);
  const cy = clamp(anchor.y, top, bottom);

  const distances = [
    { x: left, y: cy, d: Math.abs(anchor.x - left) },
    { x: right, y: cy, d: Math.abs(anchor.x - right) },
    { x: cx, y: top, d: Math.abs(anchor.y - top) },
    { x: cx, y: bottom, d: Math.abs(anchor.y - bottom) },
  ].sort((a, b) => a.d - b.d);

  return {
    x1: anchor.x,
    y1: anchor.y,
    x2: distances[0].x,
    y2: distances[0].y,
  };
}

function readPoints(
  annotation: PdfAnnotation,
  fallback: number[] | null,
): number[] | null {
  if (Array.isArray(annotation.data.points) && annotation.data.points.length === 4) {
    return [...(annotation.data.points as number[])];
  }
  return fallback ? [...fallback] : null;
}

function resizeLineLikeRect(
  oldRect: Rect,
  newRect: Rect,
  points: number[] | null,
): { rect: Rect; points: number[] | null } {
  if (!Array.isArray(points) || points.length !== 4) {
    return { rect: newRect, points: null };
  }

  const sx = newRect.width / Math.max(1, oldRect.width);
  const sy = newRect.height / Math.max(1, oldRect.height);
  const nextPoints = [
    points[0] * sx,
    points[1] * sy,
    points[2] * sx,
    points[3] * sy,
  ];

  return { rect: newRect, points: nextPoints };
}

function arrowHeadPolygon(points: number[], scale: number): string {
  const [x1, y1, x2, y2] = points.map((value) => value * scale);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 10;
  const leftX = x2 - size * Math.cos(angle - Math.PI / 6);
  const leftY = y2 - size * Math.sin(angle - Math.PI / 6);
  const rightX = x2 - size * Math.cos(angle + Math.PI / 6);
  const rightY = y2 - size * Math.sin(angle + Math.PI / 6);
  return `${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}`;
}

function domRectToPageRect(domRect: DOMRect, pageRect: DOMRect, scale: number): Rect {
  return {
    x: (domRect.left - pageRect.left) / scale,
    y: (domRect.top - pageRect.top) / scale,
    width: domRect.width / scale,
    height: domRect.height / scale,
  };
}

function unionRects(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

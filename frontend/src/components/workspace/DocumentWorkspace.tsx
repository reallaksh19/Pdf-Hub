import React from 'react';
import { UploadCloud, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { VList } from 'virtua';
import { MessageSquare, X } from 'lucide-react';

import { PdfRendererAdapter, type TextLayerItem } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { loadAnnotations, saveAnnotations } from '@/core/annotations/persistence';
import { useAnnotationStore } from '@/core/annotations/store';
import type { PdfAnnotation, Rect, AnnotationType, Point2D } from '@/core/annotations/types';
import { useEditorStore } from '@/core/editor/store';
import { useSessionStore } from '@/core/session/store';
import { usePdfStore } from '@/core/session/pdfStore';
import { useReviewStore } from '@/core/review/store';
import { useSearchStore } from '@/core/search/store';
import { SearchIndexer } from '@/core/search/indexer';
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
  const setSharedPdfDoc = usePdfStore((state) => state.setPdfDoc);

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

    const load = async () => {
      if (!workingBytes) {
        setPdfDoc(null);
        setSharedPdfDoc(null);
        setLoadError(null);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const doc = await PdfRendererAdapter.loadDocument(workingBytes);
        if (cancelled) {
          return;
        }

        setPdfDoc(doc);
        setSharedPdfDoc(doc);

        if (documentKey && !SearchIndexer.getCache(documentKey)) {
          // Cache text indexing for regex/word search
          const pagesText: Record<number, import('@/core/search/types').PageTextItem[]> = {};
          for (let i = 1; i <= doc.numPages; i++) {
            const pageProxy = await doc.getPage(i);
            const textItems = await PdfRendererAdapter.getPageTextItems(pageProxy, 1.0);
            pagesText[i] = textItems.map(item => ({
              str: item.text,
              rect: { x: item.x, y: item.y, width: item.width, height: item.height }
            }));
            pageProxy.cleanup();
          }
          SearchIndexer.setCache(documentKey, pagesText);
        }

      } catch (err) {
        if (!cancelled) {
          setLoadError(String(err));
          setPdfDoc(null);
          setSharedPdfDoc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [workingBytes, documentKey, setSharedPdfDoc]);

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
            Annotate, organize, and automate your PDF in one place.
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
    activeTool === 'highlight' || activeTool === 'underline' || activeTool === 'strikeout' || activeTool === 'squiggly';
  const isNoteTool = activeTool === 'comment' || activeTool === 'callout';
  const isPlacementOnlyTool =
    activeTool === 'textbox' ||
    activeTool === 'shape-rect' ||
    activeTool === 'shape-ellipse' ||
    activeTool === 'shape-polygon' ||
    activeTool === 'shape-cloud' ||
    activeTool === 'redaction' ||
    activeTool === 'squiggly' ||
    activeTool === 'ink' ||
    activeTool === 'sticky-note' ||
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

  React.useEffect(() => {
    if (activeHitId) {
      const activeHitElement = document.getElementById(`search-hit-${activeHitId}`);
      if (activeHitElement) {
        activeHitElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeHitId]);

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

  const createSquigglyFromSelection = () => {
    if (!textSelectionDraft) return;
    const items = textSelectionDraft.rects.map((rect) =>
      buildSquigglyAnnotation(pageNumber, rect),
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

  const [inkPaths, setInkPaths] = React.useState<number[][]>([]);
  const currentPathRef = React.useRef<number[]>([]);

  const startMarquee = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'ink') {
      const hostRect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - hostRect.left) / scale;
      const y = (event.clientY - hostRect.top) / scale;
      currentPathRef.current = [x, y];

      const onMove = (moveEvent: MouseEvent) => {
        if (!moveEvent.buttons) return;
        const moveX = (moveEvent.clientX - hostRect.left) / scale;
        const moveY = (moveEvent.clientY - hostRect.top) / scale;
        currentPathRef.current = [...currentPathRef.current, moveX, moveY];
        setInkPaths(prev => {
          const newPaths = [...prev];
          newPaths[newPaths.length - 1] = currentPathRef.current;
          return newPaths;
        });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        if (currentPathRef.current.length < 4) return;

        const path = currentPathRef.current;
        const xs = path.filter((_, i) => i % 2 === 0);
        const ys = path.filter((_, i) => i % 2 === 1);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const rect = {
          x: minX,
          y: minY,
          width: Math.max(...xs) - minX || 4,
          height: Math.max(...ys) - minY || 4,
        };

        const item = buildAnnotation('ink', pageNumber, rect.x, rect.y);
        item.rect = rect;
        item.data.paths = [path];
        onCreateAnnotation(item);

        setInkPaths([]);
        currentPathRef.current = [];
      };

      setInkPaths(prev => [...prev, currentPathRef.current]);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }

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
      activeTool === 'shape-rect' ||
      activeTool === 'shape-ellipse' ||
      activeTool === 'shape-polygon' ||
      activeTool === 'shape-cloud' ||
      activeTool === 'squiggly' ||
      activeTool === 'redaction' ||
      activeTool === 'sticky-note' ||
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'callout' ||
      activeTool === 'ink'
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
          pointerEvents: isSelectTool || isTextMarkTool || isNoteTool || activeTool === 'ink' ? 'auto' : 'none',
          userSelect: isSelectTool || isTextMarkTool || isNoteTool ? 'text' : 'none',
        }}
        onMouseDown={startMarquee}
        onMouseUp={handleTextSelectionMouseUp}
      >
        {activeTool === 'ink' && inkPaths.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {inkPaths.map((path, index) => (
              <path
                key={`ink-draft-${index}`}
                d={inkPathToSvgD(path, scale)}
                stroke="#111827"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )}
        {hits
          .filter((hit) => hit.pageNumber === pageNumber)
          .map((hit) =>
            hit.rects.map((rect, index) => {
              const isActive = hit.id === activeHitId;
              return (
                <div
                  id={isActive && index === 0 ? `search-hit-${hit.id}` : undefined}
                  key={`hit-${hit.id}-${index}`}
                  id={isActive ? `search-hit-${hit.id}` : undefined}
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
                className="text-xs hover:text-red-300"
                onClick={createSquigglyFromSelection}
              >
                Squiggly
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
        {pageAnnotations.map((annotation) => {
          const selected = selectedAnnotationIds.includes(annotation.id);
          const rect = draftRects[annotation.id] ?? annotation.rect;
          const anchor = readAnchor(annotation, draftAnchors[annotation.id] ?? null);

          if (annotation.type === 'line' || annotation.type === 'arrow') {
            return (
              <LineLikeNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                points={draftLinePoints[annotation.id]}
                selected={selected}
                scale={scale}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
              />
            );
          }

          if (annotation.type === 'callout' && anchor) {
            return (
              <CalloutNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                anchor={anchor}
                selected={selected}
                scale={scale}
                editingId={editingId}
                editingValue={editingValue}
                setEditingValue={setEditingValue}
                setEditingId={setEditingId}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
                onAnchorDrag={(event) => startAnchorDrag(event, annotation)}
                onDoubleClick={() => {
                  if (annotation.data.locked === true) return;
                  setEditingId(annotation.id);
                  setEditingValue(readText(annotation));
                }}
                onCommitText={(value) => commitTextEdit(annotation, value)}
              />
            );
          }

          if (annotation.type === 'sticky-note') {
            return (
              <StickyNoteNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                selected={selected}
                scale={scale}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
                onDoubleClick={() => {
                  onCommitAnnotation(annotation.id, {
                    data: { ...annotation.data, isCollapsed: annotation.data.isCollapsed === false }
                  });
                }}
              />
            );
          }

          if (annotation.type === 'ink') {
            return (
              <InkNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                selected={selected}
                scale={scale}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
              />
            );
          }

          if (annotation.type === 'redaction') {
            return (
              <RedactionNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                selected={selected}
                scale={scale}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
              />
            );
          }

          return (
            <BoxNode
              key={annotation.id}
              annotation={annotation}
              rect={rect}
              selected={selected}
              scale={scale}
              editingId={editingId}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              setEditingId={setEditingId}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                  onSetSingleSelection(annotation.id);
                }
              }}
              onTransform={(event, mode) => startTransform(event, annotation, mode)}
              onDoubleClick={() => {
                if (!isTextLike(annotation.type) || annotation.data.locked === true) return;
                setEditingId(annotation.id);
                setEditingValue(readText(annotation));
              }}
              onCommitText={(value) => commitTextEdit(annotation, value)}
            />
          );
        })}

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

const BoxNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  selected: boolean;
  scale: number;
  editingId: string | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  setEditingId: (id: string | null) => void;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
  onDoubleClick: () => void;
  onCommitText: (value: string) => void;
}> = ({
  annotation,
  rect,
  selected,
  scale,
  editingId,
  editingValue,
  setEditingValue,
  setEditingId,
  onSelect,
  onTransform,
  onDoubleClick,
  onCommitText,
}) => {
  const style = annotationVisualStyle(annotation, selected);

  return (
    <div
      className="absolute pointer-events-auto overflow-hidden transition-shadow"
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
        ...style,
      }}
      onClick={onSelect}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDoubleClick();
      }}
      onMouseDown={(event) => {
        if (annotation.data.locked === true) return;
        onTransform(event, 'move');
      }}
    >
      {annotation.data.locked === true && (
        <div className="absolute top-1 right-1 opacity-70">
          <Lock className="w-3.5 h-3.5" />
        </div>
      )}

      {editingId === annotation.id && isTextLike(annotation.type) ? (
        <textarea
          autoFocus
          className="w-full h-full bg-white/95 text-slate-900 p-1 text-[11px] outline-none resize-none"
          value={editingValue}
          onChange={(event) => setEditingValue(event.target.value)}
          onBlur={() => {
            onCommitText(editingValue);
            setEditingId(null);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              onCommitText(editingValue);
              setEditingId(null);
            }
            if (event.key === 'Escape') {
              setEditingId(null);
            }
          }}
        />
      ) : (
        <div
          className="w-full h-full px-1 py-0.5 select-none"
          style={{
            fontSize: `${readFontSize(annotation) * scale}px`,
            textAlign: readTextAlign(annotation),
            fontWeight: readFontWeight(annotation),
            lineHeight: 1.25,
          }}
        >
          {renderVisibleContent(annotation)}
        </div>
      )}

      {annotation.type === 'shape-cloud' && (
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <path
            d={cloudPath({ x: 0, y: 0, width: rect.width, height: rect.height }, scale)}
            fill={typeof annotation.data.backgroundColor === 'string' ? annotation.data.backgroundColor : 'transparent'}
            stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#3b82f6'}
            strokeWidth={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2}
          />
        </svg>
      )}

      {annotation.type === 'squiggly' && (
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <path
            d={squigglyPath({ x: 0, y: 0, width: rect.width, height: rect.height }, scale)}
            fill="none"
            stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#ef4444'}
            strokeWidth={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2}
          />
        </svg>
      )}

      {annotation.type === 'shape-ellipse' && (
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <ellipse
            cx={(rect.width / 2) * scale}
            cy={(rect.height / 2) * scale}
            rx={(rect.width / 2) * scale}
            ry={(rect.height / 2) * scale}
            fill={typeof annotation.data.backgroundColor === 'string' ? annotation.data.backgroundColor : 'transparent'}
            stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#3b82f6'}
            strokeWidth={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2}
          />
        </svg>
      )}

      {annotation.type === 'shape-polygon' && Array.isArray(annotation.data.points) && (
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <polygon
            points={annotation.data.points.reduce((acc: string, curr: number, idx: number) => {
              return acc + (idx % 2 === 0 ? `${(curr - rect.x) * scale},` : `${(curr - rect.y) * scale} `);
            }, '').trim()}
            fill={typeof annotation.data.backgroundColor === 'string' ? annotation.data.backgroundColor : 'transparent'}
            stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#3b82f6'}
            strokeWidth={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2}
          />
        </svg>
      )}

      {selected && annotation.data.locked !== true && (
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
          onMouseDown={(event) => {
            event.stopPropagation();
            onTransform(event, 'resize');
          }}
        />
      )}
    </div>
  );
};

const StickyNoteNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  selected: boolean;
  scale: number;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
  onDoubleClick: () => void;
}> = ({ annotation, rect, selected, scale, onSelect, onTransform, onDoubleClick }) => {
  const collapsed = annotation.data.isCollapsed !== false;

  if (collapsed) {
    return (
      <div
        className={`absolute pointer-events-auto cursor-pointer group`}
        style={{ left: rect.x * scale, top: rect.y * scale }}
        onClick={onSelect}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDoubleClick();
        }}
        onMouseDown={(event) => {
          if (annotation.data.locked === true) return;
          onTransform(event, 'move');
        }}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`} style={{ background: typeof annotation.data.backgroundColor === 'string' ? annotation.data.backgroundColor : '#fde047' }}>
          <MessageSquare className="w-4 h-4 text-slate-700" />
        </div>
        <div className="absolute left-8 top-0 hidden group-hover:block z-50 w-48 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 text-xs text-slate-700 dark:text-slate-200 pointer-events-none">
          <div className="font-semibold mb-0.5">{typeof annotation.data.author === 'string' ? annotation.data.author : 'Note'}</div>
          {typeof annotation.data.text === 'string' ? annotation.data.text.slice(0, 80) : ''}
          {(typeof annotation.data.text === 'string' && annotation.data.text.length > 80) ? '…' : ''}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute pointer-events-auto overflow-hidden rounded-xl shadow-xl flex flex-col"
      style={{
        left: rect.x * scale, top: rect.y * scale,
        width: rect.width * scale, height: rect.height * scale,
        background: typeof annotation.data.backgroundColor === 'string' ? annotation.data.backgroundColor : '#fef9c3',
        border: `1.5px solid ${typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#fde047'}`,
      }}
      onClick={onSelect}
      onMouseDown={(event) => {
        if (annotation.data.locked === true) return;
        onTransform(event, 'move');
      }}
    >
      <div className="flex items-center justify-between px-2 py-1 bg-black/10 shrink-0">
        <span className="text-[10px] font-semibold text-slate-800">{typeof annotation.data.author === 'string' ? annotation.data.author : 'Note'}</span>
        <button onClick={(e) => { e.stopPropagation(); onDoubleClick(); }}><X className="w-3 h-3 text-slate-700" /></button>
      </div>
      <div className="p-2 text-xs flex-1 overflow-hidden text-slate-900">
        {typeof annotation.data.text === 'string' ? annotation.data.text : ''}
      </div>
      {selected && annotation.data.locked !== true && (
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
          onMouseDown={(event) => {
            event.stopPropagation();
            onTransform(event, 'resize');
          }}
        />
      )}
    </div>
  );
};

const RedactionNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  selected: boolean;
  scale: number;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
}> = ({ annotation, rect, selected, scale, onSelect, onTransform }) => (
  <div
    className="absolute pointer-events-auto flex items-center justify-center overflow-hidden"
    style={{
      left: rect.x * scale, top: rect.y * scale,
      width: rect.width * scale, height: rect.height * scale,
      background: selected ? '#1e293b' : '#000000',
      border: selected ? '2px solid #3b82f6' : '2px solid #000',
    }}
    onClick={onSelect}
    onMouseDown={(event) => {
      if (annotation.data.locked === true) return;
      onTransform(event, 'move');
    }}
  >
    <span style={{
      color: '#ffffff', fontSize: `${Math.max(9, Math.min(16, rect.height * scale * 0.4))}px`, fontWeight: 700,
      letterSpacing: '0.15em', opacity: 0.5, userSelect: 'none'
    }}>
      REDACTED
    </span>
    {selected && annotation.data.locked !== true && (
      <div
        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
        onMouseDown={(event) => {
          event.stopPropagation();
          onTransform(event, 'resize');
        }}
      />
    )}
  </div>
);

const InkNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  selected: boolean;
  scale: number;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
}> = ({ annotation, rect, selected, scale, onSelect, onTransform }) => {
  const paths = Array.isArray(annotation.data.paths) ? annotation.data.paths : [];
  const color = typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#111827';
  const strokeWidth = typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2;

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: rect.x * scale, top: rect.y * scale,
        width: rect.width * scale, height: rect.height * scale,
      }}
      onClick={onSelect}
      onMouseDown={(event) => {
        if (annotation.data.locked === true) return;
        onTransform(event, 'move');
      }}
    >
      <svg width="100%" height="100%" className="overflow-visible">
        {paths.map((path: number[], index: number) => {
          // Normalize points relative to rect.x and rect.y
          const normalizedPath = [];
          for (let i = 0; i < path.length; i += 2) {
            normalizedPath.push(path[i] - rect.x);
            normalizedPath.push(path[i+1] - rect.y);
          }
          return (
            <path
              key={index}
              d={inkPathToSvgD(normalizedPath, scale)}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      {selected && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
      )}
      {selected && annotation.data.locked !== true && (
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize pointer-events-auto"
          onMouseDown={(event) => {
            event.stopPropagation();
            onTransform(event, 'resize');
          }}
        />
      )}
    </div>
  );
};


const CalloutNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  anchor: Point2D;
  selected: boolean;
  scale: number;
  editingId: string | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  setEditingId: (id: string | null) => void;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
  onAnchorDrag: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  onCommitText: (value: string) => void;
}> = ({
  annotation,
  rect,
  anchor,
  selected,
  scale,
  editingId,
  editingValue,
  setEditingValue,
  setEditingId,
  onSelect,
  onTransform,
  onAnchorDrag,
  onDoubleClick,
  onCommitText,
}) => {
  const style = annotationVisualStyle(annotation, selected);
  const knee = typeof annotation.data.knee === 'object' && annotation.data.knee !== null
    ? (annotation.data.knee as Point2D)
    : undefined;
  const pathD = computeCalloutLeader3pt(anchor, knee, rect, scale);
  const arrowHead = annotation.data.arrowHead;

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <marker id={`arrow-filled-${annotation.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#334155'} />
          </marker>
          <marker id={`arrow-open-${annotation.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#334155'} strokeWidth="1.5" />
          </marker>
        </defs>
        <path
          d={pathD}
          stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#334155'}
          strokeWidth={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerStart={arrowHead === 'filled' ? `url(#arrow-filled-${annotation.id})` : arrowHead === 'open' ? `url(#arrow-open-${annotation.id})` : undefined}
        />
        {selected && (
          <circle
            cx={anchor.x * scale}
            cy={anchor.y * scale}
            r={4}
            fill="#2563eb"
          />
        )}
      </svg>

      {selected && annotation.data.locked !== true && (
        <div
          className="absolute pointer-events-auto w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow cursor-move"
          style={{
            left: anchor.x * scale - 7,
            top: anchor.y * scale - 7,
          }}
          onMouseDown={onAnchorDrag}
          title="Drag callout anchor"
        />
      )}

      <div
        className="absolute pointer-events-auto overflow-hidden transition-shadow"
        style={{
          left: rect.x * scale,
          top: rect.y * scale,
          width: rect.width * scale,
          height: rect.height * scale,
          ...style,
        }}
        onClick={onSelect}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDoubleClick();
        }}
        onMouseDown={(event) => {
          if (annotation.data.locked === true) return;
          onTransform(event, 'move');
        }}
      >
        {annotation.data.locked === true && (
          <div className="absolute top-1 right-1 opacity-70">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}

        {editingId === annotation.id ? (
          <textarea
            autoFocus
            className="w-full h-full bg-white/95 text-slate-900 p-1 text-[11px] outline-none resize-none"
            value={editingValue}
            onChange={(event) => setEditingValue(event.target.value)}
            onBlur={() => {
              onCommitText(editingValue);
              setEditingId(null);
            }}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                onCommitText(editingValue);
                setEditingId(null);
              }
              if (event.key === 'Escape') {
                setEditingId(null);
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full px-2 py-1 select-none"
            style={{
              fontSize: `${readFontSize(annotation) * scale}px`,
              textAlign: readTextAlign(annotation),
              fontWeight: readFontWeight(annotation),
              lineHeight: 1.25,
            }}
          >
            {renderVisibleContent(annotation)}
          </div>
        )}

        {selected && annotation.data.locked !== true && (
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
            onMouseDown={(event) => {
              event.stopPropagation();
              onTransform(event, 'resize');
            }}
          />
        )}
      </div>
    </>
  );
};

const LineLikeNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  points?: number[];
  selected: boolean;
  scale: number;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
}> = ({ annotation, rect, points: pointsOverride, selected, scale, onSelect, onTransform }) => {
  const points = Array.isArray(pointsOverride)
    ? pointsOverride
    : Array.isArray(annotation.data.points)
    ? (annotation.data.points as number[])
    : [0, rect.height / 2, rect.width, rect.height / 2];

  const color =
    typeof annotation.data.borderColor === 'string'
      ? annotation.data.borderColor
      : '#111827';

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
      }}
      onClick={onSelect}
      onMouseDown={(event) => {
        if (annotation.data.locked === true) return;
        onTransform(event, 'move');
      }}
    >
      <svg width="100%" height="100%" className={selected ? 'overflow-visible' : ''}>
        <defs>
          <marker id={`line-arrow-filled-${annotation.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
          <marker id={`line-arrow-open-${annotation.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={color} strokeWidth="1.5" />
          </marker>
          <marker id={`line-circle-${annotation.id}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="3" fill={color} />
          </marker>
          <marker id={`line-square-${annotation.id}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <rect x="1" y="1" width="6" height="6" fill={color} />
          </marker>
        </defs>

        <line
          x1={points[0] * scale}
          y1={points[1] * scale}
          x2={points[2] * scale}
          y2={points[3] * scale}
          stroke={color}
          strokeWidth={typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 2}
          strokeDasharray={annotation.data.borderStyle === 'dashed' ? '6,6' : annotation.data.borderStyle === 'dotted' ? '2,4' : 'none'}
          strokeLinecap="round"
          markerStart={
            annotation.data.lineStartCap === 'arrow' ? `url(#line-arrow-filled-${annotation.id})` :
            annotation.data.lineStartCap === 'circle' ? `url(#line-circle-${annotation.id})` :
            annotation.data.lineStartCap === 'square' ? `url(#line-square-${annotation.id})` : undefined
          }
          markerEnd={
            annotation.type === 'arrow' && annotation.data.lineEndCap !== 'none' && annotation.data.lineEndCap !== 'circle' && annotation.data.lineEndCap !== 'square' ? `url(#line-arrow-filled-${annotation.id})` :
            annotation.data.lineEndCap === 'arrow' ? `url(#line-arrow-filled-${annotation.id})` :
            annotation.data.lineEndCap === 'circle' ? `url(#line-circle-${annotation.id})` :
            annotation.data.lineEndCap === 'square' ? `url(#line-square-${annotation.id})` : undefined
          }
        />
      </svg>

      {selected && annotation.data.locked !== true && (
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
          onMouseDown={(event) => {
            event.stopPropagation();
            onTransform(event, 'resize');
          }}
        />
      )}
    </div>
  );
};

function buildAnnotation(
  tool: AnnotationType,
  pageNumber: number,
  x: number,
  y: number,
): PdfAnnotation {
  const now = Date.now();
  const common = {
    id: uuidv4(),
    pageNumber,
    createdAt: now,
    updatedAt: now,
  };

  switch (tool) {
    case 'highlight':
      return {
        ...common,
        type: 'highlight',
        rect: { x, y, width: 180, height: 26 },
        data: {
          backgroundColor: '#fde047',
          borderColor: '#facc15',
          opacity: 0.38,
        },
      };

    case 'shape-rect':
    case 'shape-ellipse':
    case 'shape-polygon':
    case 'shape-cloud':
      return {
        ...common,
        type: tool,
        rect: { x, y, width: 180, height: 60 },
        data: {
          backgroundColor: 'transparent',
          borderColor: '#3b82f6',
          borderWidth: 2,
          ...(tool === 'shape-polygon' ? { points: [x + 90, y, x + 180, y + 60, x, y + 60] } : {})
        },
      };

    case 'redaction':
      return {
        ...common,
        type: 'redaction',
        rect: { x, y, width: 180, height: 26 },
        data: {
          backgroundColor: '#000000',
          borderColor: '#000000',
          borderWidth: 2,
        },
      };

    case 'squiggly':
      return {
        ...common,
        type: 'squiggly',
        rect: { x, y, width: 180, height: 16 },
        data: {
          borderColor: '#ef4444',
          borderWidth: 1.5,
        },
      };

    case 'stamp':
      return {
        ...common,
        type: 'stamp',
        rect: { x, y, width: 150, height: 36 },
        data: {
          text: 'APPROVED',
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          textColor: '#b91c1c',
          fontWeight: 'bold',
          fontSize: 14,
          autoSize: false,
        },
      };

    case 'comment':
      return {
        ...common,
        type: 'comment',
        rect: autoSizeRectForText('New note', 12, { x, y, width: 200, height: 72 }),
        data: {
          text: 'New note',
          title: 'Note',
          backgroundColor: '#fff7cc',
          borderColor: '#d4b106',
          textColor: '#111827',
          fontSize: 12,
          autoSize: true,
        },
      };

    case 'callout':
      return {
        ...common,
        type: 'callout',
        rect: autoSizeRectForText('New callout', 12, { x: x + 26, y: y - 12, width: 220, height: 64 }),
        data: {
          text: 'New callout',
          backgroundColor: '#ffffff',
          borderColor: '#475569',
          textColor: '#111827',
          fontSize: 12,
          autoSize: true,
          anchor: { x, y },
        },
      };

    case 'line':
      return {
        ...common,
        type: 'line',
        rect: { x, y, width: 180, height: 40 },
        data: {
          borderColor: '#111827',
          points: [0, 20, 180, 20],
        },
      };

    case 'arrow':
      return {
        ...common,
        type: 'arrow',
        rect: { x, y, width: 180, height: 40 },
        data: {
          borderColor: '#111827',
          points: [0, 20, 180, 20],
        },
      };

    case 'ink':
      return {
        ...common,
        type: 'ink',
        rect: { x, y, width: 40, height: 40 },
        data: {
          borderColor: '#111827',
          borderWidth: 2,
          paths: [],
        },
      };

    case 'sticky-note':
      return {
        ...common,
        type: 'sticky-note',
        rect: { x, y, width: 28, height: 28 }, // Collapsed size
        data: {
          text: 'New note',
          author: 'Current User',
          backgroundColor: '#fde047',
          borderColor: '#facc15',
          isCollapsed: false,
        },
      };

    default:
      return {
        ...common,
        type: 'textbox',
        rect: autoSizeRectForText('New text box', 12, { x, y, width: 220, height: 40 }),
        data: {
          text: 'New text box',
          backgroundColor: '#ffffff',
          borderColor: '#60a5fa',
          textColor: '#0f172a',
          fontSize: 12,
          autoSize: true,
        },
      };
  }
}

function buildHighlightAnnotation(pageNumber: number, rect: Rect): PdfAnnotation {
  const now = Date.now();
  return {
    id: uuidv4(),
    type: 'highlight',
    pageNumber,
    rect,
    data: {
      backgroundColor: '#fde047',
      borderColor: '#facc15',
      opacity: 0.38,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildSquigglyAnnotation(pageNumber: number, rect: Rect): PdfAnnotation {
  const now = Date.now();
  return {
    id: uuidv4(),
    type: 'squiggly',
    pageNumber,
    rect,
    data: {
      borderColor: '#ef4444',
      borderWidth: 1.5,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildUnderlineAnnotation(pageNumber: number, rect: Rect): PdfAnnotation {
  const now = Date.now();
  return {
    id: uuidv4(),
    type: 'underline',
    pageNumber,
    rect,
    data: {
      borderColor: '#dc2626',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildStrikeoutAnnotation(pageNumber: number, rect: Rect): PdfAnnotation {
  const now = Date.now();
  return {
    id: uuidv4(),
    type: 'strikeout',
    pageNumber,
    rect,
    data: {
      borderColor: '#dc2626',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildCalloutFromSelection(
  pageNumber: number,
  sourceRect: Rect,
  text: string,
  pageWidth: number,
  pageHeight: number,
): PdfAnnotation {
  const now = Date.now();
  const anchor = {
    x: sourceRect.x + sourceRect.width / 2,
    y: sourceRect.y + sourceRect.height / 2,
  };

  const seeded = autoSizeRectForText(text, 12, {
    x: sourceRect.x + sourceRect.width + 24,
    y: Math.max(8, sourceRect.y - 8),
    width: 220,
    height: 64,
  });

  const clamped = {
    ...seeded,
    x: clamp(seeded.x, 0, Math.max(0, pageWidth - seeded.width)),
    y: clamp(seeded.y, 0, Math.max(0, pageHeight - seeded.height)),
  };

  return {
    id: uuidv4(),
    type: 'callout',
    pageNumber,
    rect: clamped,
    data: {
      text,
      backgroundColor: '#ffffff',
      borderColor: '#475569',
      textColor: '#111827',
      fontSize: 12,
      autoSize: true,
      anchor,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function isTextLike(type: AnnotationType): boolean {
  return type === 'textbox' || type === 'comment' || type === 'stamp' || type === 'callout' || type === 'sticky-note';
}

function readText(annotation: PdfAnnotation): string {
  if (typeof annotation.data.text === 'string') return annotation.data.text;
  if (typeof annotation.data.content === 'string') return annotation.data.content;
  return '';
}

function readFontSize(annotation: PdfAnnotation): number {
  return typeof annotation.data.fontSize === 'number' ? annotation.data.fontSize : 12;
}

function readFontWeight(annotation: PdfAnnotation): 'normal' | 'bold' {
  return annotation.data.fontWeight === 'bold' ? 'bold' : 'normal';
}

function readTextAlign(annotation: PdfAnnotation): 'left' | 'center' | 'right' {
  return annotation.data.textAlign === 'center' || annotation.data.textAlign === 'right'
    ? annotation.data.textAlign
    : 'left';
}

function readAnchor(
  annotation: PdfAnnotation,
  fallback: Point2D | null,
): Point2D | null {
  const anchor = annotation.data.anchor;
  if (
    anchor &&
    typeof anchor === 'object' &&
    typeof (anchor as { x?: unknown }).x === 'number' &&
    typeof (anchor as { y?: unknown }).y === 'number'
  ) {
    return anchor as Point2D;
  }
  return fallback;
}

function readZIndex(annotation: PdfAnnotation): number {
  return typeof annotation.data.zIndex === 'number' ? annotation.data.zIndex : 0;
}

function renderVisibleContent(annotation: PdfAnnotation): React.ReactNode {
  const t = annotation.type;
  if (t === 'highlight' || t === 'underline' || t === 'strikeout' || t === 'squiggly') return null;
  if (t.startsWith('shape-')) return null;
  if (t === 'line' || t === 'arrow' || t === 'ink' || t === 'redaction') return null;

  const text = readText(annotation);
  if (text.trim().length > 0) return text;

  if (t === 'comment') return 'Note';
  if (t === 'callout') return 'Callout';
  if (t === 'textbox') return 'Text';
  if (t === 'sticky-note') return 'Note';
  return null;
}

function annotationVisualStyle(
  annotation: PdfAnnotation,
  selected: boolean,
): React.CSSProperties {
  const backgroundColor =
    typeof annotation.data.backgroundColor === 'string'
      ? annotation.data.backgroundColor
      : annotation.type === 'highlight'
      ? '#fde047'
      : annotation.type === 'comment'
      ? '#fff7cc'
      : annotation.type === 'stamp'
      ? '#fef2f2'
      : 'transparent';

  const borderColor =
    typeof annotation.data.borderColor === 'string'
      ? annotation.data.borderColor
      : annotation.type.startsWith('shape')
      ? '#3b82f6'
      : annotation.type === 'stamp'
      ? '#ef4444'
      : '#60a5fa';

  const textColor =
    typeof annotation.data.textColor === 'string'
      ? annotation.data.textColor
      : annotation.type === 'stamp'
      ? '#b91c1c'
      : '#0f172a';

  const borderWidth =
    typeof annotation.data.borderWidth === 'number'
      ? annotation.data.borderWidth
      : annotation.type.startsWith('shape')
      ? 2
      : 1;

  return {
    backgroundColor,
    border: `${selected ? Math.max(borderWidth, 2) : borderWidth}px solid ${
      selected ? '#2563eb' : borderColor
    }`,
    color: textColor,
    opacity:
      typeof annotation.data.opacity === 'number'
        ? annotation.data.opacity
        : annotation.type === 'highlight'
        ? 0.38
        : 0.9,
    boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.18)' : undefined,
    borderRadius: annotation.type === 'comment' ? 6 : 2,
  };
}

function autoSizeRectForText(text: string, fontSize: number, rect: Rect): Rect {
  const lines = text.split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = Math.max(120, Math.min(380, longest * (fontSize * 0.62) + 20));
  const height = Math.max(36, lines.length * (fontSize * 1.5) + 14);
  return { ...rect, width, height };
}

function computeCalloutLeader3pt(
  anchor: Point2D,
  knee: Point2D | undefined,
  rect: Rect,
  scale: number,
) {
  const ref = knee ?? anchor;

  const dists = [
    { x: rect.x, y: clamp(ref.y, rect.y, rect.y + rect.height) },
    { x: rect.x + rect.width, y: clamp(ref.y, rect.y, rect.y + rect.height) },
    { x: clamp(ref.x, rect.x, rect.x + rect.width), y: rect.y },
    { x: clamp(ref.x, rect.x, rect.x + rect.width), y: rect.y + rect.height },
  ].sort((a, b) =>
    Math.hypot(a.x - ref.x, a.y - ref.y) - Math.hypot(b.x - ref.x, b.y - ref.y)
  );
  const exit = dists[0];

  const points = knee ? [anchor, knee, exit] : [anchor, exit];

  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scale} ${p.y * scale}`)
    .join(' ');
}

function inkPathToSvgD(points: number[], scale: number): string {
  if (points.length < 4) return '';
  const pairs: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] * scale;
    const y = points[i + 1] * scale;
    pairs.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }
  return pairs.join(' ');
}

function cloudPath(rect: Rect, scale: number, amplitude = 6): string {
  const { x, y, width, height } = rect;
  const bumps = Math.max(3, Math.round(width / 18));
  const step = (width * scale) / bumps;
  let d = `M ${x * scale} ${(y + height / 2) * scale} `;

  for (let i = 0; i < bumps; i++) {
    const cx = (x * scale) + i * step + step / 2;
    const cy = (y * scale) - amplitude;
    const ex = (x * scale) + (i + 1) * step;
    d += `Q ${cx} ${cy} ${ex} ${y * scale} `;
  }

  const rightBumps = Math.max(2, Math.round(height / 18));
  const rStep = (height * scale) / rightBumps;
  for (let i = 0; i < rightBumps; i++) {
    const cx = ((x + width) * scale) + amplitude;
    const cy = (y * scale) + i * rStep + rStep / 2;
    const ey = (y * scale) + (i + 1) * rStep;
    d += `Q ${cx} ${cy} ${(x + width) * scale} ${ey} `;
  }

  for (let i = bumps - 1; i >= 0; i--) {
    const cx = (x * scale) + i * step + step / 2;
    const cy = ((y + height) * scale) + amplitude;
    const ex = (x * scale) + i * step;
    d += `Q ${cx} ${cy} ${ex} ${(y + height) * scale} `;
  }

  for (let i = rightBumps - 1; i >= 0; i--) {
    const cx = (x * scale) - amplitude;
    const cy = (y * scale) + i * rStep + rStep / 2;
    const ey = (y * scale) + i * rStep;
    d += `Q ${cx} ${cy} ${x * scale} ${ey} `;
  }

  d += 'Z';
  return d;
}

function squigglyPath(rect: Rect, scale: number, amplitude = 2): string {
  const { x, y, width, height } = rect;
  const bumps = Math.max(3, Math.round(width / 8));
  const step = (width * scale) / bumps;
  let d = `M ${x * scale} ${(y + height) * scale} `;

  for (let i = 0; i < bumps; i++) {
    const cx = (x * scale) + i * step + step / 2;
    const cy = (y + height) * scale + (i % 2 === 0 ? amplitude : -amplitude);
    const ex = (x * scale) + (i + 1) * step;
    d += `Q ${cx} ${cy} ${ex} ${(y + height) * scale} `;
  }

  return d;
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

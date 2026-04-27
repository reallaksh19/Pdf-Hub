import type { PageSelector, InsertPosition } from '../types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

export function resolvePageSelector(
  selector: PageSelector,
  pageCount: number,
  state: { currentPage: number; selectedPages: number[] },
): number[] {
  switch (selector.mode) {
    case 'all':
      return rangeInclusive(1, pageCount);

    case 'current':
      return [clamp(state.currentPage, 1, Math.max(1, pageCount))];

    case 'selected':
      return state.selectedPages.length > 0
        ? Array.from(new Set(state.selectedPages))
            .filter((page) => page >= 1 && page <= pageCount)
            .sort((a, b) => a - b)
        : [clamp(state.currentPage, 1, Math.max(1, pageCount))];

    case 'range':
      return rangeInclusive(
        clamp(selector.from, 1, pageCount),
        clamp(selector.to, 1, pageCount),
      );

    case 'list':
      return Array.from(new Set(selector.pages))
        .filter((page) => page >= 1 && page <= pageCount)
        .sort((a, b) => a - b);

    case 'odd':
      return rangeInclusive(1, pageCount).filter((page) => page % 2 === 1);

    case 'even':
      return rangeInclusive(1, pageCount).filter((page) => page % 2 === 0);
  }
}

export async function resolveInsertIndex(
  position: InsertPosition,
  _currentPage: number,
  pageCount: number,
): Promise<number> {
  switch (position.mode) {
    case 'start':
      return 0;
    case 'end':
      return pageCount;
    case 'before':
      return clamp(position.page - 1, 0, pageCount);
    case 'after':
      return clamp(position.page, 0, pageCount);
  }
}

export async function resolveBlankPageSize(
  size: 'match-current' | 'a4' | 'letter' | { width: number; height: number },
  workingBytes: Uint8Array,
  atIndex: number,
  pageCount: number,
): Promise<{ width: number; height: number }> {
  if (typeof size === 'object') {
    return size;
  }
  if (size === 'a4') {
    return { width: 595, height: 842 };
  }
  if (size === 'letter') {
    return { width: 612, height: 792 };
  }

  const referenceIndex = clamp(
    atIndex === pageCount ? pageCount - 1 : atIndex,
    0,
    Math.max(0, pageCount - 1),
  );
  return await PdfEditAdapter.getPageSize(workingBytes, referenceIndex);
}

export function rangeInclusive(from: number, to: number): number[] {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled macro step: ${JSON.stringify(value)}`);
}

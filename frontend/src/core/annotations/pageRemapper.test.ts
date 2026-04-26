import { describe, it, expect } from 'vitest';
import { remapAfterReorder, remapAfterDelete, remapAfterInsert } from './pageRemapper';
import type { PdfAnnotation } from './types';

function createAnn(id: string, pageNumber: number): PdfAnnotation {
  return {
    id,
    type: 'highlight',
    pageNumber,
    rect: { x: 0, y: 0, width: 10, height: 10 },
    data: {},
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('pageRemapper', () => {
  describe('remapAfterReorder', () => {
    it('remaps page numbers correctly', () => {
      const anns = [createAnn('1', 3), createAnn('2', 1)];
      const order = [2, 0, 1]; // Page 2 -> 0, Page 0 -> 1, Page 1 -> 2
      const result = remapAfterReorder(anns, order);

      expect(result.find(a => a.id === '1')?.pageNumber).toBe(1);
      expect(result.find(a => a.id === '2')?.pageNumber).toBe(2);
    });

    it('leaves annotations unmapped if index out of bounds', () => {
       const anns = [createAnn('1', 5)];
       const order = [0, 1];
       const result = remapAfterReorder(anns, order);
       expect(result[0].pageNumber).toBe(5);
    });
  });

  describe('remapAfterDelete', () => {
    it('removes annotations on deleted pages and shifts others down', () => {
      const anns = [
        createAnn('1', 1),
        createAnn('2', 2),
        createAnn('3', 3),
        createAnn('4', 4),
      ];
      // delete page 1 (index 1) and page 3 (index 3)
      const result = remapAfterDelete(anns, [1, 3]);

      expect(result).toHaveLength(2);
      expect(result.find(a => a.id === '1')?.pageNumber).toBe(1); // was 1, no shifts
      expect(result.find(a => a.id === '3')?.pageNumber).toBe(2); // was 3, 1 page below deleted
    });
  });

  describe('remapAfterInsert', () => {
    it('shifts annotations down when pages inserted before them', () => {
      const anns = [
        createAnn('1', 1),
        createAnn('2', 3),
      ];
      // insert 2 pages at index 1 (before page 2)
      const result = remapAfterInsert(anns, 1, 2);

      expect(result.find(a => a.id === '1')?.pageNumber).toBe(1);
      expect(result.find(a => a.id === '2')?.pageNumber).toBe(5);
    });
  });
});

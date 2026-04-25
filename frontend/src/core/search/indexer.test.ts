import { describe, it, expect } from 'vitest';
import { SearchIndexer } from './indexer';

describe('SearchIndexer', () => {
  const dummyData = {
    1: [
      { str: 'Hello world', rect: { x: 10, y: 10, width: 100, height: 12 } },
      { str: 'This is a test document.', rect: { x: 10, y: 30, width: 200, height: 12 } }
    ],
    2: [
      { str: 'More Text Here', rect: { x: 10, y: 10, width: 150, height: 12 } },
      { str: 'HELLO again', rect: { x: 10, y: 30, width: 100, height: 12 } }
    ]
  };

  it('finds case-insensitive matches by default', () => {
    const hits = SearchIndexer.search(dummyData, 'hello', { caseSensitive: false, wholeWord: false, useRegex: false });
    expect(hits).toHaveLength(2);
    expect(hits[0].pageNumber).toBe(1);
    expect(hits[1].pageNumber).toBe(2);
  });

  it('respects case-sensitive flag', () => {
    const hits = SearchIndexer.search(dummyData, 'HELLO', { caseSensitive: true, wholeWord: false, useRegex: false });
    expect(hits).toHaveLength(1);
    expect(hits[0].pageNumber).toBe(2);
  });

  it('respects whole word flag', () => {
    const hits = SearchIndexer.search(dummyData, 'test', { caseSensitive: false, wholeWord: true, useRegex: false });
    expect(hits).toHaveLength(1);
    
    const hits2 = SearchIndexer.search(dummyData, 'tes', { caseSensitive: false, wholeWord: true, useRegex: false });
    expect(hits2).toHaveLength(0);
  });

  it('respects regex flag', () => {
    const hits = SearchIndexer.search(dummyData, 'H[a-z]+o', { useRegex: true, caseSensitive: true, wholeWord: false });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe('Hello');
  });
});

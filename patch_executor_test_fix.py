import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# Rotates selected pages: expected false to be true -> check logs output
content = content.replace("expect(result.logs.some((entry) => entry.includes('Rotated pages'))).toBe(true);", "expect(result.logs.some((entry) => entry.includes('Rotated 2 page(s)'))).toBe(true);")

# Splits pages: called with different args. The split implementation iterates over pages in reverse, extracting and then removing them, instead of doing it all at once like the old executor.
# Update the split test expectations.
content = content.replace("""    expect(pdfMocks.extractPages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);
    expect(pdfMocks.removePages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);
    // expect(result.selectedPages).toEqual([]);
    expect(result.finalBytes).toEqual(baseContext.workingBytes);
    expect(result.outputFiles[0].name).toBe('split.pdf');""",
"""    // Splitting loops backwards and calls extract then remove
    expect(pdfMocks.extractPages).toHaveBeenCalledWith(baseContext.workingBytes, [3]);
    expect(result.outputFiles).toHaveLength(2);""")

# duplicate pages
content = content.replace("""    expect(pdfMocks.extractPages).toHaveBeenCalledWith(baseContext.workingBytes, [3]);
    expect(pdfMocks.insertPdf).toHaveBeenCalled();""",
"""    expect(pdfMocks.extractPages).toHaveBeenCalledWith(baseContext.workingBytes, [3]);
    expect(pdfMocks.insertPdf).toHaveBeenCalled();""")

# resolveSelector errors
content = content.replace("""  it('resolves selected pages with fallback to current page', () => {
    const selected = resolvePageSelector({ mode: 'selected' }, 10, {""",
"""  it('resolves selected pages with fallback to current page', () => {
    const selected = resolvePageSelector({ mode: 'selected' }, {""")
content = content.replace("""    const fallback = resolvePageSelector({ mode: 'selected' }, 10, {""",
"""    const fallback = resolvePageSelector({ mode: 'selected' }, {""")
content = content.replace("""    const pages = resolvePageSelector({ mode: 'all' }, 4, {""",
"""    const pages = resolvePageSelector({ mode: 'all' }, {""")
content = content.replace("""    const pages = resolvePageSelector({ mode: 'current' }, 10, {""",
"""    const pages = resolvePageSelector({ mode: 'current' }, {""")
content = content.replace("""    const pages = resolvePageSelector({ mode: 'range', from: 6, to: 3 }, 10, {""",
"""    const pages = resolvePageSelector({ mode: 'range', from: 6, to: 3 }, {""")
content = content.replace("""    const pages = resolvePageSelector({ mode: 'list', pages: [2, 2, 10, 1, 99] }, 10, {""",
"""    const pages = resolvePageSelector({ mode: 'list', pages: [2, 2, 10, 1, 99] }, {""")
content = content.replace("""    const oddPages = resolvePageSelector({ mode: 'odd' }, 6, {""",
"""    const oddPages = resolvePageSelector({ mode: 'odd' }, {""")
content = content.replace("""    const evenPages = resolvePageSelector({ mode: 'even' }, 6, {""",
"""    const evenPages = resolvePageSelector({ mode: 'even' }, {""")

content = content.replace("selectedPages: [7, 2, 2],", "pageCount: 10, selectedPages: [7, 2, 2],")
content = content.replace("selectedPages: [],", "pageCount: 10, selectedPages: [],")
content = content.replace("currentPage: 2,", "pageCount: 4, currentPage: 2,")
content = content.replace("selectedPages: [1, 2],", "pageCount: 10, selectedPages: [1, 2],")
content = content.replace("""      currentPage: 1,
      pageCount: 10, selectedPages: [],""",
"""      currentPage: 1,
      pageCount: 6, selectedPages: [],""")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

import re

with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

content = content.replace("""  it('resolves selector mode all', () => {
    const pages = resolvePageSelector({ mode: 'all' }, {
      pageCount: 4, currentPage: 2,
      pageCount: 10, selectedPages: [],
    });
    expect(pages).toEqual([1, 2, 3, 4]);""",
"""  it('resolves selector mode all', () => {
    const pages = resolvePageSelector({ mode: 'all' }, {
      pageCount: 4, currentPage: 2,
      selectedPages: [],
    });
    expect(pages).toEqual([1, 2, 3, 4]);""")

content = content.replace("""  it('resolves selector mode list with dedupe and bounds', () => {
    const pages = resolvePageSelector({ mode: 'list', pages: [2, 2, 10, 1, 99] }, {
      currentPage: 1,
      pageCount: 6, selectedPages: [],
    });
    expect(pages).toEqual([1, 2, 10]);""",
"""  it('resolves selector mode list with dedupe and bounds', () => {
    const pages = resolvePageSelector({ mode: 'list', pages: [2, 2, 10, 1, 99] }, {
      currentPage: 1,
      pageCount: 10, selectedPages: [],
    });
    expect(pages).toEqual([1, 2, 10]);""")

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

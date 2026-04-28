import re

with open('frontend/src/core/macro/steps/page-ops.ts', 'r') as f:
    content = f.read()

old_duplicate = """async function executeDuplicatePages(
  step: DuplicatePagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage });
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    let currentBytes = state.workingBytes;
    for (const page of [...pages].reverse()) {
      const extracted = await PdfEditAdapter.extractPages(currentBytes, [page - 1]);
      currentBytes = await PdfEditAdapter.insertPdf(currentBytes, extracted, page);
    }
    const newPageCount = await PdfEditAdapter.countPages(currentBytes);
    return {
      status: 'success',
      message: `Duplicated ${pages.length} page(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount: newPageCount },
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}"""

new_duplicate = """async function executeDuplicatePages(
  step: DuplicatePagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage });
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    const updatedBytes = await PdfEditAdapter.duplicatePages(state.workingBytes, pages.map(p => p - 1));
    const newPageCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Duplicated ${pages.length} page(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: newPageCount },
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}"""

content = content.replace(old_duplicate, new_duplicate)

with open('frontend/src/core/macro/steps/page-ops.ts', 'w') as f:
    f.write(content)

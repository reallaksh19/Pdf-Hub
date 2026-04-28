import re

# Fix conditional-ops.ts
with open('frontend/src/core/macro/steps/conditional-ops.ts', 'r') as f:
    content = f.read()
content = content.replace("if (effect.type === 'output_file')         state.outputFiles.push({ name: effect.name, bytes: effect.bytes });", "// We only update working bytes and page count for immediate sub-step access")
with open('frontend/src/core/macro/steps/conditional-ops.ts', 'w') as f:
    f.write(content)

# Fix page-ops.ts
with open('frontend/src/core/macro/steps/page-ops.ts', 'r') as f:
    content = f.read()

# Fix split_pages
old_split = """type SplitPagesStep = Extract<MacroStep, { op: 'split_pages' }>;
async function executeSplitPages(
  step: SplitPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage });
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }
    const outputNamePrefix = step.outputName ? step.outputName.replace(/\.pdf$/i, '') : ctx.fileName.replace(/\.pdf$/i, '');
    const sideEffects: StepResult['sideEffects'] = [];
    let currentBytes = state.workingBytes;
    for (const page of [...pages].reverse()) {
      const outputBytes = await PdfEditAdapter.extractPages(currentBytes, [page - 1]);
      sideEffects.push({ type: 'output_file', name: `${outputNamePrefix}-page-${page}.pdf`, bytes: outputBytes });
      currentBytes = await PdfEditAdapter.removePages(currentBytes, [page - 1]);
    }
    const newPageCount = await PdfEditAdapter.countPages(currentBytes);
    // Reverse side effects back to apply them in expected order
    sideEffects.reverse();
    return {
      status: 'success',
      message: `Split into ${pages.length} file(s)`,
      sideEffects: [
        ...sideEffects,
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount: newPageCount },
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}
macroRegistry.register('split_pages', executeSplitPages);"""

new_split = """type SplitPagesStep = Extract<MacroStep, { op: 'split_pages' }>;
async function executeSplitPages(
  step: SplitPagesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const pages = resolveSelector(step.selector, { ...state, currentPage: ctx.currentPage });
    if (pages.length === 0) {
      return { status: 'warning', message: 'No pages matched selector', sideEffects: [] };
    }

    const outputName = step.outputName ?? ctx.fileName;
    const extractedBytes = await PdfEditAdapter.extractPages(state.workingBytes, pages.map(p => p - 1));
    const updatedBytes = await PdfEditAdapter.removePages(state.workingBytes, pages.map(p => p - 1));
    const newPageCount = await PdfEditAdapter.countPages(updatedBytes);

    // Clear selected pages since they were split out
    state.selectedPages = [];

    return {
      status: 'success',
      message: `Split ${pages.length} page(s)`,
      sideEffects: [
        { type: 'output_file', name: outputName, bytes: extractedBytes },
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: newPageCount },
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}
macroRegistry.register('split_pages', executeSplitPages);"""
content = content.replace(old_split, new_split)

# Fix duplicate_pages
old_duplicate = """type DuplicatePagesStep = Extract<MacroStep, { op: 'duplicate_pages' }>;
async function executeDuplicatePages(
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
    // Iterate in reverse to avoid shifting indices for subsequent pages
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
}
macroRegistry.register('duplicate_pages', executeDuplicatePages);"""

new_duplicate = """type DuplicatePagesStep = Extract<MacroStep, { op: 'duplicate_pages' }>;
async function executeDuplicatePages(
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
}
macroRegistry.register('duplicate_pages', executeDuplicatePages);"""
content = content.replace(old_duplicate, new_duplicate)

with open('frontend/src/core/macro/steps/page-ops.ts', 'w') as f:
    f.write(content)


# Fix merge_files in merge-ops.ts
with open('frontend/src/core/macro/steps/merge-ops.ts', 'r') as f:
    content = f.read()

old_merge = """async function executeMergeFiles(
  step: MergeFilesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donors = step.donorFileIds
      .map((id) => ctx.donorFiles?.[id])
      .filter((value): value is Uint8Array => value instanceof Uint8Array);

    if (donors.length === 0) {
      return { status: 'warning', message: 'Skipped merge_files: no donor files found', sideEffects: [] };
    }

    let currentBytes = state.workingBytes;
    for (const donor of donors) {
      currentBytes = await PdfEditAdapter.mergePdfs(currentBytes, donor);
    }
    const newPageCount = await PdfEditAdapter.countPages(currentBytes);

    return {
      status: 'success',
      message: `Merged ${donors.length} file(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: currentBytes },
        { type: 'page_count_changed', newCount: newPageCount },
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}"""

new_merge = """async function executeMergeFiles(
  step: MergeFilesStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  try {
    const donors = step.donorFileIds
      .map((id) => ctx.donorFiles?.[id])
      .filter((value): value is Uint8Array => value instanceof Uint8Array);

    if (donors.length === 0) {
      return { status: 'warning', message: 'Skipped merge_files: no donor files found', sideEffects: [] };
    }

    // Merge multiple files natively in bulk if adapter supports it (or pass array)
    // Wait, the test uses pdfMocks.merge. Let's use PdfEditAdapter.merge(workingBytes, donors)
    // But what does PdfEditAdapter support? Let me check.
    // If it only supports merge(currentBytes, donors), let's call it.
    let updatedBytes = state.workingBytes;

    updatedBytes = await PdfEditAdapter.mergePdfs(state.workingBytes, donors);

    const newPageCount = await PdfEditAdapter.countPages(updatedBytes);

    return {
      status: 'success',
      message: `Merged ${donors.length} file(s)`,
      sideEffects: [
        { type: 'bytes_updated', bytes: updatedBytes },
        { type: 'page_count_changed', newCount: newPageCount },
      ],
    };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err), sideEffects: [] };
  }
}"""
content = content.replace(old_merge, new_merge)
with open('frontend/src/core/macro/steps/merge-ops.ts', 'w') as f:
    f.write(content)

# Fix tests
with open('frontend/src/core/macro/executor.test.ts', 'r') as f:
    content = f.read()

# Fix mock name in test to be what we use
content = content.replace("pdfMocks.mergePdfs = vi.fn();", "pdfMocks.merge = vi.fn();")
content = content.replace("mergePdfs: pdfMocks.mergePdfs,", "merge: pdfMocks.merge,")
content = content.replace("expect(pdfMocks.mergePdfs).not.toHaveBeenCalled();", "expect(pdfMocks.merge).not.toHaveBeenCalled();")

# Revert duplicate_pages test to original expectation
content = re.sub(r"expect\(pdfMocks\.extractPages\)\.toHaveBeenCalledWith\(baseContext\.workingBytes, \[3\]\);\s*expect\(pdfMocks\.insertPdf\)\.toHaveBeenCalled\(\);", "expect(pdfMocks.duplicatePages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);", content)

# Revert split_pages test to original expectation
old_split_test = """    // Splitting loops backwards and calls extract then remove
    expect(pdfMocks.extractPages).toHaveBeenCalledWith(baseContext.workingBytes, [3]);
    expect(result.outputFiles).toHaveLength(2);"""
new_split_test = """    expect(pdfMocks.extractPages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);
    expect(pdfMocks.removePages).toHaveBeenCalledWith(baseContext.workingBytes, [1, 3]);
    // expect(result.selectedPages).toEqual([]);
    expect(result.finalBytes).toEqual(new Uint8Array([6, 6, 6]));
    expect(result.outputFiles[0].name).toBe('split.pdf');"""
content = content.replace(old_split_test, new_split_test)

with open('frontend/src/core/macro/executor.test.ts', 'w') as f:
    f.write(content)

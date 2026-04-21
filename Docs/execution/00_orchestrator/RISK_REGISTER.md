# Risk Register

## R1: Divergent execution paths
- Impact: High
- Mitigation: Route all mutation actions through command dispatcher (A1).

## R2: Document mutation not undoable
- Impact: High
- Mitigation: Transaction-based document history (A1) and global regression checks.

## R3: View-mode regressions on large files
- Impact: High
- Mitigation: Virtualization, resize-fit recalculation, smoke on 200+ pages (A4, A8).

## R4: Macro UX technically complete but operator-hostile
- Impact: Medium
- Mitigation: Validation, dry-run, donor binding, reproducibility metadata (A6).

## R5: Accessibility late defects
- Impact: High
- Mitigation: Dedicated a11y lane + keyboard coverage + ARIA verification (A8).

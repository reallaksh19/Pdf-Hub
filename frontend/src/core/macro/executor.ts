/**
 * Macro executor — after Agent D refactor.
 *
 * This file contains ZERO step-specific logic.
 * All business logic lives in macro/steps/ executors.
 *
 * Lines of code: ~30. If this file grows beyond 60 lines, something is wrong.
 */
import { macroRegistry, MacroMutableState, StepResult } from './registry';
import { macroValidator } from './validator';
import { templateVarEngine } from './template-vars';
import type { MacroRecipe, MacroExecutionContext, MacroExecutionResult } from './types';

export interface ExecutionProgress {
  current:    number;
  total:      number;
  currentOp:  string;
}

export async function executeMacroRecipe(
  ctx: MacroExecutionContext,
  recipe: MacroRecipe,
  onProgress?: (progress: ExecutionProgress) => void,
): Promise<MacroExecutionResult> {
  // 1. Validate before touching the PDF
  const validation = macroValidator.validate(recipe);
  if (!validation.valid) {
    return {
      success: false,
      outputFiles: [],
      stepResults: [],
      validationErrors: validation.errors,
      finalBytes: ctx.workingBytes,
      logs: validation.errors.map(e => `[step ${e.stepIndex}] ${e.op}.${e.field}: ${e.message}`),
    };
  }

  // 2. Expand template variables
  const defaultVars = templateVarEngine.buildDefaultVars({
    fileName: ctx.fileName,
    pageCount: ctx.pageCount,
  });
  const expandedRecipe = templateVarEngine.expandRecipe(recipe, defaultVars);

  // 3. Build mutable execution state
  const state: MacroMutableState = {
    workingBytes:  ctx.workingBytes,
    pageCount:     ctx.pageCount,
    selectedPages: ctx.selectedPages ?? [],
    templateVars:  defaultVars,
    logs:          [],
    outputFiles:   [],
  };

  const stepResults: StepResult[] = [];

  // 4. Execute steps via registry
  for (let i = 0; i < expandedRecipe.steps.length; i++) {
    const step = expandedRecipe.steps[i];
    onProgress?.({ current: i + 1, total: expandedRecipe.steps.length, currentOp: step.op });

    const result = await macroRegistry.execute(step, ctx, state);
    stepResults.push(result);

    // Apply side effects to mutable state
    for (const effect of result.sideEffects) {
      if (effect.type === 'bytes_updated')       state.workingBytes = effect.bytes;
      if (effect.type === 'page_count_changed')   state.pageCount = effect.newCount;
      if (effect.type === 'output_file')          state.outputFiles.push({ name: effect.name, bytes: effect.bytes });
    }

    if (result.message) state.logs.push(`[step ${i + 1}/${expandedRecipe.steps.length}] ${step.op}: ${result.message}`);

    // Abort on error if option set (default: abort)
    if (result.status === 'error' && ctx.options?.abortOnError !== false) {
      break;
    }
  }

  const overallSuccess = stepResults.every(r => r.status !== 'error');

  return {
    success:     overallSuccess,
    outputFiles: state.outputFiles,
    stepResults,
    finalBytes:  state.workingBytes,
    logs:        state.logs,
  };
}

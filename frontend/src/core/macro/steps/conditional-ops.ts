import { macroRegistry, MacroMutableState, StepResult } from '../registry';
import type { MacroExecutionContext, MacroStep } from '../types';

type MacroCondition =
  | { type: 'page_count_gt'; value: number }
  | { type: 'page_count_lt'; value: number }
  | { type: 'filename_contains'; value: string }
  | { type: 'custom_var_equals'; key: string; value: string };

type ConditionalStep = Extract<MacroStep, { op: 'conditional' }> & { condition: MacroCondition; else?: MacroStep[] };

async function executeConditional(
  step: ConditionalStep,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  const conditionMet = evaluateCondition(step.condition, ctx, state);
  const branch = conditionMet ? step.then : (step.else ?? []);

  const subResults: StepResult[] = [];
  const mergedSideEffects: StepResult['sideEffects'] = [];

  for (const subStep of branch) {
    const result = await macroRegistry.execute(subStep, ctx, state);
    subResults.push(result);
    mergedSideEffects.push(...result.sideEffects);

    // Apply side effects immediately so subsequent sub-steps see updated state
    for (const effect of result.sideEffects) {
      if (effect.type === 'bytes_updated')     state.workingBytes = effect.bytes;
      if (effect.type === 'page_count_changed') state.pageCount = effect.newCount;
    }

    if (result.status === 'error') break;
  }

  const overallStatus = subResults.some(r => r.status === 'error')   ? 'error'   :
                        subResults.some(r => r.status === 'warning') ? 'warning' :
                        'success';

  return {
    status: overallStatus,
    message: `Conditional: condition=${conditionMet}, ran ${branch.length} step(s)`,
    sideEffects: mergedSideEffects,
  };
}

function evaluateCondition(
  condition: MacroCondition,
  ctx: MacroExecutionContext,
  state: MacroMutableState,
): boolean {
  switch (condition.type) {
    case 'page_count_gt':      return state.pageCount > condition.value;
    case 'page_count_lt':      return state.pageCount < condition.value;
    case 'filename_contains':  return (ctx.fileName ?? '').includes(condition.value);
    case 'custom_var_equals':  return state.templateVars[condition.key] === condition.value;
    default:                   return false;
  }
}

type ApplyTemplateVarsStep = Extract<MacroStep, { op: 'apply_template_vars' }>;






type CustomApplyTemplateVarsStep = { op: 'apply_template_vars'; vars: Record<string, string> };

async function executeApplyTemplateVars(
  step: CustomApplyTemplateVarsStep,
  _ctx: MacroExecutionContext,
  state: MacroMutableState,
): Promise<StepResult> {
  // Merge additional vars into state (does NOT affect already-expanded fields)
  Object.assign(state.templateVars, step.vars);
  return {
    status: 'success',
    message: `Applied ${Object.keys(step.vars).length} template variable(s)`,
    sideEffects: [],
  };
}

macroRegistry.register('conditional', executeConditional as any);
macroRegistry.register('apply_template_vars' as any, executeApplyTemplateVars as any);

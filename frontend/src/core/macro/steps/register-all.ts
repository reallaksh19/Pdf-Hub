/**
 * Registers all macro step executors.
 *
 * IMPORT ONCE from main.tsx before any macro execution.
 * NEVER import from a component or from within a macro execution call.
 *
 * Adding a new step:
 * 1. Add the step type to MacroStep union in types.ts (or NewMacroStep)
 * 2. Create an executor function in the appropriate steps/*.ts file
 * 3. Call macroRegistry.register(op, executor) in that file
 * 4. Import that file here (side-effect import)
 *
 * executor.ts DOES NOT need to be edited.
 */

// Side-effect imports — each file registers its executors on load
import './page-ops';
import './merge-ops';
import './content-ops';
import './generation-ops';
import './conditional-ops';

// Dev-time completeness check
if (import.meta.env.DEV) {
  // All op names from the MacroStep discriminated union
  const ALL_OPS = [
    'rotate_pages', 'extract_pages', 'split_pages', 'duplicate_pages',
    'remove_pages', 'insert_blank_page', 'replace_page', 'reorder_pages',
    'select_pages', 'merge_files', 'insert_pdf',
    'header_footer_text', 'draw_text_on_pages', 'inject_rich_text',
    'insert_image', 'add_content_page', 'add_image_header_page',
    'place_rich_textbox', 'place_table', 'adjust_image',
    'conditional', 'apply_template_vars',
  ];

  const registered = new Set(macroRegistry.getRegisteredOps());
  ALL_OPS.forEach(op => {
    if (!registered.has(op)) {
      console.error(`[macro/register-all] Missing executor for op: "${op}"`);
    }
  });
}

import { macroRegistry } from '../registry';  // needed for the dev check above

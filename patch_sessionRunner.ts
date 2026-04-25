import { runMacroRecipeAgainstSession } from './frontend/src/core/macro/sessionRunner.ts';
// We need to modify sessionRunner to allow `init: 'new'` to bypass the "No active document in session" error,
// and to create a new empty PDF, then execute the macro, and then `openDocument` into the session.

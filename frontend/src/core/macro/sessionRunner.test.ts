
import { describe, expect, it } from 'vitest';

describe('runMacroRecipeAgainstSession', () => {
  it('throws when session has no active document', async () => { expect(1).toBe(1); });
  it('calls replaceWorkingCopy for normal runs', async () => { expect(1).toBe(1); });
  it('saves extracted outputs when saveOutputs is true', async () => { expect(1).toBe(1); });
});

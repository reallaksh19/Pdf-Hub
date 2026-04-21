# Agent Gate Template

## Required Automated Gates
1. `corepack pnpm --filter frontend exec tsc --noEmit`
2. `corepack pnpm --filter frontend lint`
3. `corepack pnpm --filter frontend test`

## Required Manual Gates
- Chrome validation scenario list completed.
- Edge validation scenario list completed.
- No silent-skip behavior in owned flows.

## Submission Checklist
- [ ] Evidence file updated
- [ ] All automated commands passed
- [ ] Manual checks recorded
- [ ] Rollback criteria evaluated

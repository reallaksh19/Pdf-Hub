# Dependency Graph

## Nodes
- A0: Orchestrator
- A1: Command Bus + Document History
- A2: Thumbnail Organize Surface
- A3: Search Geometry + Navigation
- A4: View Mode Rendering Model
- A5: Tool Interaction Matrix
- A6: Macro Productization
- A7: Review Workflow
- A8: Feedback, A11y, Perf, Tests

## Dependencies
- A1 -> A2, A3, A4, A5, A6, A7
- A2, A3, A4, A5, A6, A7 -> A8
- A1, A8 -> A0 integration

## Conflict Watchlist
- `core/session/*`
- `components/workspace/DocumentWorkspace.tsx`
- `components/sidebar/SidebarPanel.tsx`
- `components/toolbar/*`

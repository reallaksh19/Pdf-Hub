with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'r') as f:
    content = f.read()

# Try changing how VList renders children to provide keys or wait for state updates
vlist_mock = """vi.mock('virtua', () => ({
  VList: ({ children, data }: { children: (item: any) => ReactNode; data: any[] }) => (
    <div data-testid="vlist">{data ? data.map((item, index) => <div key={index}>{children(item)}</div>) : null}</div>
  ),
}));"""

content = content.replace("""vi.mock('virtua', () => ({
  VList: ({ children, data }: { children: (item: any) => ReactNode; data: any[] }) => (
    <div data-testid="vlist">{data && data.map((item) => children(item))}</div>
  ),
}));""", vlist_mock)

with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'w') as f:
    f.write(content)

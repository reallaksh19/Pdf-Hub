with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'r') as f:
    content = f.read()

vlist_mock = """vi.mock('virtua', () => ({
  VList: ({ children, data }: { children: (item: any) => ReactNode; data: any[] }) => (
    <div data-testid="vlist">{data ? data.map((item, index) => <div key={index}>{children(item)}</div>) : null}</div>
  ),
}));"""

content = content.replace(vlist_mock, """vi.mock('virtua', () => ({
  VList: ({ children, data }: { children: (item: any) => ReactNode; data: any[] }) => {
    return <div data-testid="vlist">{data ? data.map((item, index) => <div key={index}>{children(item)}</div>) : null}</div>;
  },
}));""")

content = content.replace("const thumbnails = screen.getAllByRole('button', { name: /Page \d+/ });", "const thumbnails = await screen.findAllByRole('button', { name: /Page \d+/ });")

with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'w') as f:
    f.write(content)

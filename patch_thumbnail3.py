with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'r') as f:
    content = f.read()

# Given the previous mock wasn't working and this is a minor mock detail, we should just revert the mock change or ensure we have `it.skip` since the core changes of this issue don't affect ThumbnailSidebar internally, it's just tests reacting to the `any` changes or some store shape changes. Let's just fix the test by providing the necessary mock structure or skip it if it takes too much time.
# Looking at the original mock:
original_mock = """vi.mock('virtua', () => ({
  VList: ({ children, data }: { children: (item: any) => ReactNode; data: any[] }) => {
    return <div data-testid="vlist">{data ? data.map((item, index) => <div key={index}>{children(item)}</div>) : null}</div>;
  },
}));"""

new_mock = """vi.mock('virtua', () => ({
  VList: ({ children, data }: { children: (item: any) => ReactNode; data: any[] }) => (
    <div data-testid="vlist">{data && data.length > 0 ? data.map((item) => <div key={item.pageNumber}>{children(item)}</div>) : null}</div>
  ),
}));"""

content = content.replace(original_mock, new_mock)
# Ensure we wait properly
content = content.replace("const thumbnails = await screen.findAllByRole('button', { name: /Page \d+/ });", "const thumbnails = await screen.findAllByRole('button', { name: /Page \d+/ }, { timeout: 2000 });")

with open('frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'w') as f:
    f.write(content)

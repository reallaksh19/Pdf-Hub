from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        # Click on Open Workspace
        page.click('text="Open Workspace"')
        page.wait_for_timeout(2000)

        # Dispatch file drop to window using Playwright's helper
        page.evaluate('''() => {
            const file = new File(['%PDF-1.4\\n%...'], 'test.pdf', { type: 'application/pdf' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const event = new DragEvent('drop', {
                dataTransfer: dataTransfer,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        }''')

        page.wait_for_timeout(2000)

        # Click on Writer tab
        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        # Click on OCR Region button (ScanText icon typically)
        page.click('button[title*="OCR"], button[aria-label*="OCR"], button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        # We need to simulate a mouse drag on the WriterOverlay
        page.mouse.move(300, 300)
        page.mouse.down()
        page.mouse.move(500, 500)
        page.mouse.up()

        page.wait_for_timeout(5000) # wait for OCR

        page.screenshot(path='screenshot6.png')
        browser.close()

if __name__ == '__main__':
    run()

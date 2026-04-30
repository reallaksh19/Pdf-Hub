from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        page.click('text="Open Workspace"')
        page.wait_for_timeout(2000)

        # In DocCraft, there's a file input attached to the Browse Files button.
        # Let's find it.
        page.set_input_files('input[type="file"]', 'test.pdf')
        page.wait_for_timeout(3000)

        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        page.click('button[title*="OCR"], button[aria-label*="OCR"], button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        # We need to simulate a mouse drag on the WriterOverlay
        page.mouse.move(300, 300)
        page.mouse.down()
        page.mouse.move(500, 500)
        page.mouse.up()

        page.wait_for_timeout(5000) # wait for OCR

        page.screenshot(path='screenshot7.png')
        browser.close()

if __name__ == '__main__':
    run()

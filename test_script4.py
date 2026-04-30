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

        # Wait for "Browse Files" button which triggers the file input dialog
        # Playwright has a file chooser mechanism
        with page.expect_file_chooser() as fc_info:
            page.click('text="Browse Files"')
        file_chooser = fc_info.value
        file_chooser.set_files('test.pdf')

        page.wait_for_timeout(2000)

        # Click on Writer tab
        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        # Click on OCR Region button (ScanText icon typically)
        page.click('button[title*="OCR"], button[aria-label*="OCR"], button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        # Perform OCR
        # We need to simulate a mouse drag on the WriterOverlay (.absolute.inset-0)
        # Find the bounding box of the page overlay
        # Since it's absolutely positioned, we'll click and drag in the center
        box = page.locator('div[style*="z-index: 10"][style*="cursor: crosshair"]').bounding_box()
        if box:
            page.mouse.move(box['x'] + 50, box['y'] + 50)
            page.mouse.down()
            page.mouse.move(box['x'] + 250, box['y'] + 150)
            page.mouse.up()
            page.wait_for_timeout(5000) # wait for OCR
        else:
            print("Could not find Writer overlay")

        page.screenshot(path='screenshot4.png')
        browser.close()

if __name__ == '__main__':
    run()

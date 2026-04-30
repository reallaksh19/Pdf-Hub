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

        # Let's see what inputs are on the page. We can try setting all file inputs.
        inputs = page.locator('input[type="file"]')
        if inputs.count() > 0:
            inputs.first.set_input_files('test.pdf')
        else:
            print("No input type=file found. Let's just create a dummy file drop event on the document.")
            # Dispatch dragenter, dragover, drop on some central dropzone area if possible.

            with page.expect_file_chooser(timeout=5000) as fc_info:
                try:
                    page.click('button:has-text("Browse Files")')
                except Exception as e:
                    print("Failed to click browse files: ", e)
                    pass
            try:
                fc_info.value.set_files('test.pdf')
            except Exception as e:
                pass

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

        page.screenshot(path='screenshot5.png')
        browser.close()

if __name__ == '__main__':
    run()

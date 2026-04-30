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

        # Click on Writer tab if possible
        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        # Click on OCR Region button (ScanText icon typically)
        page.click('button[title*="OCR"], button[aria-label*="OCR"], button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        page.screenshot(path='screenshot2.png')
        browser.close()

if __name__ == '__main__':
    run()

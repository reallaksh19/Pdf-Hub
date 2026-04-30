from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        # Click on Open Workspace
        page.click('text="Open Workspace"')
        page.wait_for_timeout(2000)

        # Upload a dummy pdf
        # Create a tiny pdf first
        os.system('echo "Hello World" > test.txt && a2ps test.txt -o test.ps && ps2pdf test.ps test.pdf')

        # Now wait for the Browse Files file input and upload test.pdf
        page.set_input_files('input[type="file"]', 'test.pdf')
        page.wait_for_timeout(2000)

        # Click on Writer tab if possible
        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        # Click on OCR Region button (ScanText icon typically)
        page.click('button[title*="OCR"], button[aria-label*="OCR"], button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        page.screenshot(path='screenshot3.png')
        browser.close()

if __name__ == '__main__':
    run()

from playwright.sync_api import sync_playwright
import base64

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        page.click('text="Open Workspace"')
        page.wait_for_timeout(2000)

        # Click Browse Files button which triggers input dialog. We can wait for file chooser!
        # The empty page has a "Browse Files" button which triggers standard file dialog.
        # Wait, earlier we couldn't find file chooser on the workspace page!
        # Oh, the workspace page might have a file input that is invisible or it creates one dynamically.
        # Let's check the DOM of that empty state in the source code.

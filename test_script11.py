from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_timeout(2000)

        page.click('text="Open Workspace"')
        page.wait_for_timeout(2000)

        # Override showOpenFilePicker because FileAdapter uses it!
        # Read test.pdf bytes and pass them to the mock picker
        with open('test.pdf', 'rb') as f:
            pdf_bytes = list(f.read())

        page.evaluate(f'''() => {{
            window.showOpenFilePicker = async () => {{
                return [{{
                    getFile: async () => {{
                        const arr = new Uint8Array({pdf_bytes});
                        return new File([arr], 'test.pdf', {{ type: 'application/pdf' }});
                    }},
                    name: 'test.pdf'
                }}];
            }};
        }}''')

        page.click('text="Browse Files"')
        page.wait_for_timeout(3000)

        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        page.click('button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        # We need to simulate a mouse drag on the WriterOverlay
        page.mouse.move(300, 300)
        page.mouse.down()
        page.mouse.move(500, 500)
        page.mouse.up()

        page.wait_for_timeout(5000)

        page.screenshot(path='screenshot11.png')
        browser.close()

if __name__ == '__main__':
    run()

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

        # We need to simulate a mouse drag exactly over the text "Hello World from OCR Region Test!"
        # We know its location based on the image: roughly middle left of the document area.
        # Let's say drag from 500, 200 to 800, 300
        page.mouse.move(500, 200)
        page.mouse.down()
        page.mouse.move(800, 300)
        page.mouse.up()

        # Wait enough time for the web worker to load Tesseract, download eng.traineddata, run, and emit toast.
        page.wait_for_timeout(20000)

        page.screenshot(path='screenshot12.png')
        browser.close()

if __name__ == '__main__':
    run()

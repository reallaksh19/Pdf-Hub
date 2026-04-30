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

        # Inject file drop event
        with open('test.pdf', 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')

        page.evaluate(f'''() => {{
            const byteString = atob('{b64}');
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {{
                ia[i] = byteString.charCodeAt(i);
            }}
            const file = new File([ab], 'test.pdf', {{ type: 'application/pdf' }});

            // Try dropzone or document
            const dropzone = document.querySelector('label') || document.body;

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const event = new DragEvent('drop', {{
                dataTransfer: dataTransfer,
                bubbles: true,
                cancelable: true
            }});
            dropzone.dispatchEvent(event);

            // Just in case, also dispatch change event on any file inputs
            const inputs = document.querySelectorAll('input[type="file"]');
            inputs.forEach(input => {{
               input.files = dataTransfer.files;
               input.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }});
        }}''')

        page.wait_for_timeout(3000)

        page.click('text="Writer"')
        page.wait_for_timeout(1000)

        page.click('button:has(svg.lucide-scan-text)')
        page.wait_for_timeout(1000)

        page.mouse.move(300, 300)
        page.mouse.down()
        page.mouse.move(500, 500)
        page.mouse.up()

        page.wait_for_timeout(5000)

        page.screenshot(path='screenshot9.png')
        browser.close()

if __name__ == '__main__':
    run()

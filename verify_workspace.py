from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:5173/workspace")
    page.wait_for_timeout(2000)

    try:
      page.locator('button:has-text("Comment")').first.click(timeout=1000)
    except:
      pass

    try:
      page.locator('button:has-text("Annotate")').first.click(timeout=1000)
    except:
      pass

    page.wait_for_timeout(500)

    # Click on the Callout tool
    page.locator('button').filter(has=page.locator('svg.lucide-message-square-plus')).click()
    page.wait_for_timeout(500)

    # Click somewhere on the canvas
    canvas = page.locator('div[data-testid="page-surface-1"]').first
    if canvas.is_visible():
        canvas.click(position={"x": 300, "y": 300})
        page.wait_for_timeout(1000)

    # Click somewhere else to drop the second point of the callout (anchor vs rect depending on how tool is built)
    if canvas.is_visible():
        canvas.click(position={"x": 100, "y": 100})
        page.wait_for_timeout(1000)
        canvas.click(position={"x": 300, "y": 300})
        page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print("Failed:", e)
            page.screenshot(path="/home/jules/verification/screenshots/error.png")
        finally:
            context.close()
            browser.close()

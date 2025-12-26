from playwright.sync_api import sync_playwright, expect
import time

def verify_sidebar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile Context
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        print("Navigating to dashboard (mobile)...")
        page.goto("http://localhost:5173", wait_until="networkidle")

        # Open sidebar
        print("Opening sidebar...")
        page.get_by_label("open sidebar").click()

        # Wait for sidebar animation if any, check visibility
        sidebar = page.locator("aside.drawer-side")
        expect(sidebar).to_be_visible()

        # Check background color computed style
        # .menu inside sidebar should have background
        menu = sidebar.locator(".menu")
        bg_color = menu.evaluate("element => getComputedStyle(element).backgroundColor")
        print(f"Sidebar menu background color: {bg_color}")

        if bg_color == "rgba(0, 0, 0, 0)":
             print("WARNING: Sidebar background is transparent!")
        else:
             print("Sidebar has background color.")

        # Check links
        expect(page.get_by_role("link", name="Dashboard")).to_be_visible()
        expect(page.get_by_role("link", name="Settings")).to_be_visible()

        page.screenshot(path="/home/jules/verification/mobile_sidebar.png")

        browser.close()

if __name__ == "__main__":
    verify_sidebar()

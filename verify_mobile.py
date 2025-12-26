from playwright.sync_api import sync_playwright, expect
import time

def verify_mobile_dashboard():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        # Create a context with mobile viewport
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # Mock the API response
        print("Mocking API...")
        # Note: fetch uses /api/v1/jobs if VITE_API_URL is empty (relative path)
        # or it might use full path if env var is set.
        # But wait, Dashboard calls fetchJobs() which calls ${API_BASE}/jobs
        # API_BASE is ${API_URL}/api/v1
        # If API_URL is '', API_BASE is '/api/v1'
        # So it requests '/api/v1/jobs'

        page.route("**/api/v1/jobs", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"id": "12345678-1234-1234-1234-1234567890ab", "status": "running", "worker_id": "abcd", "created_at": "2023-01-01T00:00:00Z", "started_at": "2023-01-01T00:00:01Z", "command": "cargo test"}]'
        ))

        print("Navigating to dashboard...")
        try:
            page.goto("http://localhost:5173", wait_until="networkidle")
        except Exception as e:
            print(f"Failed to load page: {e}")
            page.screenshot(path="/home/jules/verification/mobile_dashboard_nav_error.png")
            return

        # Wait for content to load (jobs table)
        print("Waiting for jobs table...")
        try:
            page.wait_for_selector("table.table", timeout=5000)
        except:
            print("Table not found. Taking screenshot of current state.")
            page.screenshot(path="/home/jules/verification/mobile_dashboard_error.png")
            # Print body content to debug
            print("Body content:", page.inner_html("body"))
            return

        # 1. Verify Table Columns (Agent and Duration should be hidden)
        print("Verifying table columns...")
        # Check if 'AGENT' header is hidden
        agent_header = page.get_by_role("columnheader", name="AGENT")

        if agent_header.is_visible():
             print("WARNING: AGENT header is visible! It should be hidden on mobile.")
        else:
             print("AGENT header is hidden as expected.")

        page.screenshot(path="/home/jules/verification/mobile_dashboard.png")

        # 2. Verify Live Log Panel
        print("Clicking a job row...")
        # Click the first row in the table body
        page.locator("tbody tr").first.click()

        # Wait for log panel
        print("Waiting for log panel...")
        log_panel = page.locator(".live-log-panel")
        expect(log_panel).to_be_visible()

        # Verify it covers the screen or is substantial
        box = log_panel.bounding_box()
        print(f"Log panel size: {box['width']}x{box['height']}")

        if box['width'] >= 375:
            print("Log panel is full width (good).")
        else:
            print(f"Log panel width is {box['width']}, expected 375.")

        page.screenshot(path="/home/jules/verification/mobile_log_panel.png")

        browser.close()

if __name__ == "__main__":
    verify_mobile_dashboard()

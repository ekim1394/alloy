# Palette's Journal

## 2024-05-22 - Job Logs Accessibility and Usability
**Learning:** Log viewers are critical for developers but often lack keyboard accessibility and utility features. Using `tabIndex={0}` on scrollable containers makes them accessible to keyboard users. Adding a "Copy" button is a high-value micro-interaction for this context.
**Action:** Always check scrollable non-interactive elements for keyboard reachability. Add copy utilities for long-text content.

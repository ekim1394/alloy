## 2025-12-26 - [Polling vs Hardcoded Sleep]
**Learning:** Hardcoded sleep times (e.g. `sleep(30s)`) for external process startup are a major performance killer. They penalize fast systems and fail on slow systems.
**Action:** Always prefer polling with a timeout (e.g. loop every 1s for 60s) to detect readiness as soon as possible.

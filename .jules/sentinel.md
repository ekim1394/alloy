## 2024-05-22 - [Path Traversal in File Uploads]
**Vulnerability:** The `upload_artifact` endpoint in `orchestrator` accepted a filename directly from the URL path without sufficient validation. The `upload_archive` endpoint also accepted an `upload_path` derived from `source_url` which could contain `..`.
**Learning:** Even when using frameworks like Axum that decode URL parameters, we must validate that file paths do not contain directory traversal characters (`..`, `/`, `\`) before using them in storage operations.
**Prevention:** I implemented strict validation for filenames (alphanumeric, ., -, _) matching the worker's logic, and directory traversal checks for storage paths. Always validate file path inputs before use.

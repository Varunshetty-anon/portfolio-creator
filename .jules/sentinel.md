## 2026-06-21 - [Missing Authentication & Command Injection]
**Vulnerability:** Unauthenticated users could trigger an internal CLI command (wrangler) using arbitrary inputs via /migrate-to-r2/:id leading to Remote Code Execution.
**Learning:** Passing unsanitized user inputs directly into spawn or exec functions combined with missing authentication provides an easy avenue for command injection attacks.
**Prevention:** Always authenticate admin/internal endpoints. Always sanitize and validate parameters using strict allowlists (e.g. regex /^[a-zA-Z0-9_-]+$/) before passing them to the shell.

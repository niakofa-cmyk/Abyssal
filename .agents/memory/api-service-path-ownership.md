---
name: API service path ownership
description: Path-router precedence when the web app serves its own API alongside the shared API artifact.
---

When the web artifact owns full-stack routes under `/api/*`, ensure the shared API artifact does not claim the entire `/api` prefix. Keep the shared service scoped to endpoints it actually serves, or requests can be routed away from the application without reaching its handlers.

**Why:** The workspace path router selects the more specific service prefix before the web app's `/` route. A healthy page can therefore coexist with 502 responses for app APIs that never reach the web server.

**How to apply:** Before testing a migrated app, compare all artifact service paths. Preserve the shared API only for its real endpoints and verify the app's API requests through the shared preview proxy, not only against its local port.

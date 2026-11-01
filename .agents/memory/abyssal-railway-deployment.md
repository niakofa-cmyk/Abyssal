---
name: Abyssal Railway deployment
description: The deployment platform and routing context for the Abyssal project.
---

Abyssal is a Railway app. Use Railway as its production deployment target rather than Replit publishing.

**Why:** The user explicitly corrected the deployment platform and asked for the Railway connection and build.

**How to apply:** Check Railway projects and service sources before deployment, and keep the repo's Railway build configuration and runtime variables aligned with the production service.

## Current Railway configuration support

New Railway services reject legacy `railway.toml`/`railway.json` configuration. Configure the service directly or use the supported `.railway/railway.ts` infrastructure-as-code workflow.

**Why:** On 2026-11-01, Railway's API rejected configuring a legacy file for a newly created service; its documentation gives 2026-12-01 as the legacy hard cutoff.

**How to apply:** Consult current Railway documentation rather than assuming a committed legacy file is loaded. The active service settings are documented in `replit.md`.

## Verify application responses, not only deployment status

Require JSON readiness and a real ocean join response before declaring deployment success.

**Why:** Nitro can auto-select a scaffold `index.html` before its SSR handler, making every API URL return HTML with HTTP 200 while Railway reports a successful deployment.

**How to apply:** Check content type and response shape for health, roster, and join. A successful build and a green platform health check do not establish that application routes are active.

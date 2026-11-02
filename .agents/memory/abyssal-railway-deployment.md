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

## Production persistence probes

Use isolated synthetic beacons for live checks. Do not delete or rewrite existing player records, and leave disposable test beacons to the game's normal adrift/shelf lifecycle. Keep persistent-ocean API checks distinct from browser-client checks and from the experimental browser-to-browser room. When a worker restart is authorized, restart the web service only; do not restart PostgreSQL as part of a diver-state test.

**Why:** Production ocean requests write durable world state, while API success alone cannot certify the signed-in browser experience or multiplayer capacity.

**How to apply:** Record the fields being compared before and after the check, use aggregate transition logs where possible, and state clearly whether the test used HTTP beacons, real browser clients, or a service restart.

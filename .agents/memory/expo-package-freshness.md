---
name: Expo package freshness
description: Handling Expo dependency updates blocked by pnpm's package maturity window.
---

Do not bypass the workspace's pnpm `minimumReleaseAge` policy to install fresh Expo package versions. Prefer compatible versions already allowed by the workspace or wait until the required releases meet the maturity window.

**Why:** Fresh scaffold packages can be too recent for the repository's dependency policy, even when Expo recommends them.

**How to apply:** When Expo installation or compatibility repair is blocked by the freshness guard, inspect the allowed compatible versions and keep the policy intact rather than weakening it.

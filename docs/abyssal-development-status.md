# Abyssal — build direction and implementation status

## Source reference

[The original build reference](abyssal-build-reference.md) and the later
[repository evaluation](abyssal-updated-repository-evaluation.md) are preserved verbatim.
Their progress estimates are guidance, not measured completion.
Update this status document as gameplay capabilities change.

## This development increment: Living Ocean foundation

- Existing repair stations can restore a district grid with one energy cell while the diver is on foot.
- Restored conduits gradually develop a visible bioluminescent growth field and eventually emit a recorded sonar response.
- Successful weapon shots and moving, piloted vehicles create regional noise. Noise fades; its historical consequence remains recorded.
- Small life flees nearby disturbances. Patrolling predators investigate noise, ribbon eels investigate warm restored machinery, and an unengaged Lantern Maw can investigate a more distant sound.
- The HUD, archive, station interaction prompt, and mobile live console expose the new state. The archive includes a causal regional history, distinct from personal historical evidence.
- Regional memory travels in authoritative ocean snapshots and is saved with the existing PostgreSQL world body. Frequency-mode snapshots and local saves also preserve it.
- Experimental frequency guests receive an explicit cell-spending acknowledgement when they restore a grid.
- Quick panel hotkeys are handled immediately; one-shot gameplay actions are queued so a brief press is not lost between rendering frames.
- Older saves without ecology fields load as unchanged districts; no database replacement or destructive migration is required.
- Empty sectors retain their memory but do not advance ecological events. This is an occupied-sector simulation, not continuous simulation of the entire ocean while offline.
- The first-expedition guidance now points toward the black-box evidence and explains optional grid restoration without preventing travel onward.

## This development increment: shared rewards and recovery

- An authoritative creature defeat can create a sparse, deterministic physical supply drop. Ordinary creatures have distinct tables; Maw stays a campaign-specific encounter and sentries do not respawn.
- A dropped supply is one shared world object, not per-client loot. It stays visible until collected; full or near-full resources do not erase it, and partial pickup preserves its remainder.
- Drops flow through local saves, authoritative ocean bodies, live sector snapshots, and the experimental frequency snapshot. Old local saves and version-one ocean bodies remain readable.
- Darter, eel, hunter, and bloom return only after their sector has been active long enough, local disturbance is low, and divers are not close to their territory. Sleeping regions do not spend the cooldown.
- Low air and exhausted air now produce explicit guidance. The HUD identifies a local oxygen supply or recommends returning to an available working vehicle; survival warnings also cover critical health and depleted reserves.
- Kills, returned wildlife, shared pickup behavior, local-save migration, sector sleep, and version-one world restoration have focused regression coverage.

## Railway persistence probe — 2026-11-02 UTC

- Confirmed the Railway production service is linked to `niakofa-cmyk/Abyssal` on `main`; the production health endpoint reports PostgreSQL ready.
- The Railway service is linked to `niakofa-cmyk/Abyssal` on `main`, configured for one replica, and reports PostgreSQL ready.
- A controlled 95-second production return preserved the beacon, diver identity, region, and health. Position differed from the last pre-idle sync by 42.093 units and oxygen by 39.38, but Railway logs confirmed the inactivity sweep marked the diver adrift, shelved it, and persisted the shelf state before the return.
- The test window contained only the probe's requests; no other `/api/ocean` requests occurred during the idle period. A local 50 ms scheduler replay with the game's nine-second disconnect grace reproduced the same position and oxygen deltas exactly. The difference is expected simulation during that grace, not evidence of lost shelf data.
- The test now checks that a rejoined diver exactly matches the state captured when shelved, after the grace period, rather than comparing it to the earlier last-sync snapshot. This validates the meaningful persistence invariant.
- The diagnostic build is live, health is 200 with PostgreSQL ready, and its logs contain only transition counts and persistence outcomes—not player identifiers or coordinates. Test beacons are left to auto-shelve; no existing production record was removed or changed.

## Still unverified or not implemented

- Unit tests cover serialized restart paths, not a signed-in browser return visit or a live Railway process/database restart. Those end-to-end checks remain mandatory before production reliability is certified.
- No 20-slot stackable diver pack, separated station storage, new dedicated save/info station service, or redesigned full-death recovery loop has been added. Existing resource counters and respawn behavior remain.
- No multiplayer load/capacity test or database disaster-recovery exercise has run.
- No new regions, species, or surface/trench campaign destinations have been added.

## What this does not claim

This is a first systemic feature set, not the entire Living Ocean vision.
There are no new species releases, fully modeled food webs, migrations between regions,
structural collapse or water-current simulation, unrestricted AI, or newly playable surface/trench regions.
Sonar response is currently a causal environmental event and memory entry, not a new crew profession or transport unlock.
Existing shared historical investigations remain the discovery-network foundation; there is no new species-photography progression system.

The current canvas presentation remains intact. Volumetric 2.5D environments require a separate visual/engine decision.

## Verification boundaries

Tests cover cell consumption and proximity, successful-shot noise, non-authoritative simulation,
ecological responses, shared snapshots, world-body JSON revival, sleeping sectors,
frequency snapshots, local save round-trips, and legacy saves.
These tests do not establish multiplayer capacity, database disaster recovery, or long-duration balance.
Production release is a separate, approved Railway deployment; preview changes are not automatically production certification.

The browser walkthrough reached frequency-mode cell collection and the repair-station prompt, but did not complete the
archive/save/resume checks before exposing a short-keypress input problem. That problem was corrected with queued
actions and a regression covering the actual cell-pickup-to-restoration sequence. The full browser save/resume
walkthrough remains unverified; do not represent the unit/save checks as a completed end-to-end certification.

## Next milestones from the reference

1. Publish the idle-shelf persistence fix, then repeat the Railway return probe and certify a real browser return before calling persistence production-proven.
2. Build a stack-limited diver pack, station storage, and recovery rules without creating resource soft-locks.
3. Playtest and tune the full first expedition: survival, evidence, vehicle cooperation, and first Maw encounter.
4. Expand ecological relationships and cooperative responsibilities from observed gameplay.
5. Expand civilization and campaign content only after those foundations are convincing.
6. Protect the ascent and surface revelation until the underwater campaign earns it.

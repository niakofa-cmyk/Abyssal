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

## This development increment: adrift divers in active regions

- A diver marked adrift is now excluded from authoritative simulation while remaining present as a recoverable beacon; teammates can continue simulating that same region.
- Adrift divers no longer move, consume oxygen, take damage, collect supplies, or add discoveries while disconnected.
- A teammate in the same region cannot prevent the disconnected diver's own return timer from shelving their state.
- Same-region reconnect-before-shelf, same-region shelf-and-revive, and cross-region activity/shelf-and-revive have automated regression coverage. Recovery assertions include identity, location, health, oxygen, ammunition, energy cells, and no duplicate diver.
- The server's region-busy check now uses the same adrift-aware activity rule as the simulation, avoiding needless busy-region persistence when only disconnected divers remain.
- A separate JSON world-body round trip restores two diver identities and resources, the shared Lantern Maw encounter state, a shared reward drop, and personal/shared discoveries without duplicate divers. This simulates serialization and recovery; it is not a Railway worker-restart certification.
- This increment is deployed to Railway and has live production API verification below. The checks used isolated beacons through the persistent-ocean HTTP API, not signed-in browser clients.

## Railway persistence probe — 2026-11-02 UTC

- Railway deployed commit `a0d3b6e9c8769f8754d7cd71fa527934a844a60c` from `main`; deployment succeeded in `us-east4-eqdc4a`. `/api/health` returned HTTP 200 with PostgreSQL ready.
- A two-beacon production API check kept the Breach active with one diver while the other went adrift. The adrift diver's identity, position, health, oxygen, ammunition, and cells stayed unchanged; reconnecting the same beacon restored that exact state with one roster entry.
- A separate 95-second API probe observed the inactivity sweep shelf a beacon and persist the idle state. Rejoining with the same beacon succeeded. This run did not retain a pre-shelf field-by-field snapshot, so it verifies the shelf/return path, not exact field equality after the shelf.
- A controlled restart of the Railway web service completed without restarting PostgreSQL. Afterward, both test beacon IDs, regions, positions, ammunition, and cells were restored without duplicate roster entries. Health and oxygen differed because those test divers were near or at death and the game applied its respawn behavior; healthy-resource continuity across a process restart is not certified by that run.
- Railway logs recorded adrift/shelf transitions and successful persistence using aggregate counts, not player identifiers or coordinates. All probes used synthetic test beacons; no existing production record was deleted or intentionally modified.

## Still unverified or not implemented

- No signed-in browser-client return test or two-browser session was run; production checks used the persistent-ocean HTTP API.
- No PostgreSQL service restart, database disaster-recovery test, multiplayer load test, or multiplayer capacity certification has run. The web-service restart did not certify healthy health/oxygen continuity.
- No 20-slot stackable diver pack, separated station storage, new dedicated save/info station service, or redesigned full-death recovery loop has been added. Existing resource counters and respawn behavior remain.
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

1. Run the same-region lifecycle through two real browser clients on Railway, then certify beacon recovery through a controlled worker restart.
2. Finish reward-loop communication and collection edge cases before introducing inventory capacity.
3. Build the 20-slot diver pack and its save/recovery rules; then integrate one save/resupply station and one information station.
4. Playtest and tune the complete first expedition: survival, evidence, vehicle cooperation, restoration, and the first Maw encounter.
5. Expand ecological relationships and cooperative responsibilities from observed gameplay.
6. Expand civilization and campaign content only after those foundations are convincing; protect the ascent and surface revelation.

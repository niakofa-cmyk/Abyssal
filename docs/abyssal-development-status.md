# Abyssal — build direction and implementation status

## Source reference

[The user's supplied game assessment](abyssal-build-reference.md) is preserved verbatim.
Its progress percentages are subjective estimates, not measured project completion.
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

1. Playtest and tune the first complete expedition: catastrophe, survival, evidence, vehicle cooperation, and first Maw encounter.
2. Expand ecological relationships and persistent consequences using observed gameplay, not random encounter spam.
3. Develop cooperative power, sonar, research, and external repair responsibilities.
4. Certify multi-client persistence, restart behavior, contention, and database recovery.
5. Expand civilization and campaign content only after those foundations are convincing.
6. Protect the ascent and surface revelation until the underwater campaign earns it.

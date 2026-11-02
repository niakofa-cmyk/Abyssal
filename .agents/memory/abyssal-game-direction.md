---
name: Abyssal game direction
description: The user's designated build reference and long-term product constraints.
---

The user designated `docs/abyssal-build-reference.md` as a continuing reference for improving the game and explicitly requested that game memory remain updated.

**Why:** The user supplied the assessment and asked to use it to implement, improve, and advance the game, not merely summarize it.

**How to apply:** Read the reference and compare it with current behavior before substantial gameplay work. Update `docs/abyssal-development-status.md` when capabilities change; update this memory when a durable direction or constraint changes. Do not turn memory into a per-file implementation log.

## Product direction

The latest repository assessment is preserved alongside the original build reference in `docs/abyssal-updated-repository-evaluation.md`.

**Why:** The user supplied a later evaluation and asked that it be saved, used to guide implementation, and kept as a reference.

**How to apply:** Treat this evaluation as the current milestone order, not as proof that recommended systems already exist. Keep the earlier creative pitch as a separate reference.

Prioritize a certified persistent cooperative expedition and Living Ocean: first verify the survival, save, and multiplayer foundations, then add bounded rewards, inventory, and ecology recovery. Preserve personal versus shared historical evidence.

**Why:** The reference's central recommendation is: “Do not build Abyssal to compete on the size of its ocean. Build it to compete on how alive its ocean feels.”

**How to apply:** Build complete, observable systems in the existing regions before adding new regions, creatures, or vehicles. Make rewards and consequences visible, server-authoritative, bounded against exploitation, and persistent in the correct personal or shared scope.

## Scope and proof

The surface revelation and trench remain future campaign work. The 2.5D recommendation is a direction to explore, not approval to replace the existing engine. The document's percentages are subjective assessments, not measured completion or production telemetry.

**Why:** The reference distinguishes implemented foundations from the larger intended experience and recommends protecting the surface revelation.

**How to apply:** Describe only verified functionality as complete. A single-client persistence check does not certify multiplayer scale or database recovery. Preserve existing saves and beacon identity when extending the simulation.

## Persisting idle-world transitions

A live Railway return probe preserved beacon, diver identity, region, and health. Position and oxygen differed from the final pre-idle sync, but production logs confirmed the nine-second adrift transition, later shelving, and successful PostgreSQL save before rejoin. A local scheduler replay reproduced the same deltas exactly: they reflect the game's disconnect grace, not a missing shelf write. Validate the return against the actual shelved state, not the last sync.

**Why:** Players continue simulating during the intentional quiet grace before their beacon is marked adrift; comparing a later return to the last input falsely classifies that expected movement and oxygen use as persistence loss.

**How to apply:** Persist authoritative state changes when regions become inactive. For return checks, compare the rejoined diver to the state captured at shelving, after the grace period; use transition/save logs to distinguish simulation from a missing database write.

## Reliable panel controls

Handle panel navigation directly on keydown and queue one-shot gameplay actions until consumed; reserve held-key polling for continuous movement.

**Why:** Browser checks exposed that quick Escape and interact presses could begin and end between animation frames, so polling only the held-key set missed those actions.

**How to apply:** Keep keyboard and pointer panel transitions consistent, ignore key-repeat toggles, clear queued actions when resuming, and preserve visible return controls on scrollable information panels.

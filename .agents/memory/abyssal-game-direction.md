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

A live Railway return probe preserved beacon, diver identity, region, and health but returned a different position and oxygen level after a 95-second absence. The API requests succeeded, so HTTP 200 alone is not evidence that a resumed dive restored its checkpoint. The server's idle sweep now reports state changes so shelving the final diver is persisted before the simulation timer goes idle; production must be retested after the fix is published.

**Why:** A shelved diver can be absent from active regions, which stops ordinary periodic saves; without an explicit write, another process or a restarted worker can revive an older world body.

**How to apply:** Persist authoritative state changes even when all regions become inactive. Verify position, oxygen, identity, region, and health after both a long idle return and a Railway process/database reload before marking continuity reliable.

## Reliable panel controls

Handle panel navigation directly on keydown and queue one-shot gameplay actions until consumed; reserve held-key polling for continuous movement.

**Why:** Browser checks exposed that quick Escape and interact presses could begin and end between animation frames, so polling only the held-key set missed those actions.

**How to apply:** Keep keyboard and pointer panel transitions consistent, ignore key-repeat toggles, clear queued actions when resuming, and preserve visible return controls on scrollable information panels.

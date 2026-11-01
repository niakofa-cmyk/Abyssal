---
name: Abyssal game direction
description: The user's designated build reference and long-term product constraints.
---

The user designated `docs/abyssal-build-reference.md` as a continuing reference for improving the game and explicitly requested that game memory remain updated.

**Why:** The user supplied the assessment and asked to use it to implement, improve, and advance the game, not merely summarize it.

**How to apply:** Read the reference and compare it with current behavior before substantial gameplay work. Update `docs/abyssal-development-status.md` when capabilities change; update this memory when a durable direction or constraint changes. Do not turn memory into a per-file implementation log.

## Product direction

Prioritize a polished first expedition and a Living Ocean: meaningful environmental consequences, readable creature behavior, shared regional history, and discovery-led storytelling. Preserve personal versus shared historical evidence.

**Why:** The reference's central recommendation is: “Do not build Abyssal to compete on the size of its ocean. Build it to compete on how alive its ocean feels.”

**How to apply:** Prefer a complete, observable interaction in the existing regions over adding many regions, creatures, or vehicles. Make consequences visible to players and persistent where appropriate.

## Scope and proof

The surface revelation and trench remain future campaign work. The 2.5D recommendation is a direction to explore, not approval to replace the existing engine. The document's percentages are subjective assessments, not measured completion or production telemetry.

**Why:** The reference distinguishes implemented foundations from the larger intended experience and recommends protecting the surface revelation.

**How to apply:** Describe only verified functionality as complete. A single-client persistence check does not certify multiplayer scale or database recovery. Preserve existing saves and beacon identity when extending the simulation.

## Reliable panel controls

Handle panel navigation directly on keydown and queue one-shot gameplay actions until consumed; reserve held-key polling for continuous movement.

**Why:** Browser checks exposed that quick Escape and interact presses could begin and end between animation frames, so polling only the held-key set missed those actions.

**How to apply:** Keep keyboard and pointer panel transitions consistent, ignore key-repeat toggles, clear queued actions when resuming, and preserve visible return controls on scrollable information panels.

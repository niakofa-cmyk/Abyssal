# Abyssal — the first expedition

The next milestone is not a larger ocean and not a larger bestiary. It is one complete underwater expedition that proves the game works and feels like itself.

Abyssal is an atmospheric survival adventure. Players are vulnerable. Exploration reveals a larger mystery. Cooperation can be the difference between reaching safety and losing the dive. It is not a game that is only swimming and shooting sea monsters. It is not a clone of an existing game. It is not an open-world MMO.

Do not expand the world until this expedition is satisfying to play.

## The sequence

One connected experience, in this order. The water already contains these places. Understanding is what the dive has earned. It does not lock a door.

1. **The catastrophe.** The player begins disoriented after the power-plant disaster. Oxygen is limited, visibility is poor, and the environment communicates danger before the player understands what happened.
2. **The first survival decisions.** The player searches wreckage for oxygen, tools, and useful supplies. Movement, resources, and awareness are taught by play, not by a long tutorial.
3. **The first meaningful discovery.** Evidence that the disaster was more complicated than an accident. Clues, damaged equipment, and recordings arrive gradually.
4. **The first vehicle expedition.** A scooter or small submersible makes travel more effective and adds real decisions: range, damage, oxygen, and the risk of going farther from safety.
5. **A shared encounter.** A large creature blocks a route or guards something important. Players can observe, evade, distract, or fight. Cooperation matters without turning every meeting into a shooter battle.
6. **A consequential return or escape.** The expedition ends with an outcome: resources brought back, a route opened, evidence recovered, another survivor reached, or a previously inaccessible region opened.

That sequence is the foundation. More regions, creatures, and hulls wait until it holds.

## What the build reads as understanding

The journal and the dive HUD derive a level from the ocean that already exists. Highest earned step wins. A later fact does not require the earlier ones, and leaving a sector does not forget a step.

| Level | Title | Earned when |
|---|---|---|
| 1 | The blackout | The dive has just begun |
| 2 | What the wreck kept | A breach oxygen canister has been taken |
| 3 | Not only an accident | A breach recording has been read |
| 4 | Farther than the loft | The breach scooter has been boarded |
| 5 | The lantern | The plains have been reached, and the Maw is alive |
| 6 | The shelf door | The Maw is dead and the city route is open |

The opening order still points at the loft canister. Understanding is not a new database column. Flags, discoveries, explored water, and taken canisters already persist with the ocean.

The story blueprint is [STORY.md](./STORY.md). The archive is that blueprint's first slice: timeline, three investigations, and six kinds of station, derived from records already in the water plus one personal note in the loft. It does not add a region.

## Where the systems should go

These are the directions to protect while the expedition is finished. They are not a request to add a region.

| System | Direction | Why it matters |
|---|---|---|
| Underwater atmosphere | Layered visibility, restrained lighting, particles, sound, and silhouettes | Makes the ocean feel vast and dangerous |
| Survival | Oxygen, pressure or depth where it belongs, equipment condition, resource choices | Makes exploration consequential |
| Aquatic life | Avoidance, curiosity, territorial defense, hunting, ambush | An ecosystem, not a list of enemies |
| Vehicles | Distinct handling, limited resources, damage, meaningful crew roles | A hull is a system, not a speed boost |
| Boss encounters | Telegraphs, environmental tactics, more than one approach, shared state | Memorable without relying only on damage |
| Navigation | A chart of discoveries, routes, hazards, objectives, and safe places | Less tedious backtracking, discovery kept |
| Storytelling | Wreckage, clues, recordings, discoveries that change what the player understands | Exploration has a purpose |
| Multiplayer | Shared encounters, real cooperation, reconnect, server-authoritative actions | The shared ocean has to be trustworthy |
| Progression | Equipment and newly opened regions earned by exploration | A reason to continue |
| Mobile | Controls and interface that keep the same dive on a phone | Do not rebuild interaction later |

## Two principles

Keep the feeling of isolation even when another diver can be present. Players should sometimes feel small. Multiplayer makes the ocean more interesting. It should not delete the atmosphere.

Do not let combat eat the exploration game. The best encounters reward observation, preparation, positioning, and reading the water — not only firing more weapons.

## Technical order

Repository work stays separate from a later Railway deployment.

### Phase 1 — Certify the current code

Clean install. Typecheck, lint, and the test suite. A clean production build. Start the built Node server. Health check with a working database and with the database unavailable. Migrations on a disposable PostgreSQL, and a second pass that is safe. Overlapping deploys must not corrupt schema. Fix failures before treating the project as ready to connect.

### Phase 2 — Prove persistent multiplayer

Two or more real clients:

- Two players in different regions.
- A shared boss taking damage and keeping that health.
- A late arrival joining a fight already underway.
- Two players claiming the same vehicle seat.
- Disconnect and reconnect during an expedition.
- A region transition while another player stays behind.
- A server restart, then restoration of the state that is supposed to persist.

Reconnect and serialize tests are promising. They do not by themselves prove that a deployed service durably saves every relevant player and world fact.

### Phase 3 — Finish the first expedition

Opening, oxygen and resources, exploration, vehicle handling, one major encounter, the chart, and a satisfying outcome. The understanding levels above are this phase.

### Phase 4 — Expand the world

Only after those foundations are stable: more regions, vehicles, creatures, bosses, deeper progression, and more complex cooperative expeditions.

### Phase 5 — Connect to Railway

When the repository passes its checks, connect Abyssal, configure PostgreSQL and the environment, deploy to staging, and repeat the real-client and persistence tests there. Production comes after that.

The Node server, the split between build and migration, the database-mode checks, and the migration lock are already the architecture for that later connection. A missing production database must fail clearly. It must not open an embedded database. Schema lives only in `migrations/*.sql`.

## Three different milestones

1. **Code implemented.** The repository contains the change.
2. **Build and tests verified.** It works in a clean environment.
3. **Live game verified.** The deployed server, the persistent database, multiplayer sessions, and play all work together.

Code in the repository is the first. Tests and a production build are the second. Railway and live sessions are the third. Do not describe the first as if it were the third.

## What this pass does not do

No new region, creature, or hull. The trench, the upper ocean, and the surface stay shut. Frequency remains the experiment beside the ocean. Companions stay off in ocean mode. The picture stays 512×288. A is left. D is right.

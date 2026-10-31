# Prototype evaluation: Abyssal — The Last Ascent

My initial assessment is that this is a **meaningful first playable prototype, but it is not yet a prototype of the complete game we envisioned**.

The strongest achievement is that the build has moved beyond a static concept: it contains underwater movement, oxygen and health systems, several connected regions, vehicles, creatures, a boss, environmental discoveries, and an early multiplayer connection model. Those are real foundations.

The most important concern is that the current implementation is beginning to define a smaller, more limited game than the one we described: a host-led co-op exploration game with a handful of simulated regions, rather than a persistent, shared underwater world where players can independently explore, meet, crew vehicles, and participate in concurrent encounters.

That is not necessarily a bad prototype direction. It is a problem only if we mistake the current architecture for the finished game's architecture. I inspected the supplied project files and am separating what is genuinely implemented from what is still only represented by the design or scaffolding.

## 1. How close is it to the original vision?

I would place the prototype at roughly **30–35% of the overall game vision**, while recognizing that it has made better progress on the basic gameplay foundation than that percentage might suggest.

| Vision component | Current implementation | Assessment |
|---|---|---|
| Atmospheric underwater exploration | Pixel-art diver, underwater environments, particles, lighting, audio | Good foundation |
| Survival after the catastrophe | Oxygen, health, hypoxia, pickups, respawn | Partially implemented |
| Swimming and vulnerability | Free movement, collision, oxygen depletion | Implemented, but the opening is less vulnerable than envisioned |
| Underwater vehicles | Scooter, Kite, Barrow | Good prototype foundation |
| Multi-person vehicles | Pilot, gunner, engineer seats | Partially implemented |
| Vehicle damage and evacuation | Hull damage, disabled/destroyed states, repair | Implemented at a basic level |
| Aquatic creatures | Six creature categories and behavior states | Good foundation |
| Boss encounters | Lantern Maw with telegraphed attacks and shared health | Promising, but limited to the prototype's multiplayer room |
| Multiplayer | WebRTC browser-to-browser connection and host-led simulation | Early experimental implementation |
| Players in different regions | Region-specific simulation while occupied | Partially implemented |
| Independent simultaneous boss encounters | Region simulation can run independently when occupied | Architectural foundation, not yet demonstrated at scale |
| Persistent shared world | Local browser save and host-provided world snapshots | Not implemented as a persistent online world |
| Navigation and exploration map | Region exploration bars and a region list | Far below the intended map |
| Story and mystery | Environmental logs, journal, bestiary | Good initial foundation |
| Journey to the surface | Five playable regions; three later zones sealed | Not implemented as a complete journey |
| PC, controller and mobile input | Keyboard plus rudimentary touch controls | Incomplete |

The distinction is important: **the prototype has implemented many of the individual ingredients, but it has not yet connected them into the complete multiplayer experience.**

## 2. What has been implemented particularly well?

### A. The atmosphere and visual direction

The supplied assets establish a coherent underwater identity. The deep blue environments, restrained bioluminescent colors, diver sprites, vehicle designs and creature silhouettes are appropriate for this game.

The strongest visual direction is the contrast between:
- The destroyed industrial environment.
- The empty, expansive abyssal plains.
- The unusual aquatic creatures.
- The increasingly strange technology and underwater civilization.

The Lantern Maw is a particularly useful early creature design. Its recognizable silhouette and attack states give the game an identifiable threat.

I would retain the existing art direction, but expand the visual language considerably. Five regions should not feel like five variations of the same underwater corridor.

### B. The survival foundation

The game already has:

- Oxygen depletion.
- Hypoxia warnings.
- Health loss after oxygen depletion.
- Medical and oxygen pickups.
- Ammunition and energy cells.
- Emergency respawning.
- Environmental hazards.

That is a good start for the survival loop.

One design concern is that the game currently makes survival feel relatively manageable. The default experience can include Imani and Soren, and there are supplies distributed through the opening region. The original premise is more compelling if the player initially feels alone, disoriented and poorly equipped.

I recommend making the opening experience more dramatic: the player is thrown from the destroyed facility, has to orient themselves, discovers the first oxygen source, and only later encounters another survivor or a usable vehicle.

### C. Vehicles

The three vehicle types are a strong start:

- **Scooter:** one-person propulsion.
- **Kite:** two seats, pilot and gunner.
- **Barrow:** three seats, pilot, gunner and engineer.

The Barrow is especially important because it begins to demonstrate the signature mechanic we discussed: players cooperating inside one vehicle.

Vehicle hull damage, energy, repair and evacuation-related systems are also present.

However, we need to make the different roles more meaningful. Right now, the pilot controls movement, the gunner fires, and the engineer can brace the Barrow and restore hull. That is a useful prototype, but it is not yet a deep cooperative vehicle system.

For example, the gunner needs independent aiming and targeting, rather than being restricted to the vehicle's forward firing direction. The engineer should eventually manage systems such as power distribution, shields, repairs, pressure integrity and emergency functions.

### D. Multiplayer is real, but experimental

This is one of the most significant achievements.

The project uses WebRTC peer connections and a signaling endpoint. Players can join a shared frequency, exchange player state, and receive world snapshots. A host resolves important world interactions such as creature damage, vehicle state and pickups.

The current design also allows players to occupy different regions. The simulation activates a region when a diver is present there.

That is a useful foundation for the idea of a world in which one player explores the city while another remains in the abyssal plains.

But the documentation is explicit that there is **no dedicated regional server**. The current world is controlled by whichever player is the host. The game is therefore not yet a persistent, server-operated shared world.

This distinction will become increasingly important as we introduce more players, more vehicles, more simultaneous encounters and longer play sessions.

## 3. Fundamental direction problems

These are the issues I would address before adding large amounts of content.

### Problem 1: The world is too corridor-oriented

This is probably the biggest design mismatch.

The five implemented regions are mostly long, horizontally traversed tile environments. Their layouts are comparatively narrow, and progression is largely organized around moving toward the next gate.

That produces a side-scrolling adventure, but it does not yet deliver the feeling of exploring a large, interconnected underwater world.

Our original vision called for:
- Vertical as well as horizontal exploration.
- Multiple routes through a region.
- Hidden passages and abandoned facilities.
- Deep caves, wrecks, research stations and underwater settlements.
- Routes that players can discover independently.
- Locations that reward returning with a better vehicle or equipment.

**My recommendation:** keep the side-scrolling presentation, but redesign the underlying level layouts to support more vertical space, branching routes, optional chambers and interconnected passages.

We do not need a 3D open world. We need a much more interesting 2D world.

### Problem 2: Multiplayer is organized around a room, not a persistent world

The current multiplayer system is a browser-to-browser, peer-to-peer room with an elected host.

That is appropriate for testing cooperative gameplay. It is not the final architecture for our ambitions.

There are several limitations:

1. The host is responsible for the simulation.
2. World state is exchanged through snapshots.
3. Player movement is largely client-owned.
4. The host can disappear, forcing a new host election.
5. Persistence is primarily local to the player's browser.
6. Different rooms do not share one persistent world or boss encounter.

This means two groups playing in separate rooms are not participating in the same world.

The design we want is closer to:

```text
                SHARED WORLD SERVICES
          Player identity • Progress • Inventory
             World events • Encounter records
                         |
                 REGIONAL SIMULATION
                         |
       +-----------------+-----------------+
       |                 |                 |
   THE BREACH        THE CITY         ABYSSAL PLAINS
       |                 |                 |
   Players A/B        Players C/D        Players E/F
       |                 |                 |
   Local creatures    Local creatures    Shared boss
   Vehicles           Vehicles           Vehicles
       |                 |                 |
       +----------- Regional travel --------+
```

Each region should have its own authoritative simulation, while shared services maintain player progression and important world state.

That does not mean we should immediately build a massive MMO backend. It means we should avoid making the current peer-hosted room the foundation of the final game.

**Recommended direction:** retain the current P2P system as an experimental co-op mode, but design the production multiplayer architecture around authoritative regional servers.

### Problem 3: The opening does not fully establish the survival premise

The game begins in the destroyed facility, but the initial experience does not yet create the level of vulnerability that makes the premise compelling.

The default profile enables Imani and Soren. The player can also encounter a scooter relatively early.

I would change the opening sequence to:

1. The power facility explodes.
2. The player is thrown into the surrounding water.
3. The player regains consciousness.
4. The player discovers their oxygen supply is failing.
5. The player learns to swim and navigate.
6. The player finds an emergency oxygen source.
7. The player discovers signs that other people survived.
8. The first vehicle becomes an important discovery.

We should not make the opening frustrating. We should make it memorable.

### Problem 4: Cooperative vehicles are not yet sufficiently differentiated

The vehicles currently provide different stats and seat configurations, but we need to develop them into distinct gameplay experiences.

For example:

| Vehicle | Intended gameplay identity |
|---|---|
| Personal scooter | Fast exploration, limited protection, one rider |
| Two-person submersible | Pilot and weapons operator |
| Salvage submarine | Pilot, weapons operator and engineer |
| Heavy combat submarine | Multiple crew members, heavy weapons and defensive systems |
| Deep-sea exploration vessel | Long-range exploration, sonar, scanning and advanced life support |

A vehicle should change how players interact with the world, not merely how fast they move.

We also need to test the full vehicle failure loop: damage, warning, system failure, evacuation, swimming to safety, and finding or repairing another vehicle.

### Problem 5: The map is not yet a navigation system

The current Chart is essentially an exploration-progress display. It shows explored portions of each region and lists which regions are live or sealed.

That is not the navigation system we envisioned.

We need a proper map that can show:

- The player's current position.
- Discovered passages and unexplored passages.
- Region connections.
- Submerged facilities and settlements.
- Known vehicles and salvage sites.
- Oxygen and repair stations.
- Boss locations and active encounters.
- Locked routes and their requirements.
- Current objectives and optional discoveries.

The map should gradually reveal itself as the player explores.

It should become one of the game's most important tools, not simply a menu screen.

## 4. What is missing?

Here is the practical feature gap.

| System | Missing or underdeveloped functionality |
|---|---|
| World design | Branching routes, vertical exploration, hidden areas, richer environmental variation |
| Survival | More meaningful resource scarcity, equipment progression, environmental pressure systems |
| Vehicles | More vehicle classes, independent weapon aiming, deeper crew roles, advanced systems |
| Multiplayer | Dedicated authority, persistent world state, reconnection, player capacity and load testing |
| Shared encounters | Encounter persistence, rewards, encounter scaling, cross-group participation |
| Navigation | Actual navigable map, route discovery, markers, objectives and tracking |
| Combat | More attack patterns, weapon types, targeting, creature variety and cooperative tactics |
| Progression | Equipment upgrades, vehicle upgrades, crafting and resource economy |
| Story | Cinematic opening, character encounters, voice logs, environmental storytelling and major discoveries |
| Social systems | Player communication, crew invitations, joining vehicles, grouping and player identification |
| Audio | Region-specific soundscapes, spatial audio, underwater acoustics and richer warning cues |
| Accessibility | Control remapping, adjustable difficulty assistance, readable telegraphs and input options |
| Mobile | Proper touch controls, responsive camera, orientation support and mobile performance testing |
| Persistence | Account-based saves, cross-device progression and server-side world records |

One important distinction: some of these are missing from the supplied prototype, while others are only partially represented. For example, a shared boss exists, but a persistent shared-world encounter across independent groups does not.

## 5. What is actually going wrong in the current game?

I found several specific engineering and design concerns in the source.

### A. The multiplayer authority model is not strong enough for production

Player movement is largely owned by the player's own client and then transmitted to other players. The host resolves important world interactions, but the system is not a fully authoritative server.

The code also accepts player-state updates through the peer connection without the kind of server-side identity and action validation we would require for a production service.

This is acceptable for a cooperative prototype. It is not sufficient for a persistent online game where players, rewards, vehicle ownership and shared encounters must remain trustworthy.

### B. The host simulation has a single point of failure

The host-election logic is a useful experiment, but it does not replace server continuity.

If the host disconnects during a boss fight, vehicle transition or important world event, the game needs to preserve the encounter and recover cleanly.

A host migration should not be responsible for protecting the long-term state of the world.

### C. The game has no real game-specific automated test suite

The supplied `package.json` includes general application tests, typechecking and linting. It does not define a dedicated simulation or multiplayer test suite.

That means we do not yet have automated evidence for things such as:

- Whether vehicle seats remain consistent when players disconnect.
- Whether a vehicle can be destroyed while multiple players are aboard.
- Whether all players see the same boss health.
- Whether a player can cross a regional gate while another player remains behind.
- Whether pickups can be collected twice.
- Whether a boss encounter survives host disconnection.
- Whether oxygen and health remain synchronized.

These should become automated tests before we expand the game substantially.

I could inspect the source and packaged build artifacts, but the supplied archive does not include the dependencies needed to run a fresh build here. The included preview log also records a PGlite bootstrap failure caused by a missing packaged data file. I therefore would not claim that the current build has passed a fresh production build or runtime certification.

### D. The map is visually too abstract

The current map communicates progress, not geography.

It does not yet give players the spatial understanding needed to make meaningful exploration decisions.

### E. Combat needs more depth

The existing creature states and attack telegraphs are good foundations. But the combat system is still relatively simple.

The player should eventually have to make decisions about:

- Whether to fight or escape.
- Whether to conserve ammunition.
- Whether to protect the vehicle or attack the creature.
- Whether to split crew responsibilities.
- Whether to lure a creature into a better position.
- Whether to abandon a damaged vehicle.

The game needs more tactical choices, not simply more enemies.

## 6. Should we implement mobile-phone controls now?

**Yes. I recommend implementing the next-generation control architecture now, but I would not make the entire game mobile-first yet.**

There is a difference between adding a few touch buttons and designing a proper input system that supports PC, controllers and mobile devices.

The current prototype already has:
- A virtual movement stick.
- Rise and sink buttons.
- Fire and board buttons.
- Keyboard movement and actions.

That is a useful first attempt, but it is not a finished mobile control system.

### Problems with the current touch implementation

**1. The virtual joystick is too basic.**

It has no independently moving visual thumbstick, configurable sensitivity or meaningful dead-zone handling.

**2. There is no independent aiming control.**

This is particularly important for combat. We need to be able to swim in one direction while aiming and firing in another.

**3. Vehicle controls need their own layout.**

A diver, scooter pilot, submarine pilot, gunner and engineer should not all be forced to use the same control arrangement.

**4. The mobile display needs better handling.**

The canvas uses a fixed 512 × 288 internal resolution, but its CSS currently stretches it to fill its container. On a portrait phone, that can distort the intended 16:9 game presentation.

We should use aspect-ratio-aware scaling, proper letterboxing or a deliberately designed portrait layout, depending on the device.

**5. The interface needs to account for simultaneous touch input.**

A player should be able to steer, aim, fire and operate a vehicle without the controls interfering with one another.

### The mobile control system I recommend

I would implement an adaptive control interface with separate gameplay modes.

| Control | Function |
|---|---|
| Left virtual joystick | Swim or steer |
| Right virtual joystick | Aim weapons independently |
| Fire button | Fire weapon |
| Interact button | Board, exit, collect or activate |
| Repair button | Repair nearby vehicles |
| Special ability | Shield, sonar or vehicle-specific ability |
| Map button | Open navigation map |
| Crew button | Manage vehicle seats and crew |

The interface should change depending on what the player is doing.

**Swimming mode:** Movement, aiming, fire and interaction.

**Vehicle pilot mode:** Steering, propulsion, sonar and vehicle systems.

**Gunner mode:** Independent weapon aiming, targeting and firing.

**Engineer mode:** Repairs, defensive systems, energy management and emergency controls.

### What about PC?

We should not sacrifice the PC experience.

I recommend supporting three input systems through one shared input architecture:

1. Keyboard and mouse.
2. Xbox/PlayStation-style controllers.
3. Mobile touch controls.

All three should produce the same underlying gameplay commands. That prevents us from maintaining three separate gameplay systems.

**My recommendation:** build the input abstraction now, improve the existing touch controls, and certify mobile gameplay after the core multiplayer and vehicle systems are stable.

---

## 7. Recommended development roadmap

I would not immediately add more regions, creatures or vehicles. We need to strengthen the foundation first.

### Phase 1 — Correct the gameplay foundation

**Priority: Critical**

- Redesign the opening catastrophe and survival sequence.
- Improve the region layouts to support branching and vertical exploration.
- Rework movement and independent aiming.
- Improve swimming and vehicle handling.
- Establish consistent collision and hazard behavior.
- Improve the first vehicle discovery experience.
- Add meaningful survival pressure and resource decisions.

**Deliverable:** A much stronger single-region gameplay experience.

### Phase 2 — Build the actual multiplayer foundation

**Priority: Critical**

- Establish a dedicated authoritative simulation architecture.
- Separate player input from server-validated gameplay state.
- Implement persistent player identity and progression.
- Implement reliable regional state management.
- Add reconnection and recovery.
- Add server-side vehicle ownership and seat validation.
- Add shared encounter persistence.
- Test simultaneous players in multiple regions.

**Deliverable:** Two or more players can reliably share the world, travel independently and participate in the same encounter.

Do not abandon the current WebRTC work. It is useful as a prototype and as a reference for cooperative interaction. But we should not build the production world around its host-elected architecture.

### Phase 3 — Make cooperative vehicles a signature feature

**Priority: High**

Expand the existing vehicle system:

- Two-person submersibles.
- Three-person salvage submarines.
- Heavy cooperative combat submarines.
- Advanced exploration vehicles.
- Independent gunner aiming.
- Engineer-specific controls.
- Vehicle system failures.
- Emergency evacuation.
- Crew changes and disconnect recovery.

**Deliverable:** A vehicle experience that genuinely requires and rewards cooperation.

### Phase 4 — Build the real underwater world

**Priority: High**

Expand the existing five regions into a connected network of explorable environments.

I would develop these environments:

1. Destroyed Energy Facility.
2. Abyssal Plains.
3. Submerged Civilization.
4. Industrial Depths.
5. Living Reef.
6. Abyssal Trench.
7. Upper Ocean.
8. Surface Frontier.

Each region should have its own:
- Environmental identity.
- Aquatic creatures.
- Navigation challenges.
- Hidden locations.
- Vehicles and salvage.
- Story discoveries.
- Regional encounters.

The world should feel like one enormous underwater mystery, even though its regions are simulated independently.

### Phase 5 — Develop the shared encounter system

**Priority: High**

The Lantern Maw is a useful first boss, but we need to turn the encounter system into a reusable multiplayer feature.

Build:
- Shared boss health.
- Server-authoritative damage.
- Multiple attack patterns.
- Target selection.
- Cooperative combat roles.
- Encounter persistence.
- Reward distribution.
- Player contribution tracking.
- Scaling for different group sizes.
- Multiple simultaneous regional encounters.

The important goal is that players can encounter a boss together without having to be in the same private instance or even have started the encounter at the same time.

### Phase 6 — Navigation, progression and mobile

**Priority: Medium to high**

- Complete the interactive navigation map.
- Add route discovery and objective tracking.
- Add player equipment progression.
- Add vehicle upgrades.
- Add crafting and salvage.
- Implement the adaptive input system.
- Improve controller support.
- Test phone and tablet layouts.
- Profile performance on lower-powered devices.

---

## 8. What I would change about the next prototype

I would make the next build a **multiplayer vertical slice**, not an attempt to complete the entire game.

It should contain:

| Feature | Required result |
|---|---|
| Opening sequence | Player survives the power-plant catastrophe |
| Survival | Oxygen, health, pickups and environmental hazards |
| Exploration | One substantial region with multiple routes |
| Vehicle | A working two-person submarine |
| Crew | One player pilots, another operates weapons |
| Vehicle damage | Damage, system failure and evacuation |
| Creature combat | Several readable enemy behaviors |
| Boss | One shared multiplayer boss encounter |
| Multiplayer | At least four real connected players |
| Multiple regions | Players can occupy different regions |
| Shared world | Players see consistent vehicles, enemies and encounter state |
| Navigation | Functional map with discovered passages and objectives |
| Persistence | Player progress survives disconnects and reconnects |
| Controls | Keyboard, controller and improved touch input |

I would specifically test the following scenario:

- Player A and Player B discover and operate a submarine together.
- Player A pilots while Player B operates the weapons.
- Player C explores independently in another region.
- Player D discovers another vehicle.
- Players A and B encounter a boss.
- Player C can join the encounter by traveling into that region.
- The boss remains active and its health is consistent for everyone.
- The submarine becomes critically damaged.
- The crew evacuates.
- The players survive, recover another vehicle and continue exploring.

If that experience works reliably, we will have demonstrated the core identity of the game.

---

## 9. My final recommendation

I believe this project is worth continuing.

The prototype has established several things we should preserve:

- The atmospheric pixel-art direction.
- The underwater survival foundation.
- The vehicle concepts.
- The cooperative crew system.
- The environmental storytelling.
- The shared boss concept.
- The regional world structure.

But I would make three major strategic decisions now:

**First: Do not turn this into a conventional side-scrolling shooter.** The game should remain an underwater exploration and survival experience, with combat serving the exploration rather than defining the entire game.

**Second: Do not mistake peer-to-peer co-op for the multiplayer world we envisioned.** The production architecture needs persistent, authoritative regional simulation.

**Third: Do not expand content faster than we improve the underlying gameplay.** More vehicles and creatures will not fix a weak navigation system, limited level design or unreliable multiplayer.

### My proposed immediate next step

I would commission a focused **Prototype 02 — Foundation Rebuild** with five workstreams:

1. Gameplay and world-layout improvements.
2. Multiplayer architecture and synchronization.
3. Cooperative vehicle systems.
4. Navigation and exploration.
5. Adaptive PC, controller and mobile controls.

The first goal should be to make one underwater region exceptionally good and demonstrate that the multiplayer experience works. Then we expand the world.

**The game we are trying to build is not simply a diver swimming through underwater levels. It is a living underwater world where survival, exploration, discovery, vehicles and cooperation create stories between players.**

That is the ambition we should protect as development continues.

# Abyssal — missing systems checklist

Status after the expedition-loop layer. Checked items are in the build.
Unchecked items are still missing or unverified. A unit test is not a
two-browser session and not a Railway certification.

Held on purpose: no Arctic, no playable surface, no 2.5D renderer.

## Already in this build

- [x] Suit counters stay live: oxygen, hull, darts, cells.
- [x] 20-slot pack holds surplus supplies, one slide, and scrap.
- [x] Breach save station pins the return beacon, heals, then waits.
- [x] Breach locker holds eight named stacks. G still moves the first or the last.
- [x] Breach desk files one slide. The archive reopens a filed slide.
- [x] Blackout spills one supply stack at the body, keeps the slide, and does not clear the pin.
- [x] A station panel can recover, file, stow, and withdraw while the dive keeps running.
- [x] The panel distinguishes the beacon pin from the browser file and the server ocean.
- [x] Salvage powers one recovery at a dark save station. The breach refuge does not require it.
- [x] Plains has one save station, one desk, and its own locker. The desk wakes when that grid is restored.
- [x] Mobile can draw, stow, and withdraw on the same ocean intent, and can see the pin.
- [x] Shared creature drops, conditional wildlife, adrift shelf, and old saves still load.
- [x] An automated ocean test shares the breach locker between two divers.
- [x] The loft remains first while the diver is still in the breach. The surface stays sealed.

## 1. First expedition loop

- [ ] Play one full breach on this build: pack a surplus, pin the beacon, file the slide, reach the loft, black out, return, and pick the spilled stack back up.
- [ ] Tune only the numbers that fail that run.
- [ ] Finish the browser save, leave, and resume walkthrough.

## 2. Death and the pack

- [x] On blackout, spill one supply stack at the body.
- [x] Keep the slide.
- [x] Leave scrap with the diver.
- [x] Respawn at the pinned beacon.
- [x] Do not clear the pin on a normal death.
- [x] Name the loss in the blackout toast.
- [x] Regression covers the spill, the slide, and the beacon.
- [ ] A full expedition wipe is still not a rule. Do not add one until the loop has been played.

## 3. Station interaction

- [x] One station panel while the diver is in range. The dive does not pause.
- [x] Recover, stow, withdraw, and file.
- [x] Recover keeps the twenty-second cooldown and still pins the beacon.
- [x] Stow and withdraw name the stack.
- [x] The panel states beacon, browser file, and server ocean separately.
- [ ] The panel cannot prove the server accepted the ocean until a live sync is watched.

## 4. What carried items are for

- [x] A filed slide reopens from the archive.
- [x] Filing does not change the loft-first objective.
- [x] Scrap powers one dark save-station recovery.
- [x] An unpowered plains station says what it needs.
- [ ] No new pack kind until this loop has been played.

## 5. Station network

- [x] One save station and one desk in the plains, after the breach pair.
- [x] The plains locker is its own locker.
- [x] A new pin replaces the old one only when the diver uses that station.
- [x] Blackout returns to the last pin.
- [ ] City, works, and reef still have no save station or desk.

## 6. Mobile companion

- [x] Pack occupancy and the pinned beacon.
- [x] Draw one packed supply into the suit.
- [x] Stow and withdraw a named stack.
- [x] File stays on Use at the desk. Same ocean intent. No second ruleset.
- [ ] A readable `+not-found.tsx` still depends on the file mount. The repo already contains it.

## 7. Shared ocean proof

- [x] Automated test: two divers, one breach locker, stow and withdraw.
- [ ] Two signed-in browsers in the breach at the same time.
- [ ] Both see the same locker, the same drop, and the same Maw.
- [ ] One diver goes adrift. The other keeps simulating. Return without a duplicate. Already unit-tested. Not browser-tested.
- [ ] A healthy diver's hull and air survive a controlled Railway web restart.
- [ ] No PostgreSQL restart, disaster recovery, or capacity test. Do not claim those.

## 8. Living ocean, still unfinished

- [x] One repaired plains grid wakes that district's desk.
- [ ] Restoration, noise, and wildlife return stay the systems they are. No new species in this pass.
- [ ] A second diver can read the woken desk in a real two-browser session. The record is shared once it is filed. That sharing is not browser-certified.
- [ ] Empty sectors stay asleep. Offline time must not simulate the whole ocean.

## 9. Held until the expedition is convincing

- [ ] Playable surface or trench.
- [ ] Arctic or any region beyond the five already in the world.
- [ ] A 2.5D or 3D renderer.
- [ ] Species photography, sonar as a profession, or a new vehicle class.
- [ ] Unrestricted creature AI, structural collapse, and continuous offline ecology.

## Order

1. Play the breach, including the spill and the station panel.
2. Two browsers, then one healthy Railway restart.
3. Only then a station pair in the city.
4. Only then a wider ocean.

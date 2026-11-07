import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hurtDiver, createSim, findDiver, nearestStation, objective, pressPack, pressStow, pressUse, pressWithdraw, stepSim } from "./sim.ts";
import { TILE, ZONES } from "./types.ts";
import { understanding } from "./understanding.ts";
import { archiveOf, casesClosedBy, mawStages } from "./archive.ts";
import { createOpening, stepOpening } from "./opening.ts";
import { stepVision, visionDone } from "./vision.ts";
import { buildLayout, isSolid } from "./world.ts";
import { stow } from "./pack.ts";
import { applySave, type SaveFile } from "./persist.ts";

describe("abyssal sim", () => {
  it("opens alone, short on air, and points at the loft canister", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    assert.equal(sim.divers.length, 1);
    assert.equal(you.o2, 70);
    assert.match(objective(sim, you), /loft/i);
    const layout = buildLayout();
    const can = layout.pickups.find((pickup) => pickup.id === "o2-a");
    assert.ok(can);
    assert.ok(can.y < 4 * TILE);
    assert.equal(isSolid(layout.regions.breach, can.x + 4, can.y + 4, false), false);
    assert.equal(isSolid(layout.regions.breach, can.x + 4, 4, false), true);
    assert.equal(isSolid(layout.regions.breach, 20 * TILE + 8, 3 * TILE + 8, false), false);
  });

  it("fires a harpoon along aim, not along facing", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    you.facing = 1;
    you.ay = 0;
    you.aimX = 0;
    you.aimY = -1;
    you.fireLatch = true;
    stepSim(sim, 1 / 60, true, "a");
    const shot = sim.projectiles.find((projectile) => projectile.kind === "harpoon");
    assert.ok(shot);
    assert.ok(shot.vy < -200);
    assert.ok(Math.abs(shot.vx) < 40);
  });

  it("does not put two divers in the same seat", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: true, soren: false });
    const you = findDiver(sim, "a");
    const imani = sim.divers.find((diver) => diver.kind === "partner");
    const scooter = sim.vehicles.find((vehicle) => vehicle.id === "scooter-1");
    assert.ok(you && imani && scooter);
    you.x = scooter.x;
    you.y = scooter.y;
    imani.x = scooter.x + 8;
    imani.y = scooter.y;
    pressUse(sim, you);
    pressUse(sim, imani);
    assert.equal(you.seat, "pilot");
    assert.equal(imani.vehicleId, null);
    assert.equal(scooter.seats.pilot, you.id);
    assert.equal(scooter.seats.gunner, null);

    const kite = sim.vehicles.find((vehicle) => vehicle.id === "kite-1");
    assert.ok(kite);
    pressUse(sim, you);
    you.region = "plains";
    imani.region = "plains";
    you.x = kite.x;
    you.y = kite.y;
    imani.x = kite.x + 8;
    imani.y = kite.y;
    pressUse(sim, you);
    pressUse(sim, imani);
    assert.equal(you.seat, "pilot");
    assert.equal(imani.seat, "gunner");
    assert.notEqual(kite.seats.pilot, kite.seats.gunner);
    assert.equal(kite.seats.engineer, null);
  });

  it("grants a pickup once", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const can = sim.pickups.find((pickup) => pickup.id === "o2-a");
    assert.ok(you && can);
    you.x = can.x;
    you.y = can.y;
    you.o2 = 10;
    stepSim(sim, 1 / 60, true, "a");
    assert.equal(can.taken, true);
    const after = you.o2;
    assert.ok(after > 50 && after < 70);
    stepSim(sim, 1 / 60, true, "a");
    assert.equal(can.taken, true);
    assert.ok(you.o2 < after);
  });

  it("drains oxygen and applies a hit", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    const start = you.o2;
    for (let i = 0; i < 60; i += 1) stepSim(sim, 1 / 60, true, "a");
    assert.ok(you.o2 < start - 4);
    const hp = you.hp;
    hurtDiver(sim, you.id, 25);
    assert.ok(you.hp <= hp - 25);
  });

  it("hurts the Lantern Maw more while the mouth is open", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const maw = sim.creatures.find((creature) => creature.kind === "maw");
    assert.ok(you && maw);
    you.region = maw.region;
    you.x = maw.x - 24;
    you.y = maw.y;
    you.aimX = 1;
    you.aimY = 0;
    you.facing = 1;
    you.fireLatch = true;
    maw.aggro = true;
    maw.state = "open";
    maw.timer = 1.2;
    const full = maw.hp;
    stepSim(sim, 1 / 60, true, "a");
    const openLoss = full - maw.hp;
    maw.hp = full;
    maw.alive = true;
    maw.aggro = true;
    maw.state = "warn";
    maw.timer = 1.2;
    you.fireCd = 0;
    you.ammo += 1;
    you.x = maw.x - 24;
    you.y = maw.y;
    you.fireLatch = true;
    stepSim(sim, 1 / 60, true, "a");
    const shutLoss = full - maw.hp;
    assert.ok(openLoss > 20);
    assert.ok(openLoss > shutLoss * 1.5);
  });

  it("earns understanding from the dive, and does not lock the loft", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    assert.equal(understanding(sim, you).id, "catastrophe");
    assert.match(objective(sim, you), /loft/i);

    const can = sim.pickups.find((pickup) => pickup.id === "o2-a");
    assert.ok(can);
    can.taken = true;
    assert.equal(understanding(sim, you).id, "salvage");

    sim.discovered.push("breach-blackbox");
    assert.equal(understanding(sim, you).id, "discovery");

    sim.flags.scooterSeen = true;
    assert.equal(understanding(sim, you).id, "vehicle");
    assert.equal(you.region, "breach");

    you.region = "plains";
    assert.equal(understanding(sim, you).id, "encounter");
    you.region = "breach";
    sim.explored.plains[0] = 1;
    assert.equal(understanding(sim, you).id, "encounter");

    sim.flags.mawDead = true;
    assert.equal(understanding(sim, you).id, "return");
    assert.equal(understanding(sim, you).index, 5);
  });

  it("keeps the highest understanding when a later step happens first", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    sim.flags.mawDead = true;
    assert.equal(understanding(sim, you).id, "return");

    const early = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const diver = findDiver(early, "a");
    assert.ok(diver);
    early.discovered.push("breach-order");
    assert.equal(understanding(early, diver).id, "discovery");
    assert.equal(understanding(early, diver).index > 1, true);
  });

  it("reconstructs an investigation only when every piece is known, and does not lock the loft", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    assert.match(objective(sim, you), /loft/i);
    const fresh = archiveOf([]);
    assert.equal(fresh.closed, 0);
    assert.equal(fresh.timeline[0]?.known, true);
    assert.equal(fresh.timeline[1]?.known, false);

    const partial = archiveOf(["breach-blackbox", "breach-order"]);
    const heart = partial.cases.find((item) => item.id === "heart");
    assert.ok(heart);
    assert.equal(heart.closed, false);
    assert.equal(heart.have, 2);
    assert.equal(understanding(sim, you).id, "catastrophe");

    sim.discovered.push("breach-loft");
    assert.equal(understanding(sim, you).id, "catastrophe");
    const named = archiveOf(sim.discovered);
    assert.equal(named.timeline.find((beat) => beat.id === "lived")?.known, true);
    assert.equal(named.stations.some((station) => station.read && station.id === "breach-loft"), true);

    const closed = casesClosedBy(["breach-blackbox", "breach-order"], "works-vent");
    assert.equal(closed.length, 1);
    const done = archiveOf(["breach-blackbox", "breach-order"], ["breach-blackbox", "breach-order", "works-vent"]);
    assert.equal(done.cases.find((item) => item.id === "heart")?.closed, true);
    assert.equal(done.stations.find((station) => station.id === "works-vent")?.read, false);
  });

  it("walks the warning into the blast, and the sonar is not yet the accident", () => {
    let still = createOpening();
    for (let i = 0; i < 400; i++) still = stepOpening(still, 0.05, 0);
    assert.equal(still.done, true);
    assert.equal(still.beat, "wake");

    let walked = createOpening();
    for (let i = 0; i < 40; i++) walked = stepOpening(walked, 0.05, 1);
    assert.equal(walked.beat === "deck", false);
    const sealed = stepOpening({ beat: "alarm", x: 400, t: 1.2, flood: 0, done: false }, 0.05, 1);
    assert.ok(sealed.x <= 330);

    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    sim.discovered.push("breach-sonar");
    assert.equal(understanding(sim, you).id, "catastrophe");
    assert.match(objective(sim, you), /loft/i);
    const stages = mawStages(sim.discovered);
    assert.equal(stages.find((stage) => stage.id === "signs")?.known, true);
    assert.equal(stages.find((stage) => stage.id === "why")?.known, false);
    sim.discovered.push("breach-shadow");
    assert.equal(understanding(sim, you).id, "catastrophe");
    let plate = 0;
    while (!visionDone(plate)) plate = stepVision(plate, 0.05);
    assert.ok(plate >= 7);
    assert.equal(ZONES.find((zone) => zone.id === "surface")?.state, "sealed");
    const sonar = sim.markers.find((marker) => marker.logId === "breach-sonar");
    assert.ok(sonar);
    assert.equal(isSolid(sim.regions.breach, sonar.x, sonar.y, false), false);
  });

  it("stows overflow when the suit is already full", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const can = sim.pickups.find((pickup) => pickup.id === "o2-a");
    assert.ok(you && can);
    you.o2 = you.o2Max;
    you.x = can.x;
    you.y = can.y;
    stepSim(sim, 0, true, "a");
    assert.equal(can.taken, true);
    assert.equal(you.o2, you.o2Max);
    assert.equal(you.pack.find((slot) => slot?.kind === "o2")?.amount, 4);
    you.ammo = 0;
    const index = you.pack.findIndex((slot) => !slot);
    stow(you.pack, "ammo", 2);
    pressPack(sim, you, you.pack.findIndex((slot) => slot?.kind === "ammo"));
    assert.equal(you.ammo, 4);
    assert.equal(index >= 0, true);
  });

  it("pins the save beacon, restores air, and comes back there", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const station = sim.markers.find((marker) => marker.id === "save-breach");
    const desk = sim.markers.find((marker) => marker.id === "info-breach");
    assert.ok(you && station && desk);
    assert.equal(isSolid(sim.regions.breach, station.x, station.y, false), false);
    assert.equal(isSolid(sim.regions.breach, desk.x, desk.y, false), false);
    you.x = station.x;
    you.y = station.y;
    you.hp = 20;
    you.o2 = 10;
    pressUse(sim, you);
    assert.equal(you.pinned, true);
    assert.equal(you.beaconRegion, "breach");
    assert.equal(you.beaconX, station.x);
    assert.equal(you.hp, 56);
    assert.equal(you.o2, 52);
    const held = you.hp;
    pressUse(sim, you);
    assert.equal(you.hp, held);
    stow(you.pack, "scrap", 2);
    pressStow(sim, you);
    assert.equal(you.pack.some((slot) => slot?.kind === "scrap"), false);
    assert.equal(sim.lockers["save-breach"].some((slot) => slot?.kind === "scrap"), true);
    you.region = "plains";
    you.x = 400;
    you.y = 200;
    you.hp = 1;
    you.iframe = 0;
    hurtDiver(sim, you.id, 20);
    assert.equal(you.alive, false);
    for (let i = 0; i < 200 && !you.alive; i += 1) stepSim(sim, 1 / 60, true, "a");
    assert.equal(you.alive, true);
    assert.equal(you.region, "breach");
    assert.equal(you.x, station.x);
    assert.equal(you.y, station.y);
  });

  it("files a glass slide at the information desk", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const desk = sim.markers.find((marker) => marker.id === "info-breach");
    assert.ok(you && desk);
    you.x = desk.x;
    you.y = desk.y;
    pressUse(sim, you);
    assert.ok(sim.discovered.includes("breach-desk"));
    assert.ok(sim.discovered.includes("breach-slide"));
    assert.equal(you.pack.some((slot) => slot?.kind === "sample"), true);
    pressUse(sim, you);
    assert.equal(you.pack.some((slot) => slot?.kind === "sample"), false);
    assert.ok(sim.discovered.includes("sample:breach"));
    assert.ok(sim.shared.includes("sample:breach"));
    assert.match(objective(sim, you), /loft/i);
  });

  it("loads an older save that has no pack", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    const file: SaveFile = {
      version: 2,
      time: 12,
      you: { region: "city", x: 80, y: 90, hp: 40, o2: 33, ammo: 3, cells: 1 },
      discovered: ["breach-loft"],
      explored: sim.explored,
      flags: sim.flags,
      taken: [],
      vehicles: [],
      creatures: [],
      drops: [],
    };
    applySave(sim, "a", file);
    assert.equal(you.region, "city");
    assert.equal(you.hp, 40);
    assert.equal(you.pack.length, 20);
    assert.equal(you.pack.every((slot) => slot === null), true);
    assert.equal(you.pinned, false);
    stow(you.pack, "cell", 1);
    const kept: SaveFile = {
      ...file,
      you: { ...file.you, pack: you.pack, pinned: true, beaconRegion: "breach", beaconX: 320, beaconY: 288 },
      lockers: { "save-breach": you.pack.map((slot) => (slot ? { ...slot } : null)) },
    };
    const next = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    applySave(next, "a", kept);
    const restored = findDiver(next, "a");
    assert.ok(restored);
    assert.equal(restored.pinned, true);
    assert.equal(restored.beaconX, 320);
    assert.equal(restored.pack.some((slot) => slot?.kind === "cell"), true);
    assert.equal(next.lockers["save-breach"].some((slot) => slot?.kind === "cell"), true);
  });

  it("spills one supply stack on blackout and keeps the slide", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const station = sim.markers.find((marker) => marker.id === "save-breach");
    assert.ok(you && station);
    stow(you.pack, "o2", 2);
    stow(you.pack, "sample", 1);
    you.pinned = true;
    you.beaconRegion = "breach";
    you.beaconX = station.x;
    you.beaconY = station.y;
    you.region = "plains";
    you.x = 400;
    you.y = 200;
    you.hp = 1;
    you.iframe = 0;
    hurtDiver(sim, you.id, 20);
    assert.equal(you.alive, false);
    assert.equal(you.pinned, true);
    assert.equal(you.pack.some((slot) => slot?.kind === "o2"), false);
    assert.equal(you.pack.some((slot) => slot?.kind === "sample"), true);
    const spill = sim.pickups.find((pickup) => pickup.stack);
    assert.ok(spill);
    assert.equal(spill.kind, "o2");
    assert.equal(spill.amount, 2);
    assert.equal(spill.region, "plains");
    assert.match(sim.toasts[0]?.text ?? "", /Lost 2 oxygen/);
    for (let i = 0; i < 200 && !you.alive; i += 1) stepSim(sim, 1 / 60, true, "a");
    assert.equal(you.alive, true);
    assert.equal(you.region, "breach");
    assert.equal(you.x, station.x);
    assert.equal(you.pack.some((slot) => slot?.kind === "sample"), true);
    assert.equal(sim.pickups.some((pickup) => pickup.stack && !pickup.taken), true);
  });

  it("names a locker stack and wakes the plains desk", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const save = sim.markers.find((marker) => marker.id === "save-plains");
    const desk = sim.markers.find((marker) => marker.id === "info-plains");
    const repair = sim.markers.find((marker) => marker.id === "m9");
    assert.ok(you && save && desk && repair);
    assert.equal(isSolid(sim.regions.plains, save.x, save.y, false), false);
    assert.equal(isSolid(sim.regions.plains, desk.x, desk.y, false), false);
    you.region = "plains";
    you.x = save.x;
    you.y = save.y;
    you.hp = 20;
    you.o2 = 10;
    stow(you.pack, "ammo", 2);
    stow(you.pack, "scrap", 1);
    const scrapAt = you.pack.findIndex((slot) => slot?.kind === "scrap");
    pressStow(sim, you, scrapAt);
    assert.equal(you.pack.some((slot) => slot?.kind === "ammo"), true);
    assert.equal(sim.lockers["save-plains"].some((slot) => slot?.kind === "scrap"), true);
    const lockerAt = sim.lockers["save-plains"].findIndex((slot) => slot?.kind === "scrap");
    pressWithdraw(sim, you, lockerAt);
    assert.equal(you.pack.some((slot) => slot?.kind === "scrap"), true);
    assert.equal(sim.lockers["save-plains"].some((slot) => slot?.kind === "scrap"), false);
    pressUse(sim, you);
    assert.equal(you.pinned, true);
    assert.equal(you.hp, 56);
    assert.equal(you.pack.some((slot) => slot?.kind === "scrap"), false);
    you.x = desk.x;
    you.y = desk.y;
    const before = sim.discovered.slice();
    pressUse(sim, you);
    assert.deepEqual(sim.discovered, before);
    you.cells = 1;
    you.x = repair.x;
    you.y = repair.y;
    pressUse(sim, you);
    assert.equal(sim.ecology.plains.powered, true);
    assert.ok(sim.discovered.includes("plains-signal"));
    you.x = desk.x;
    you.y = desk.y;
    pressUse(sim, you);
    assert.ok(sim.discovered.includes("plains-desk"));
    assert.ok(you.pack.some((slot) => slot?.kind === "sample"));
    pressUse(sim, you);
    assert.ok(sim.discovered.includes("sample:plains"));
    const filed = archiveOf(sim.discovered, sim.shared).stations.find((station) => station.id === "sample:plains");
    assert.match(filed?.body ?? "", /plains desk/);
    assert.equal(nearestStation(sim, you)?.id, "info-plains");
    you.region = "breach";
    assert.match(objective(sim, you), /loft/i);
  });

  it("files a slide as the desk that issued it", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const breachDesk = sim.markers.find((marker) => marker.id === "info-breach");
    const plainsDesk = sim.markers.find((marker) => marker.id === "info-plains");
    assert.ok(you && breachDesk && plainsDesk);
    you.x = breachDesk.x;
    you.y = breachDesk.y;
    pressUse(sim, you);
    assert.equal(you.pack.find((slot) => slot?.kind === "sample")?.from, "breach");
    sim.ecology.plains.powered = true;
    you.region = "plains";
    you.x = plainsDesk.x;
    you.y = plainsDesk.y;
    pressUse(sim, you);
    assert.ok(sim.discovered.includes("sample:breach"));
    assert.equal(sim.discovered.includes("sample:plains"), false);
    pressUse(sim, you);
    assert.equal(you.pack.find((slot) => slot?.kind === "sample")?.from, "plains");
  });

  it("does not burn salvage when the pumps are already full", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const save = sim.markers.find((marker) => marker.id === "save-plains");
    assert.ok(you && save);
    you.region = "plains";
    you.x = save.x;
    you.y = save.y;
    you.hp = you.hpMax;
    you.o2 = you.o2Max;
    stow(you.pack, "scrap", 1);
    pressUse(sim, you);
    assert.equal(you.pinned, true);
    assert.equal(you.pack.some((slot) => slot?.kind === "scrap"), true);
    assert.equal(sim.ecology.plains.powered, false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hurtDiver, createSim, findDiver, objective, pressUse, stepSim } from "./sim.ts";
import { TILE, ZONES } from "./types.ts";
import { understanding } from "./understanding.ts";
import { archiveOf, casesClosedBy, mawStages } from "./archive.ts";
import { createOpening, stepOpening } from "./opening.ts";
import { stepVision, visionDone } from "./vision.ts";
import { buildLayout, isSolid } from "./world.ts";

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
});

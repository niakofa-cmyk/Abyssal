import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Ocean } from "./ocean.ts";
import { TILE } from "./types.ts";
import { archiveOf } from "./archive.ts";

function intent(partial: Partial<{ ax: number; ay: number; aimX: number; aimY: number; fire: boolean; use: boolean }> = {}) {
  return { ax: 0, ay: 0, aimX: 1, aimY: 0, fire: false, ...partial };
}

describe("regional ocean", () => {
  it("keeps two sectors alive while a third stays asleep", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    ocean.place(bo, "works", 10 * TILE, 8 * TILE);
    const cityBefore = ocean.sectors.city.time;
    ocean.step(1 / 20);
    ocean.step(1 / 20);
    assert.ok(ocean.sectors.breach.time > 0);
    assert.ok(ocean.sectors.works.time > 0);
    assert.equal(ocean.sectors.city.time, cityBefore);
    assert.equal(ocean.locate(ada)?.region, "breach");
    assert.equal(ocean.locate(bo)?.region, "works");
    const adaSnap = ocean.snapshot(ada);
    const boSnap = ocean.snapshot(bo);
    assert.ok(adaSnap.divers.some((d) => d.name === "Bo") === false);
    assert.ok(boSnap.creatures.every((c) => c.region === "works"));
    assert.ok(adaSnap.creatures.every((c) => c.region === "breach"));
    assert.ok(adaSnap.roster.find((r) => r.id === "works")?.divers.some((d) => d.name === "Bo"));
    assert.ok(adaSnap.roster.find((r) => r.id === "breach")?.divers.some((d) => d.name === "Ada"));
    assert.match(adaSnap.toasts[0] ?? "", /east lock/);
  });

  it("restores a shelved diver at the saved position with the same life-support state", () => {
    const ocean = new Ocean();
    const token = ocean.join(null, "Persistence Probe");
    for (let i = 0; i < 12; i += 1) {
      ocean.setIntent(token, { ax: 1, ay: 0, aimX: 1, aimY: 0, fire: false, use: false, repair: false, cycle: false });
      ocean.step(1 / 20);
    }
    ocean.setIntent(token, { ax: 0, ay: 0, aimX: 1, aimY: 0, fire: false, use: false, repair: false, cycle: false });
    ocean.step(1 / 20);
    const saved = ocean.snapshot(token).you;
    const sweep = ocean.sweep(Date.now() + 95_001);
    assert.deepEqual(sweep, { changed: true, adrift: 1, shelved: 1 });
    assert.equal(ocean.locate(token), undefined, "an inactive return beacon is shelved");
    const restoredOcean = Ocean.revive(ocean.toBody());
    assert.equal(restoredOcean.locate(token), undefined, "the saved diver remains shelved after world reload");
    assert.equal(restoredOcean.join(token, "Persistence Probe"), token);
    const returned = restoredOcean.snapshot(token).you;
    assert.equal(returned.id, saved.id);
    assert.equal(returned.region, saved.region);
    assert.ok(Math.abs(returned.x - saved.x) < 0.01);
    assert.ok(Math.abs(returned.y - saved.y) < 0.01);
    assert.equal(returned.hp, saved.hp);
    assert.equal(returned.o2, saved.o2);
  });

  it("files the unnamed return without closing the heart", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    ocean.place(ada, "breach", 12.5 * TILE, 9 * TILE);
    ocean.step(1 / 20);
    const snap = ocean.snapshot(ada);
    assert.ok(snap.seen.includes("breach-sonar"));
    assert.ok(snap.toasts.some((line) => /crossed out the name/i.test(line)));
    const archive = archiveOf(snap.seen, snap.found);
    assert.equal(archive.timeline.find((beat) => beat.id === "sign")?.known, true);
    assert.equal(archive.cases.find((item) => item.id === "heart")?.closed, false);
  });

  it("shares one Maw and lets a late diver join the same fight", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const cee = ocean.join(null, "Cee");
    const maw = ocean.sectors.plains.creatures.find((c) => c.kind === "maw");
    assert.ok(maw);
    ocean.place(ada, "plains", maw.x - 24, maw.y);
    ocean.place(cee, "city", 12 * TILE, 8 * TILE);
    const before = maw.hp;
    const diver = ocean.locate(ada)!.diver;
    diver.aimX = 1;
    diver.aimY = 0;
    diver.fireLatch = true;
    diver.ammo = 8;
    ocean.step(1 / 20);
    assert.ok(maw.hp < before);
    const late = ocean.join(null, "Eve");
    ocean.place(late, "plains", maw.x - 40, maw.y + 10);
    const eve = ocean.snapshot(late);
    const boss = eve.roster.find((r) => r.id === "plains")?.boss;
    assert.ok(boss);
    assert.ok(boss.hp < boss.hpMax);
    assert.ok(eve.creatures.some((c) => c.id === "p-maw"));
    assert.ok(eve.divers.some((d) => d.name === "Ada"));
    assert.equal(ocean.snapshot(bo).creatures.some((c) => c.id === "p-maw"), false);
    assert.equal(ocean.snapshot(cee).creatures.some((c) => c.id === "p-maw"), false);
    const body = ocean.toBody();
    const revived = Ocean.revive(body);
    assert.ok(revived.sectors.plains.creatures.find((c) => c.id === "p-maw")!.hp < before);
    assert.equal(revived.locate(ada)?.region, "plains");
    assert.equal(revived.locate(bo)?.region, "breach");
  });

  it("closes an investigation from records no single diver has finished", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const blackbox = ocean.sectors.breach.markers.find((marker) => marker.logId === "breach-blackbox");
    const order = ocean.sectors.breach.markers.find((marker) => marker.logId === "breach-order");
    const vent = ocean.sectors.works.markers.find((marker) => marker.logId === "works-vent");
    assert.ok(blackbox && order && vent);
    ocean.place(ada, "breach", blackbox.x, blackbox.y);
    ocean.step(1 / 20);
    ocean.place(ada, "breach", order.x, order.y);
    ocean.step(1 / 20);
    ocean.place(bo, "works", vent.x, vent.y);
    ocean.step(1 / 20);
    const adaSnap = ocean.snapshot(ada);
    const boSnap = ocean.snapshot(bo);
    assert.equal(adaSnap.seen.includes("works-vent"), false);
    assert.equal(boSnap.seen.includes("breach-blackbox"), false);
    assert.ok(adaSnap.found.includes("works-vent"));
    const adaArchive = archiveOf(adaSnap.seen, adaSnap.found);
    const boArchive = archiveOf(boSnap.seen, boSnap.found);
    assert.equal(adaArchive.cases.find((item) => item.id === "heart")?.closed, true);
    assert.equal(boArchive.cases.find((item) => item.id === "heart")?.closed, true);
    assert.equal(boArchive.stations.find((station) => station.id === "breach-blackbox")?.read, false);
    assert.ok(adaSnap.toasts.some((line) => line.includes("heart was already failing")));
    assert.ok(boSnap.toasts.some((line) => line.includes("heart was already failing")));
    const revived = Ocean.revive(ocean.toBody());
    assert.ok(revived.found.includes("works-vent"));
    assert.ok(revived.found.includes("breach-blackbox"));
  });

  it("books a seat once and keeps the diver on reconnect", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const scooter = ocean.sectors.breach.vehicles.find((v) => v.id === "scooter-1");
    assert.ok(scooter);
    ocean.place(ada, "breach", scooter.x, scooter.y);
    ocean.place(bo, "breach", scooter.x + 12, scooter.y);
    ocean.setIntent(ada, intent({ use: true }));
    ocean.setIntent(bo, intent({ use: true }));
    assert.equal(scooter.seats.pilot, ada);
    assert.equal(ocean.locate(bo)?.diver.vehicleId, null);
    const hp = ocean.locate(ada)!.diver.hp;
    ocean.locate(ada)!.diver.hp = 41;
    const again = ocean.join(ada, "Ada");
    assert.equal(again, ada);
    assert.equal(ocean.locate(ada)?.diver.hp, 41);
    assert.equal(ocean.sectors.breach.divers.filter((d) => d.id === ada).length, 1);
    assert.equal(hp > 0, true);
  });

  it("crosses a gate without dropping the diver", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    ocean.place(ada, "breach", 131 * TILE, 9 * TILE);
    const diver = ocean.locate(ada)!.diver;
    diver.ax = 1;
    for (let i = 0; i < 40; i += 1) ocean.step(1 / 20);
    assert.equal(diver.region, "plains");
    assert.equal(ocean.locate(ada)?.region, "plains");
    assert.equal(ocean.sectors.breach.divers.some((d) => d.id === ada), false);
  });

  it("grants a canister once", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const can = ocean.sectors.breach.pickups.find((p) => p.id === "o2-a");
    assert.ok(can);
    const diver = ocean.locate(ada)!.diver;
    ocean.place(ada, "breach", can.x, can.y);
    diver.o2 = 10;
    ocean.step(1 / 20);
    assert.equal(can.taken, true);
    const mid = diver.o2;
    assert.ok(mid > 50);
    ocean.step(1 / 20);
    assert.ok(diver.o2 < mid);
  });

  it("splits the kite between helm and tube and refuses a third seat", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const cee = ocean.join(null, "Cee");
    const kite = ocean.sectors.plains.vehicles.find((v) => v.id === "kite-1");
    assert.ok(kite);
    ocean.place(ada, "plains", kite.x, kite.y);
    ocean.place(bo, "plains", kite.x + 10, kite.y);
    ocean.place(cee, "plains", kite.x + 20, kite.y);
    ocean.setIntent(ada, intent({ use: true }));
    ocean.setIntent(bo, intent({ use: true }));
    ocean.setIntent(cee, intent({ use: true }));
    assert.equal(kite.seats.pilot, ada);
    assert.equal(kite.seats.gunner, bo);
    assert.equal(ocean.locate(cee)?.diver.vehicleId, null);
    ocean.setIntent(ada, intent({ ax: 1, fire: true }));
    ocean.setIntent(bo, intent({ ax: -1, fire: true, aimX: 1, aimY: 0 }));
    ocean.step(1 / 20);
    assert.ok(kite.vx > 0);
    const shots = ocean.sectors.plains.projectiles.filter((shot) => shot.kind === "torpedo");
    assert.equal(shots.length, 1);
    assert.equal(shots[0]?.ownerId, bo);
  });

  it("frees a quiet seat, sleeps that sector, and returns the same dive", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    ocean.place(bo, "works", 10 * TILE, 8 * TILE);
    const scooter = ocean.sectors.breach.vehicles.find((v) => v.id === "scooter-1");
    assert.ok(scooter);
    ocean.place(ada, "breach", scooter.x, scooter.y);
    ocean.setIntent(ada, intent({ use: true }));
    assert.equal(scooter.seats.pilot, ada);
    ocean.locate(ada)!.diver.hp = 55;
    ocean.sweep(Date.now() + 12_000);
    assert.equal(scooter.seats.pilot, null);
    assert.equal(ocean.locate(ada)?.diver.vehicleId, null);
    ocean.setIntent(bo, intent());
    const frozen = ocean.sectors.breach.time;
    ocean.step(1 / 20);
    assert.equal(ocean.sectors.breach.time, frozen);
    assert.ok(ocean.sectors.works.time > 0);
    ocean.setIntent(ada, intent({ use: true }));
    assert.equal(ocean.locate(ada)?.diver.hp, 55);
    assert.equal(scooter.seats.pilot, ada);
    ocean.sweep(Date.now() + 120_000);
    assert.equal(ocean.locate(ada), undefined);
    const reward = {
      id: "reward:remaining-hunter:60",
      region: "breach" as const,
      kind: "ammo" as const,
      x: 100,
      y: 200,
      amount: 4,
      reward: true,
      taken: false,
    };
    ocean.sectors.breach.pickups.push(reward);
    const body = ocean.toBody();
    assert.equal(body.v, 2);
    assert.deepEqual(body.sectors.breach.drops, [reward]);
    assert.equal(body.players.find((player) => player.token === ada)?.stash?.hp, 55);
    const revived = Ocean.revive(body);
    assert.deepEqual(revived.sectors.breach.pickups.filter((pickup) => pickup.reward), [reward]);
    assert.equal(revived.locate(ada), undefined);
    assert.equal(revived.join(ada, "Ada"), ada);
    assert.equal(revived.locate(ada)?.diver.hp, 55);
    assert.equal(revived.sectors.breach.divers.filter((diver) => diver.id === ada).length, 1);
    const legacy = structuredClone(body);
    legacy.v = 1;
    delete legacy.sectors.breach.drops;
    assert.deepEqual(Ocean.revive(legacy).sectors.breach.pickups.filter((pickup) => pickup.reward), []);
  });

  it("carries both kite seats through a gate without waking the city", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const kite = ocean.sectors.plains.vehicles.find((v) => v.id === "kite-1");
    assert.ok(kite);
    ocean.sectors.plains.vehicles = ocean.sectors.plains.vehicles.filter((vehicle) => vehicle.id !== "kite-1");
    kite.region = "breach";
    kite.x = 128 * TILE;
    kite.y = 9 * TILE;
    kite.vx = 0;
    kite.vy = 0;
    kite.facing = 1;
    ocean.sectors.breach.vehicles.push(kite);
    ocean.place(ada, "breach", kite.x, kite.y);
    ocean.place(bo, "breach", kite.x + 8, kite.y);
    ocean.setIntent(ada, intent({ use: true }));
    ocean.setIntent(bo, intent({ use: true }));
    assert.equal(kite.seats.gunner, bo);
    ocean.setIntent(ada, intent({ ax: 1 }));
    const city = ocean.sectors.city.time;
    for (let i = 0; i < 80; i += 1) ocean.step(1 / 20);
    assert.equal(ocean.locate(ada)?.region, "plains");
    assert.equal(ocean.locate(bo)?.region, "plains");
    assert.equal(ocean.sectors.plains.vehicles.some((vehicle) => vehicle.id === "kite-1"), true);
    assert.equal(ocean.sectors.breach.divers.some((diver) => diver.id === ada), false);
    assert.equal(ocean.sectors.city.time, city);
  });

  it("shares one Maw and opens the lock for a diver who was not there", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const maw = ocean.sectors.plains.creatures.find((creature) => creature.kind === "maw");
    assert.ok(maw);
    ocean.place(ada, "plains", maw.x - 20, maw.y);
    maw.hp = 1;
    maw.state = "open";
    const diver = ocean.locate(ada)!.diver;
    diver.aimX = 1;
    diver.aimY = 0;
    diver.ammo = 4;
    ocean.setIntent(ada, intent({ fire: true, aimX: 1, aimY: 0 }));
    ocean.step(1 / 20);
    ocean.step(1 / 20);
    assert.equal(maw.alive, false);
    assert.equal(ocean.flags.mawDead, true);
    const away = ocean.snapshot(bo);
    assert.equal(away.flags.mawDead, true);
    assert.equal(away.creatures.some((creature) => creature.id === "p-maw"), false);
    assert.equal(away.roster.find((row) => row.id === "plains")?.boss?.alive, false);
    const revived = Ocean.revive(ocean.toBody());
    assert.equal(revived.flags.mawDead, true);
    assert.equal(revived.sectors.plains.creatures.find((creature) => creature.id === "p-maw")?.alive, false);
    assert.equal(revived.locate(bo)?.region, "breach");
  });

  it("swims two divers onto separate loft canisters", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const first = ocean.sectors.breach.pickups.find((pickup) => pickup.id === "o2-a");
    const second = ocean.sectors.breach.pickups.find((pickup) => pickup.id === "o2-a2");
    assert.ok(first && second);
    assert.ok(first.y < 4 * TILE);
    assert.ok(Math.hypot(first.x - second.x, first.y - second.y) > 90);
    let adaAir = 0;
    let boAir = 0;
    const adaLoft: Array<[number, number]> = [[20 * TILE, 9 * TILE], [20 * TILE, 3 * TILE]];
    const boLoft: Array<[number, number]> = [[24 * TILE, 9 * TILE], [24 * TILE, 3 * TILE]];
    for (let i = 0; i < 20 * 16; i += 1) {
      const doneA = route(ocean, ada, adaLoft);
      const doneB = route(ocean, bo, boLoft);
      ocean.step(1 / 20);
      if (first.taken) adaAir = Math.max(adaAir, ocean.locate(ada)!.diver.o2);
      if (second.taken) boAir = Math.max(boAir, ocean.locate(bo)!.diver.o2);
      if (doneA && doneB && first.taken && second.taken) break;
    }
    const left = ocean.locate(ada)!.diver;
    const right = ocean.locate(bo)!.diver;
    assert.equal(first.taken, true, `Ada ${Math.round(left.x)},${Math.round(left.y)} o2 ${left.o2.toFixed(0)}`);
    assert.equal(second.taken, true, `Bo ${Math.round(right.x)},${Math.round(right.y)} o2 ${right.o2.toFixed(0)}`);
    assert.ok(adaAir > 55, `Ada air ${adaAir}`);
    assert.ok(boAir > 55, `Bo air ${boAir}`);
  });

  it("shares a scooter, a gate, a kite, and the Maw without a warp", () => {
    const ocean = new Ocean();
    const ada = ocean.join(null, "Ada");
    const bo = ocean.join(null, "Bo");
    const loft = [
      ocean.sectors.breach.pickups.find((pickup) => pickup.id === "o2-a")!,
      ocean.sectors.breach.pickups.find((pickup) => pickup.id === "o2-a2")!,
    ];
    for (let i = 0; i < 20 * 14 && (!loft[0].taken || !loft[1].taken); i += 1) {
      route(ocean, ada, [[20 * TILE, 9 * TILE], [loft[0].x, loft[0].y]]);
      route(ocean, bo, [[24 * TILE, 9 * TILE], [loft[1].x, loft[1].y]]);
      ocean.step(1 / 20);
    }
    assert.equal(loft[0].taken && loft[1].taken, true);

    const eel = ocean.sectors.breach.creatures.find((creature) => creature.id === "b-e1")!;
    const eelHp = eel.hp;
    for (let i = 0; i < 20 * 8; i += 1) {
      const foe = ocean.sectors.breach.creatures.find((creature) => creature.id === "b-e1");
      if (!foe?.alive) break;
      aimAt(ocean, ada, foe.x - 160, foe.y, foe.x, foe.y);
      aimAt(ocean, bo, foe.x + 140, foe.y, foe.x, foe.y);
      ocean.step(1 / 20);
    }
    const eelNow = ocean.sectors.breach.creatures.find((creature) => creature.id === "b-e1");
    assert.ok(!eelNow?.alive || eelNow.hp < eelHp, `eel ${eelNow?.hp}`);

    const scooter = ocean.sectors.breach.vehicles.find((vehicle) => vehicle.id === "scooter-1")!;
    const spare = ocean.sectors.breach.pickups.find((pickup) => pickup.id === "o2-b")!;
    const lane = (x: number): Array<[number, number]> => [[x, 9 * TILE]];
    let boarded = false;
    for (let i = 0; i < 20 * 24 && !boarded; i += 1) {
      const pilot = ocean.locate(ada)!.diver;
      if (!pilot.alive) {
        ocean.step(1 / 20);
        continue;
      }
      if (pilot.o2 < 34 && !spare.taken && !pilot.vehicleId) route(ocean, ada, [[spare.x, 9 * TILE], [spare.x, spare.y]]);
      else route(ocean, ada, [[scooter.x, 9 * TILE], [scooter.x, scooter.y]]);
      if (!pilot.vehicleId && Math.hypot(scooter.x - pilot.x, scooter.y - pilot.y) < 90) ocean.setIntent(ada, intent({ use: true }));
      const mate = ocean.locate(bo)!.diver;
      if (mate.alive) {
        if (mate.o2 < 38 && !spare.taken && pilot.vehicleId) route(ocean, bo, [[spare.x, 9 * TILE], [spare.x, spare.y]]);
        else route(ocean, bo, lane(64 * TILE));
      }
      ocean.step(1 / 20);
      boarded = ocean.locate(ada)!.diver.vehicleId === "scooter-1";
    }
    assert.equal(ocean.locate(ada)!.diver.vehicleId, "scooter-1", where(ocean, ada));
    for (let i = 0; i < 20 * 12; i += 1) {
      const mate = ocean.locate(bo)!.diver;
      if (!mate.alive) {
        ocean.step(1 / 20);
        continue;
      }
      if (Math.hypot(scooter.x - mate.x, scooter.y - mate.y) < 70) break;
      route(ocean, bo, [[scooter.x, 9 * TILE], [scooter.x, scooter.y + 28]]);
      ocean.step(1 / 20);
    }
    ocean.setIntent(bo, intent({ use: true }));
    assert.equal(ocean.locate(bo)!.diver.vehicleId, null, where(ocean, bo));
    assert.ok(Math.hypot(scooter.x - ocean.locate(bo)!.diver.x, scooter.y - ocean.locate(bo)!.diver.y) < 100, where(ocean, bo));

    let split = false;
    for (let i = 0; i < 20 * 26; i += 1) {
      const pilot = ocean.locate(ada)!.diver;
      if (pilot.region === "breach" && pilot.y < 8 * TILE) ocean.setIntent(ada, intent({ ay: 1 }));
      else ocean.setIntent(ada, intent({ ax: 1, ay: pilot.y > 11 * TILE ? -1 : pilot.y < 8 * TILE ? 1 : 0 }));
      const mate = ocean.locate(bo)!.diver;
      if (mate.region === "breach" && mate.alive) {
        const cache = ocean.sectors.breach.pickups.find((pickup) => pickup.id === "o2-d");
        if (cache && !cache.taken) route(ocean, bo, [[cache.x, 9 * TILE], [cache.x, cache.y]]);
        else ocean.setIntent(bo, intent({ ay: mate.y > 10 * TILE ? -1 : mate.y < 8 * TILE ? 1 : 0 }));
      }
      ocean.step(1 / 20);
      if (ocean.locate(ada)?.region === "plains" && ocean.locate(bo)?.region === "breach") {
        split = true;
        break;
      }
    }
    assert.equal(split, true, `${where(ocean, ada)} / ${where(ocean, bo)}`);
    const adaSnap = ocean.snapshot(ada);
    const boSnap = ocean.snapshot(bo);
    assert.equal(adaSnap.divers.some((diver) => diver.name === "Bo"), false);
    assert.equal(boSnap.creatures.some((creature) => creature.id === "p-maw"), false);
    assert.equal(adaSnap.creatures.some((creature) => creature.id === "p-maw"), true);
    const boMark = ocean.locate(bo)!.diver.x;
    ocean.setIntent(ada, intent());
    ocean.setIntent(bo, intent({ ax: -1 }));
    for (let i = 0; i < 20; i += 1) ocean.step(1 / 20);
    assert.ok(ocean.locate(bo)!.diver.x < boMark - 8, where(ocean, bo));
    assert.equal(ocean.sectors.city.time, 0);

    const hull = ocean.sectors.plains.vehicles.find((vehicle) => vehicle.id === "kite-1");
    assert.ok(hull);
    for (let i = 0; i < 20 * 36; i += 1) {
      const pilot = ocean.locate(ada)!.diver;
      if (pilot.alive && pilot.vehicleId === "scooter-1") {
        const dx = hull.x - pilot.x;
        const dy = hull.y - pilot.y;
        ocean.setIntent(ada, intent({
          ax: Math.abs(dx) < 36 ? 0 : Math.sign(dx),
          ay: Math.abs(dy) < 28 ? 0 : Math.sign(dy),
        }));
      } else if (pilot.alive) ocean.setIntent(ada, intent());
      const mate = ocean.locate(bo)!.diver;
      if (mate.alive && mate.region === "breach") {
        const next = ["o2-c", "o2-e"]
          .map((id) => ocean.sectors.breach.pickups.find((pickup) => pickup.id === id))
          .find((pickup) => pickup && !pickup.taken && pickup.x > mate.x - 80);
        if (mate.o2 < 52 && next) route(ocean, bo, [[next.x, 9 * TILE], [next.x, next.y]]);
        else ocean.setIntent(bo, intent({ ax: 1, ay: mate.y > 10.5 * TILE ? -1 : mate.y < 8.5 * TILE ? 1 : 0 }));
      }
      ocean.step(1 / 20);
      if (ocean.locate(bo)?.region === "plains") break;
    }
    assert.equal(ocean.locate(bo)?.region, "plains", where(ocean, bo));
    assert.equal(ocean.snapshot(ada).divers.some((diver) => diver.name === "Bo"), true);

    if (ocean.locate(ada)!.diver.vehicleId && ocean.locate(ada)!.diver.vehicleId !== "kite-1") {
      ocean.setIntent(ada, intent({ use: true }));
    }
    for (let i = 0; i < 20 * 16; i += 1) {
      const pilot = ocean.locate(ada)!.diver;
      if (pilot.vehicleId === "kite-1") break;
      if (!pilot.alive) {
        ocean.step(1 / 20);
        continue;
      }
      if (Math.hypot(hull.x - pilot.x, hull.y - pilot.y) < 78) ocean.setIntent(ada, intent({ use: true }));
      else toward(ocean, ada, hull.x, hull.y);
      ocean.step(1 / 20);
    }
    assert.equal(ocean.locate(ada)!.diver.seat, "pilot", where(ocean, ada));
    for (let i = 0; i < 20 * 16; i += 1) {
      const mate = ocean.locate(bo)!.diver;
      if (!mate.alive) {
        ocean.step(1 / 20);
        continue;
      }
      if (mate.vehicleId === "kite-1") break;
      if (Math.hypot(hull.x - mate.x, hull.y - mate.y) < 78) ocean.setIntent(bo, intent({ use: true }));
      else toward(ocean, bo, hull.x, hull.y);
      ocean.step(1 / 20);
    }
    assert.equal(ocean.locate(bo)!.diver.seat, "gunner", where(ocean, bo));
    const movedFrom = hull.x;
    ocean.setIntent(ada, intent({ ax: 1 }));
    ocean.setIntent(bo, intent({ fire: true, aimX: 1, aimY: 0 }));
    ocean.step(1 / 20);
    ocean.step(1 / 20);
    ocean.step(1 / 20);
    assert.ok(hull.x > movedFrom + 4, `kite ${movedFrom} -> ${hull.x}`);

    const maw = ocean.sectors.plains.creatures.find((creature) => creature.kind === "maw")!;
    let seen = maw.hp;
    let best = maw.hp;
    for (let i = 0; i < 20 * 18; i += 1) {
      if (!maw.alive) break;
      const pilot = ocean.locate(ada)!.diver;
      const laneY = pilot.x < 108 * TILE ? 12 * TILE : maw.y;
      const ax = maw.x > pilot.x + 160 ? 1 : maw.x < pilot.x - 48 ? -1 : 0;
      const ay = laneY > pilot.y + 22 ? 1 : laneY < pilot.y - 22 ? -1 : 0;
      const dist = Math.hypot(maw.x - pilot.x, maw.y - pilot.y);
      ocean.setIntent(ada, intent({ ax, ay }));
      ocean.setIntent(bo, intent({
        fire: dist < 380,
        aimX: maw.x - pilot.x,
        aimY: maw.y - pilot.y,
      }));
      ocean.step(1 / 20);
      const now = Math.hypot(maw.x - ocean.locate(ada)!.diver.x, maw.y - ocean.locate(ada)!.diver.y);
      if (now < 520) seen = Math.max(seen, maw.hp);
      best = Math.min(best, maw.hp);
    }
    assert.ok(best < seen - 8, `maw ${seen} -> ${best} energy ${hull.energy.toFixed(0)} ${where(ocean, ada)}`);
    const chart = ocean.snapshot(ada);
    const explored = chart.explored.breach.filter(Boolean).length + chart.explored.plains.filter(Boolean).length;
    assert.ok(explored >= 2, `explored ${explored}`);
    const mark = ocean.locate(ada)!.diver;
    const revived = Ocean.revive(ocean.toBody());
    const back = revived.locate(ada)!.diver;
    assert.equal(back.region, mark.region);
    assert.ok(Math.abs(back.x - mark.x) < 80);
    const again = revived.snapshot(ada);
    const exploredBack = again.explored.breach.filter(Boolean).length + again.explored.plains.filter(Boolean).length;
    assert.ok(exploredBack >= explored);
  });
});

function where(ocean: Ocean, id: string) {
  const diver = ocean.locate(id)?.diver;
  if (!diver) return "missing";
  return `${diver.name} ${diver.region} ${Math.round(diver.x)},${Math.round(diver.y)} hp ${diver.hp.toFixed(0)} o2 ${diver.o2.toFixed(0)} alive ${diver.alive} seat ${diver.seat ?? "-"}`;
}

function aimAt(ocean: Ocean, id: string, tx: number, ty: number, aimX: number, aimY: number) {
  const diver = ocean.locate(id)?.diver;
  if (!diver?.alive) return;
  toward(ocean, id, tx, ty, true);
  diver.aimX = aimX - diver.x;
  diver.aimY = aimY - diver.y;
  diver.fireLatch = true;
}

const sticky = new Map<string, number>();

function route(ocean: Ocean, id: string, points: Array<[number, number]>, fire = false) {
  const diver = ocean.locate(id)?.diver;
  if (!diver?.alive) return false;
  const key = `${id}:${points.map((point) => `${point[0]},${point[1]}`).join(">")}`;
  let index = sticky.get(key) ?? 0;
  while (index < points.length - 1 && Math.hypot(points[index][0] - diver.x, points[index][1] - diver.y) < 36) index += 1;
  sticky.set(key, index);
  const goal = points[index]!;
  return toward(ocean, id, goal[0], goal[1], fire);
}

function toward(ocean: Ocean, id: string, tx: number, ty: number, fire = false) {
  const diver = ocean.locate(id)?.diver;
  if (!diver?.alive) return false;
  const dx = tx - diver.x;
  const dy = ty - diver.y;
  const dist = Math.hypot(dx, dy);
  const face = Math.abs(dx) > 8 ? Math.sign(dx) : diver.facing;
  if (dist < 18) {
    ocean.setIntent(id, intent({ fire, aimX: face, aimY: 0 }));
    return true;
  }
  const ax = Math.abs(dx) < 10 ? 0 : Math.sign(dx);
  const ay = Math.abs(dy) < 10 ? 0 : Math.sign(dy);
  const close = dist < 72;
  ocean.setIntent(
    id,
    intent({
      ax: close && Math.abs(dy) > Math.abs(dx) ? 0 : ax,
      ay: close && Math.abs(dx) >= Math.abs(dy) ? 0 : ay,
      aimX: face,
      aimY: Math.abs(dy) > 12 ? Math.sign(dy) : 0,
      fire,
    }),
  );
  return false;
}

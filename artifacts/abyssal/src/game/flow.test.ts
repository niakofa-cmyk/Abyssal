import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSim, findDiver, stepSim } from "./sim.ts";
import { noteWake, sampleCurrent, sampleFlow } from "./flow.ts";
import { TILE } from "./types.ts";

describe("current", () => {
  it("settles in a shaft instead of taking a shove on every tile", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    you.region = "city";
    you.x = 36 * TILE + TILE;
    you.y = 5 * TILE;
    you.vx = 0;
    you.vy = 0;
    you.ax = 0;
    you.ay = 0;
    you.o2 = 80;
    const current = sampleCurrent(sim, "city", you.x, you.y);
    assert.ok(current.y > 80, `shaft flow ${current.y}`);
    for (let i = 0; i < 50; i++) stepSim(sim, 1 / 60, true, "a");
    assert.ok(you.vy > 70 && you.vy < 150, `settled ${you.vy}`);
    const settled = you.vy;
    for (let i = 0; i < 40; i++) stepSim(sim, 1 / 60, true, "a");
    assert.ok(Math.abs(you.vy - settled) < 10, `kept ${you.vy} after ${settled}`);
  });

  it("leaves still water alone and still lets a stroke reach speed", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    assert.ok(you);
    you.ax = 0;
    you.ay = 0;
    you.vx = 0;
    you.vy = 0;
    for (let i = 0; i < 60; i++) stepSim(sim, 1 / 60, true, "a");
    assert.ok(Math.hypot(you.vx, you.vy) < 6);
    you.ax = 1;
    for (let i = 0; i < 90; i++) stepSim(sim, 1 / 60, true, "a");
    assert.ok(you.vx > 120);
  });

  it("carries a spilled stack and leaves a placed canister", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const you = findDiver(sim, "a");
    const loft = sim.pickups.find((pickup) => pickup.id === "o2-a");
    assert.ok(you && loft);
    const y0 = loft.y;
    you.region = "city";
    you.x = 10 * TILE;
    you.y = 8 * TILE;
    const spill = {
      id: "reward:spill.test",
      region: "city" as const,
      kind: "o2" as const,
      x: 36 * TILE + TILE,
      y: 6 * TILE,
      taken: false,
      reward: true,
      stack: true,
      amount: 2,
    };
    sim.pickups.push(spill);
    for (let i = 0; i < 90; i++) stepSim(sim, 1 / 60, true, "a");
    assert.ok(spill.y > 6 * TILE + 40, `spill ${spill.y}`);
    assert.equal(loft.y, y0);
  });

  it("does not tick a wake in an empty sector", () => {
    const sim = createSim({ selfId: "a", name: "A", partner: false, soren: false });
    const x = 20 * TILE + TILE / 2;
    const y = 8 * TILE + TILE / 2;
    noteWake(sim, "plains", x, y, 40, 0);
    const before = sampleFlow(sim, "plains", x, y);
    assert.ok(before.x > 5);
    for (let i = 0; i < 30; i++) stepSim(sim, 1 / 60, true, "a");
    const after = sampleFlow(sim, "plains", x, y);
    assert.equal(after.x, before.x);
    assert.equal(after.y, before.y);
  });
});

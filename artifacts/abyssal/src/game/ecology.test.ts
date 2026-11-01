import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceEcology, createEcology, emitNoise, restorePower, reviveEcology } from "./ecology.ts";
import { Ocean, applyOceanView } from "./ocean.ts";
import { applyGrant, applyOwn, createSim, exportWorld, importWorld, pressUse, stepSim } from "./sim.ts";
import { applySave, writeSave } from "./persist.ts";
import { consumeActionEdge, queueActionKey } from "./input.ts";

const intent = { ax: 0, ay: 0, aimX: 1, aimY: 0, fire: false };
const fresh = () => createSim({ selfId: "test", name: "Researcher", partner: false, soren: false });

test("restored power causes deterministic growth and a signal, with no duplicate events", () => {
  const memory = reviveEcology();
  advanceEcology(memory, 90);
  assert.equal(memory.bloom, 0);
  assert.equal(memory.events.length, 0);
  assert.equal(restorePower(memory, 120, 80), true);
  advanceEcology(memory, 90);
  assert.equal(memory.bloom, 1);
  assert.equal(memory.noise, 0);
  assert.deepEqual(memory.events.map((e) => e.kind), ["power", "bloom", "signal"]);
  advanceEcology(memory, 300);
  assert.equal(restorePower(memory, 120, 80), false);
  assert.equal(memory.events.length, 3);
});

test("disturbance fades but the regional record remains", () => {
  const memory = reviveEcology();
  emitNoise(memory, 140, 160, 70);
  assert.equal(memory.noise, 70);
  assert.equal(memory.disturbance, 70);
  advanceEcology(memory, 20);
  assert.equal(memory.noise, 0);
  assert.equal(memory.events[0]?.kind, "disturbance");
  assert.equal(memory.disturbance, 70);
});

test("legacy and malformed ecological state cannot produce NaN or unbounded events", () => {
  const memory = reviveEcology({
    noise: Number.NaN, bloom: 999, disturbance: -4, powered: true,
    events: Array.from({ length: 100 }, () => ({ kind: "power" as const, at: Infinity })),
  });
  assert.equal(memory.noise, 0);
  assert.equal(memory.bloom, 1);
  assert.equal(memory.powered, false);
  assert.equal(memory.disturbance, 0);
  assert.deepEqual(memory.events, [{ kind: "power", at: 0 }]);
  assert.equal(createEcology().reef.powered, false);
});

test("a repair station consumes one cell once, never at a distance or without a cell", () => {
  const sim = fresh();
  const you = sim.divers[0];
  const station = sim.markers.find((m) => m.region === "breach" && m.kind === "repair");
  assert(station);
  sim.vehicles = [];
  you.x = station.x; you.y = station.y; you.cells = 0;
  pressUse(sim, you);
  assert.equal(sim.ecology.breach.powered, false);
  you.cells = 2; you.x = station.x + 500;
  pressUse(sim, you);
  assert.equal(you.cells, 2);
  you.x = station.x;
  pressUse(sim, you);
  assert.equal(sim.ecology.breach.powered, true);
  assert.equal(you.cells, 1);
  pressUse(sim, you);
  assert.equal(you.cells, 1);
});

test("a quick E tap between frames still restores a real station and cannot spend twice", () => {
  const sim = fresh();
  const you = sim.divers[0];
  Object.assign(you, { x: 1408, y: 256 });
  stepSim(sim, 1 / 60, true, you.id);
  assert.equal(you.cells, 1);
  const station = sim.markers.find((m) => m.region === "breach" && m.kind === "repair")!;
  Object.assign(you, { x: station.x, y: station.y, vx: 0, vy: 0 });
  stepSim(sim, 1 / 60, true, you.id);
  const pressed = new Set<string>();
  const previous = new Set<string>();
  queueActionKey(pressed, "KeyE");
  // The key was already released before the animation frame runs.
  if (consumeActionEdge("KeyE", false, previous, pressed)) pressUse(sim, you);
  assert.equal(sim.ecology.breach.powered, true);
  assert.equal(you.cells, 0);
  assert.equal(consumeActionEdge("KeyE", false, previous, pressed), false);
  queueActionKey(pressed, "KeyE", true);
  assert.equal(consumeActionEdge("KeyE", false, previous, pressed), false);
});

test("only real shots create noise and replica simulation never advances ecology", () => {
  const sim = fresh();
  const you = sim.divers[0];
  you.fireLatch = true; you.ammo = 0;
  stepSim(sim, 0.02, true, you.id);
  assert.equal(sim.ecology.breach.disturbance, 0);
  you.ammo = 2; you.fireCd = 0; you.fireLatch = true;
  stepSim(sim, 0.02, true, you.id);
  assert.equal(sim.ecology.breach.disturbance, 22);
  const before = JSON.stringify(sim.ecology);
  stepSim(sim, 1, false, you.id);
  assert.equal(JSON.stringify(sim.ecology), before);
});

test("small life flees a distant noise source outside diver detection range", () => {
  const sim = fresh();
  const c = sim.creatures.find((c) => c.kind === "darter");
  assert(c);
  sim.creatures = [c]; sim.vehicles = [];
  sim.regions.breach.tiles.fill(0);
  sim.divers[0].x = 1000; sim.divers[0].y = 200;
  Object.assign(c, { region: "breach", x: 200, y: 200, homeX: 200, homeY: 200, vx: 0, vy: 0 });
  emitNoise(sim.ecology.breach, 120, 200, 50);
  stepSim(sim, 0.05, true, "test");
  assert(c.vx > 0, "the school should flee the sound, not attack or drift toward it");
});

test("ribbon eels investigate restored machinery without a nearby diver", () => {
  const sim = fresh();
  const c = sim.creatures.find((c) => c.kind === "eel");
  assert(c);
  sim.creatures = [c]; sim.vehicles = [];
  sim.regions.breach.tiles.fill(0);
  sim.divers[0].x = 1000; sim.divers[0].y = 200;
  Object.assign(c, { region: "breach", x: 200, y: 200, homeX: 200, homeY: 200, vx: 0, vy: 0, state: "patrol" });
  restorePower(sim.ecology.breach, 350, 200);
  advanceEcology(sim.ecology.breach, 10);
  stepSim(sim, 0.05, true, "test");
  assert(c.vx > 0, "the eel should investigate the warm conduit after startup noise has faded");
});

test("regional changes are shared and client views cannot mutate the world", () => {
  const ocean = new Ocean();
  const first = ocean.join(null, "Engineer");
  const second = ocean.join(null, "Observer");
  const located = ocean.locate(first)!;
  const station = located.sim.markers.find((m) => m.kind === "repair")!;
  located.sim.vehicles = [];
  Object.assign(located.diver, { x: station.x, y: station.y, cells: 2 });
  ocean.setIntent(first, { ...intent, use: true });
  const snapshot = ocean.snapshot(second);
  assert.equal(snapshot.ecology?.powered, true);
  assert.equal(located.diver.cells, 1);
  assert(snapshot.toasts.some((text) => text.includes("restored")));
  snapshot.ecology!.events.length = 0;
  assert.equal(ocean.sectors.breach.ecology.breach.events.length, 1);
  const client = fresh();
  applyOceanView(client, second, ocean.snapshot(second));
  assert.equal(client.ecology.breach.powered, true);
});

test("a frequency guest can restore a grid and receives the cell-spending acknowledgement", () => {
  const host = fresh();
  const guest = createSim({ selfId: "guest", name: "Engineer", partner: false, soren: false });
  const station = host.markers.find((m) => m.region === "breach" && m.kind === "repair")!;
  const you = guest.divers[0];
  Object.assign(you, { x: station.x, y: station.y, cells: 1 });
  applyOwn(host, { ...you, fire: false }, "test");
  const remote = host.divers.find((d) => d.id === you.id)!;
  assert.equal(remote.cells, 1);
  host.vehicles = [];
  pressUse(host, remote);
  assert.equal(host.ecology.breach.powered, true);
  const debit = host.outbox.find((m) => m.k === "grant");
  assert(debit && debit.k === "grant" && debit.kind === "cell");
  assert.equal(debit.amount, -1);
  applyGrant(guest, you.id, "cell", debit.amount);
  assert.equal(you.cells, 0);
  applyOwn(host, { ...you, fire: false }, "test");
  assert.equal(remote.cells, 0);
  const before = host.outbox.length;
  pressUse(host, remote);
  assert.equal(host.outbox.length, before);
});

test("world memory survives a JSON process restart and sleeping sectors do not run events", () => {
  const ocean = new Ocean();
  const token = ocean.join(null, "Researcher");
  restorePower(ocean.sectors.reef.ecology.reef, 100, 100);
  restorePower(ocean.sectors.breach.ecology.breach, 200, 200);
  emitNoise(ocean.sectors.breach.ecology.breach, 200, 200, 50);
  ocean.step(0.2);
  assert.equal(ocean.sectors.reef.ecology.reef.poweredSeconds, 0);
  const body = JSON.parse(JSON.stringify(ocean.toBody()));
  const resumed = Ocean.revive(body);
  assert.equal(resumed.join(token, "Researcher"), token);
  assert.deepEqual(resumed.sectors.breach.ecology.breach, ocean.sectors.breach.ecology.breach);
  assert.equal(resumed.sectors.reef.ecology.reef.powered, true);
  for (const id of Object.keys(body.sectors)) delete body.sectors[id].ecology;
  const legacy = Ocean.revive(body);
  assert.equal(legacy.sectors.breach.ecology.breach.powered, false);
  assert.equal(legacy.join(token, "Researcher"), token);
});

test("frequency snapshots include independent regional memory and accept old snapshots", () => {
  const host = fresh(); const guest = fresh();
  restorePower(host.ecology.breach, 100, 100);
  const snap = exportWorld(host);
  importWorld(guest, snap, "test");
  assert.equal(guest.ecology.breach.powered, true);
  guest.ecology.breach.events.length = 0;
  assert.equal(host.ecology.breach.events.length, 1);
  delete snap.ecology;
  importWorld(guest, snap, "test");
  assert.equal(guest.ecology.breach.powered, false);
});

test("local frequency saves retain regional consequences and old saves remain loadable", () => {
  const oldStorage = globalThis.localStorage;
  const records = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
  } });
  try {
    const sim = fresh();
    restorePower(sim.ecology.breach, 100, 100);
    writeSave(sim, "test");
    const saved = JSON.parse(records.get("abyssal-save-v1")!);
    const resumed = fresh();
    applySave(resumed, "test", saved);
    assert.equal(resumed.ecology.breach.powered, true);
    delete saved.ecology;
    applySave(resumed, "test", saved);
    assert.equal(resumed.ecology.breach.powered, false);
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, "localStorage", { configurable: true, value: oldStorage });
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

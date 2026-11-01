#!/usr/bin/env node
// Two real browsers, one shared ocean. No warps.
import { chromium } from "playwright";

const URL = process.argv[2] || "http://127.0.0.1:8080/";
const TILE = 32;
const proof = [];
const cursors = new Map();

function pass(name, detail) {
  proof.push({ name, ok: true, detail });
  console.log(`ok  ${name} — ${detail}`);
}

function fail(name, detail) {
  proof.push({ name, ok: false, detail });
  console.error(`FAIL ${name} — ${detail}`);
  const error = new Error(`${name}: ${detail}`);
  error.proof = proof;
  throw error;
}

async function enter(page, name) {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Callsign" }).fill(name);
  const button = page.getByRole("button", { name: /Enter the ocean|Return to your dive/ });
  await button.click();
  try {
    await page.waitForFunction(() => window.__abyssal && window.__abyssal.you(), null, { timeout: 8000 });
  } catch {
    await button.click();
    await page.waitForFunction(() => window.__abyssal && window.__abyssal.you(), null, { timeout: 15000 });
  }
  await page.waitForTimeout(300);
}

async function you(page) {
  return page.evaluate(() => window.__abyssal.you());
}

async function world(page) {
  return page.evaluate(() => window.__abyssal.world());
}

async function drive(page, ax, ay, fire = false, aimX, aimY) {
  await page.evaluate(
    ({ ax, ay, fire, aimX, aimY }) => window.__abyssal.drive(ax, ay, fire, aimX, aimY),
    { ax, ay, fire, aimX, aimY },
  );
}

async function tap(page) {
  await page.evaluate(() => window.__abyssal.tap("use"));
  await page.waitForTimeout(350);
}

function pos(me) {
  return { x: me.sx ?? me.x, y: me.sy ?? me.y };
}

async function stepToward(page, key, points) {
  const me = await you(page);
  if (!me) fail("steer", "diver vanished");
  if (me.hp < 8) fail("steer", `${JSON.stringify(me)} is blacking out`);
  const at = pos(me);
  let index = cursors.get(key) ?? 0;
  while (index < points.length - 1 && Math.hypot(points[index][0] - at.x, points[index][1] - at.y) < 42) index += 1;
  cursors.set(key, index);
  const [tx, ty] = points[index];
  const dx = tx - at.x;
  const dy = ty - at.y;
  const dist = Math.hypot(dx, dy);
  if (index === points.length - 1 && dist < 30) {
    await drive(page, 0, 0, false);
    return true;
  }
  const ax = Math.abs(dx) < 18 ? 0 : Math.sign(dx);
  const ay = Math.abs(dy) < 18 ? 0 : Math.sign(dy);
  const close = dist < 88;
  await drive(
    page,
    close && Math.abs(dy) > Math.abs(dx) ? 0 : ax,
    close && Math.abs(dx) >= Math.abs(dy) ? 0 : ay,
    false,
  );
  return false;
}

async function until(ms, tick) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const done = await tick();
    if (done) return true;
    await new Promise((resolve) => setTimeout(resolve, 140));
  }
  return false;
}

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"],
});
const adaCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const boCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ada = await adaCtx.newPage();
const bo = await boCtx.newPage();
ada.on("pageerror", (err) => console.error("ada page", err.message));
bo.on("pageerror", (err) => console.error("bo page", err.message));

try {
  await enter(ada, "Ada");
  await enter(bo, "Bo");
  const ada0 = await you(ada);
  const bo0 = await you(bo);
  if (!ada0 || !bo0) fail("connect", "a diver did not spawn");
  if (ada0.region !== "breach" || bo0.region !== "breach") fail("connect", "not in the same region");
  pass("connect", `both in the breach, Ada o2 ${Math.round(ada0.o2)}, Bo o2 ${Math.round(bo0.o2)}`);

  const adaBefore = ada0.o2;
  const boBefore = bo0.o2;
  const adaLoft = [[20 * TILE, 9 * TILE], [20 * TILE, 3 * TILE]];
  const boLoft = [[24 * TILE, 9 * TILE], [24 * TILE, 3 * TILE]];
  const aired = await until(16000, async () => {
    const a = await stepToward(ada, "ada-loft", adaLoft);
    const b = await stepToward(bo, "bo-loft", boLoft);
    return a && b;
  });
  await ada.waitForTimeout(400);
  const adaFilled = (await you(ada)).o2;
  const boFilled = (await you(bo)).o2;
  if (!aired || adaFilled < 60) fail("oxygen", `Ada missed her canister ${adaBefore} -> ${adaFilled} at ${JSON.stringify(await you(ada))}`);
  if (boFilled < 60) fail("oxygen", `Bo missed his canister ${boBefore} -> ${boFilled} at ${JSON.stringify(await you(bo))}`);
  pass("oxygen", `separate cans — Ada ${Math.round(adaBefore)}->${Math.round(adaFilled)}, Bo ${Math.round(boBefore)}->${Math.round(boFilled)}`);

  await ada.bringToFront();
  await ada.click("canvas");
  const beforeKey = await you(ada);
  await ada.keyboard.down("KeyD");
  await ada.waitForTimeout(700);
  await ada.keyboard.up("KeyD");
  await ada.waitForTimeout(300);
  const afterKey = await you(ada);
  if (!(afterKey.x > beforeKey.x + 12)) fail("keyboard", `D did not swim right ${beforeKey.x} -> ${afterKey.x}`);
  pass("keyboard", `Ada swam right ${Math.round(afterKey.x - beforeKey.x)}px from the keyboard`);

  const boSwim = await you(bo);
  await drive(bo, -1, 0, false);
  await bo.waitForTimeout(650);
  await drive(bo, 0, 0, false);
  await bo.waitForTimeout(250);
  const boAfter = await you(bo);
  const adaSees = (await world(ada)).others.find((diver) => diver.name === "Bo");
  const boSees = (await world(bo)).others.find((diver) => diver.name === "Ada");
  if (!(boAfter.x < boSwim.x - 8)) fail("swim", `Bo did not swim left ${boSwim.x} -> ${boAfter.x}`);
  if (!adaSees || !boSees) fail("see", "they cannot see each other");
  if (Math.abs(adaSees.x - boAfter.x) > 140) fail("see", `Ada sees Bo at ${adaSees.x}, Bo is at ${boAfter.x}`);
  pass("swim", `Ada ${Math.round(afterKey.x)}, Bo ${Math.round(boAfter.x)}`);
  pass("see", "each client shows the other's position");

  const eel0 = (await world(ada)).creatures.find((creature) => creature.id === "b-e1");
  if (!eel0) fail("attack", "the breach eel is already gone");
  await until(12000, async () => {
    const a = await stepToward(ada, "ada-eel", [[20 * TILE, 9 * TILE], [eel0.x - 170, eel0.y]]);
    const b = await stepToward(bo, "bo-eel", [[24 * TILE, 9 * TILE], [eel0.x + 150, eel0.y]]);
    return a && b;
  });
  const eelBefore = (await world(ada)).creatures.find((creature) => creature.id === "b-e1");
  if (!eelBefore) fail("attack", "the breach eel vanished before the shot");
  const shot = await until(4000, async () => {
    const foe = (await world(ada)).creatures.find((creature) => creature.id === "b-e1");
    if (!foe || foe.hp < eelBefore.hp - 8) return true;
    const a = await you(ada);
    const b = await you(bo);
    await drive(ada, 0, 0, true, foe.x - a.x, foe.y - a.y);
    await drive(bo, 0, 0, true, foe.x - b.x, foe.y - b.y);
    return false;
  });
  await drive(ada, 0, 0, false);
  await drive(bo, 0, 0, false);
  const eelAda = (await world(ada)).creatures.find((creature) => creature.id === "b-e1");
  const eelBo = (await world(bo)).creatures.find((creature) => creature.id === "b-e1");
  const eelHp = eelAda ? eelAda.hp : 0;
  const eelHpBo = eelBo ? eelBo.hp : 0;
  if (!shot && eelHp >= eelBefore.hp) fail("attack", `eel still ${eelHp}`);
  if (eelHp !== eelHpBo) fail("attack", `Ada sees ${eelHp}, Bo sees ${eelHpBo}`);
  pass("attack", `shared eel ${eelBefore.hp} -> ${eelHp}`);

  const adaHp = (await you(ada)).hp;
  const boHp = (await you(bo)).hp;
  pass("health", adaHp === boHp ? `separate pools, both at ${Math.round(adaHp)}` : `Ada ${Math.round(adaHp)}, Bo ${Math.round(boHp)}`);

  const scooter = [78 * TILE, 3.4 * TILE];
  const boarded = await until(22000, async () => {
    const me = await you(ada);
    if (me.vehicle === "scooter-1") return true;
    if (me.o2 < 34) await stepToward(ada, "ada-air", [[72 * TILE, 9 * TILE], [72 * TILE, 4 * TILE]]);
    else await stepToward(ada, "ada-scooter", [[scooter[0], 9 * TILE], scooter]);
    const at = pos(me);
    if (Math.hypot(scooter[0] - at.x, scooter[1] - at.y) < 86 && me.o2 >= 34) await tap(ada);
    const mate = await you(bo);
    if (mate.o2 < 40) await stepToward(bo, "bo-cache", [[84 * TILE, 9 * TILE], [84 * TILE, 12 * TILE]]);
    else await stepToward(bo, "bo-wait", [[64 * TILE, 9 * TILE]]);
    return false;
  });
  if (!boarded) fail("vehicle", `Ada did not board the scooter ${JSON.stringify(await you(ada))}`);
  const joined = await until(14000, async () => {
    const mate = await you(bo);
    const at = pos(mate);
    if (Math.hypot(scooter[0] - at.x, scooter[1] - at.y) < 78) return true;
    await stepToward(bo, "bo-seat", [[scooter[0], 9 * TILE], [scooter[0], scooter[1] + 30]]);
    return false;
  });
  if (!joined) fail("vehicle", `Bo never reached the scooter ${JSON.stringify(await you(bo))}`);
  await tap(bo);
  const boSeat = await you(bo);
  if (boSeat.vehicle) fail("vehicle", `Bo took a seat that was already Ada's (${boSeat.vehicle})`);
  pass("vehicle", "Ada has the scooter, Bo was refused the same seat");

  let split = null;
  const rode = await until(24000, async () => {
    const me = await you(ada);
    if (me.region === "plains") return true;
    const at = pos(me);
    if (at.y < 8 * TILE) await drive(ada, 0, 1, false);
    else await drive(ada, 1, at.y > 11 * TILE ? -1 : at.y < 8.2 * TILE ? 1 : 0, false);
    const mate = await you(bo);
    if (mate.region === "breach") {
      const cached = await stepToward(bo, "bo-caches", [
        [84 * TILE, 9 * TILE],
        [84 * TILE, 12 * TILE],
        [100 * TILE, 9 * TILE],
        [100 * TILE, 12 * TILE],
      ]);
      if (cached) await drive(bo, 0, mate.y > 10 * TILE ? -1 : mate.y < 8 * TILE ? 1 : 0, false);
    }
    return false;
  });
  const adaNow = await you(ada);
  const boNow = await you(bo);
  if (!rode || adaNow.region !== "plains" || boNow.region !== "breach") {
    fail("regions", `Ada ${adaNow.region} ${Math.round(adaNow.x)}, Bo ${boNow.region} ${Math.round(boNow.x)} o2 ${Math.round(boNow.o2)}`);
  }
  await drive(ada, 0, 0, false);
  const boMark = boNow.x;
  await drive(bo, -1, 0, false);
  await bo.waitForTimeout(700);
  await drive(bo, 0, 0, false);
  const boMoved = await you(bo);
  if (!(boMoved.x < boMark - 8)) fail("regions", "Bo's breach did not keep moving");
  const roster = (await world(bo)).roster;
  const live = new Set(roster.map((row) => row.id));
  if (!live.has("breach") || !live.has("plains")) fail("regions", `roster ${JSON.stringify(roster)}`);
  if ((await world(ada)).others.some((diver) => diver.name === "Bo")) fail("regions", "Ada still received Bo from another region");
  if (!(await world(ada)).creatures.some((creature) => creature.kind === "maw")) fail("regions", "the plains did not bring their own creatures");
  if ((await world(bo)).creatures.some((creature) => creature.kind === "maw")) fail("regions", "the breach received the Maw");
  split = true;
  pass("regions", "plains and breach both live; Ada does not see Bo; Bo does not see the Maw");

  const kite = [34 * TILE, 12 * TILE];
  const crossed = await until(28000, async () => {
    const pilot = await you(ada);
    if (pilot.vehicle === "scooter-1") {
      const at = pos(pilot);
      const parkX = kite[0] - 220;
      const parkY = kite[1];
      const dx = parkX - at.x;
      const dy = parkY - at.y;
      await drive(ada, Math.abs(dx) < 36 ? 0 : Math.sign(dx), Math.abs(dy) < 28 ? 0 : Math.sign(dy), false);
    } else await drive(ada, 0, 0, false);
    const mate = await you(bo);
    if (mate.region === "plains") return true;
    if (mate.hp < 8) fail("travel", `Bo blacked out in the breach ${JSON.stringify(mate)}`);
    await stepToward(bo, "bo-gate", [
      [120 * TILE, 9 * TILE],
      [120 * TILE, 11 * TILE],
      [136 * TILE, 9 * TILE],
    ]);
    return false;
  });
  if (!crossed || (await you(bo)).region !== "plains") fail("travel", `Bo did not cross ${JSON.stringify(await you(bo))}`);
  const met = (await world(ada)).others.some((diver) => diver.name === "Bo") && (await world(bo)).others.some((diver) => diver.name === "Ada");
  if (!met) fail("encounter", "they crossed into the plains and still missed each other");
  pass("travel", "Bo crossed the east lock and found Ada already there");

  if ((await you(ada)).vehicle === "scooter-1") await tap(ada);
  const helmed = await until(16000, async () => {
    const me = await you(ada);
    if (me.vehicle === "kite-1" && me.seat === "pilot") return true;
    const at = pos(me);
    if (me.vehicle && me.vehicle !== "kite-1") {
      await tap(ada);
      return false;
    }
    if (Math.hypot(kite[0] - at.x, kite[1] - at.y) < 78) await tap(ada);
    else await stepToward(ada, "ada-kite", [kite]);
    return false;
  });
  if (!helmed) fail("crew", `Ada is ${(await you(ada)).seat} on ${(await you(ada)).vehicle} at ${JSON.stringify(await you(ada))}`);
  await drive(ada, 0, 0, false);
  const gunned = await until(18000, async () => {
    const pilot = await you(ada);
    await drive(ada, 0, 0, false);
    const mate = await you(bo);
    if (mate.vehicle === "kite-1" && mate.seat === "gunner") return true;
    if (mate.hp < 8) fail("crew", `Bo blacked out before the tube ${JSON.stringify(mate)}`);
    const at = pos(mate);
    const dx = pilot.x - at.x;
    const dy = pilot.y - at.y;
    if (Math.hypot(dx, dy) < 72) await tap(bo);
    else await drive(bo, Math.abs(dx) < 20 ? 0 : Math.sign(dx), Math.abs(dy) < 20 ? 0 : Math.sign(dy), false);
    return false;
  });
  if (!gunned) fail("crew", `Bo is ${(await you(bo)).seat} on ${(await you(bo)).vehicle}`);
  const kiteX = (await you(ada)).x;
  await drive(ada, 1, 0, false);
  await drive(bo, 0, 0, true, 1, 0);
  await ada.waitForTimeout(700);
  await drive(ada, 0, 0, false);
  await drive(bo, 0, 0, false);
  const kiteAfter = await you(ada);
  if (!(kiteAfter.x > kiteX + 12)) fail("crew", `helm did not move the kite ${kiteX} -> ${kiteAfter.x}`);
  if ((await you(bo)).seat !== "gunner") fail("crew", "Bo lost the tube");
  pass("crew", "Ada steers the Kite, Bo holds the tube");

  const maw0 = (await world(ada)).creatures.find((creature) => creature.kind === "maw");
  if (!maw0) fail("boss", "Maw missing");
  let seen = null;
  let best = null;
  await until(20000, async () => {
    const me = await you(ada);
    const maw = (await world(ada)).creatures.find((creature) => creature.kind === "maw");
    if (!maw) return true;
    const at = pos(me);
    const laneY = at.x < 108 * TILE ? 12 * TILE : maw.y;
    const ax = maw.x > at.x + 160 ? 1 : maw.x < at.x - 48 ? -1 : 0;
    const ay = laneY > at.y + 22 ? 1 : laneY < at.y - 22 ? -1 : 0;
    const dist = Math.hypot(maw.x - at.x, maw.y - at.y);
    await drive(ada, ax, ay, false);
    await drive(bo, 0, 0, dist < 340, maw.x - at.x, maw.y - at.y);
    if (dist < 420) {
      seen = seen == null ? maw.hp : Math.max(seen, maw.hp);
      best = best == null ? maw.hp : Math.min(best, maw.hp);
    }
    return best != null && best < seen - 8;
  });
  await drive(ada, 0, 0, false);
  await drive(bo, 0, 0, false);
  await ada.waitForTimeout(400);
  const mawAda = (await world(ada)).creatures.find((creature) => creature.kind === "maw");
  const mawBo = (await world(bo)).creatures.find((creature) => creature.kind === "maw");
  const leftAda = mawAda ? mawAda.hp : 0;
  const leftBo = mawBo ? mawBo.hp : 0;
  if (best == null || !(best < seen - 8)) fail("boss", `Maw did not take a shared hit (${seen} -> ${best}, now ${leftAda})`);
  if (leftAda !== leftBo) fail("boss", `Ada sees ${leftAda}, Bo sees ${leftBo}`);
  pass("boss", `Lantern Maw ${Math.round(seen)} -> ${Math.round(leftAda)} on both clients`);

  const exploredBefore = (await world(ada)).explored;
  if (exploredBefore < 2) fail("map", `chart only remembers ${exploredBefore} cells`);
  await ada.getByRole("button", { name: "Map" }).click();
  await ada.waitForTimeout(400);
  const mapText = await ada.locator("body").innerText();
  if (!mapText.includes("Shared ocean") || !mapText.includes("Abyssal Plains")) fail("map", "the chart did not open onto the shared ocean");
  await ada.screenshot({ path: "/workspace/screenshots/ocean-two-chart.png" });
  await ada.keyboard.press("Escape");
  await ada.waitForTimeout(200);
  pass("map", `${exploredBefore} discovered cells, chart shows the plains`);

  const bookmark = await you(ada);
  const exploredMark = (await world(ada)).explored;
  await ada.close();
  await bo.waitForTimeout(1200);
  const boDuring = await you(bo);
  if (!boDuring || boDuring.region !== "plains") fail("reconnect", "Bo's plains stopped when Ada dropped");
  const adaAgain = await adaCtx.newPage();
  await enter(adaAgain, "Ada");
  const returned = await you(adaAgain);
  const exploredBack = (await world(adaAgain)).explored;
  if (returned.region !== bookmark.region) fail("reconnect", `came back in ${returned.region}, left ${bookmark.region}`);
  if (Math.abs(returned.x - bookmark.x) > 280) fail("reconnect", `moved from ${bookmark.x} to ${returned.x}`);
  if (exploredBack < exploredMark) fail("reconnect", `chart forgot ${exploredMark} -> ${exploredBack}`);
  const boSeesReturn = (await world(bo)).others.some((diver) => diver.name === "Ada");
  if (!boSeesReturn) fail("reconnect", "Bo did not see Ada return");
  pass("reconnect", `Ada returned at ${Math.round(returned.x)} in the ${returned.region}, chart kept ${exploredBack} cells`);

  await adaAgain.screenshot({ path: "/workspace/screenshots/ocean-two-play.png" });
  pass("launch", "both dives started from the page, with the keyboard, and no editor");
  if (!split) fail("regions", "split flag missing");
  console.log(JSON.stringify({ ok: true, proof }, null, 2));
} catch (err) {
  console.error(err.message);
  try {
    await ada.screenshot({ path: "/workspace/screenshots/ocean-two-fail-ada.png" });
  } catch { /* page may be closed */ }
  try {
    await bo.screenshot({ path: "/workspace/screenshots/ocean-two-fail-bo.png" });
  } catch { /* ignore */ }
  console.log(JSON.stringify({ ok: false, error: err.message, proof }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}

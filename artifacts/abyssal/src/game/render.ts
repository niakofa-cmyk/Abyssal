import type { Creature, Diver, RegionId, Sim, Vehicle } from "./types";
import { TILE, VIEW_H, VIEW_W } from "./types";
import { hullStage } from "./sim";
import { sampleFlow } from "./flow";

export type Art = {
  diver: HTMLImageElement;
  eel: HTMLImageElement;
  maw: HTMLImageElement;
  kite: HTMLImageElement;
  scooter: HTMLImageElement;
  darter: HTMLImageElement;
  torpedo: HTMLImageElement;
  props: HTMLImageElement;
  barrow: HTMLImageElement;
  sentry: HTMLImageElement;
  bloom: HTMLImageElement;
  breach: HTMLImageElement;
  plains: HTMLImageElement;
  city: HTMLImageElement;
  works: HTMLImageElement;
  reef: HTMLImageElement;
};

export function loadArt(): Art {
  const load = (src: string) => {
    const img = new Image();
    img.src = src;
    return img;
  };
  return {
    diver: load("/sprites/diver.png"),
    eel: load("/sprites/eel.png"),
    maw: load("/sprites/maw.png"),
    kite: load("/sprites/kite.png"),
    scooter: load("/sprites/scooter.png"),
    darter: load("/sprites/darter.png"),
    torpedo: load("/sprites/torpedo.png"),
    props: load("/sprites/props.png"),
    barrow: load("/sprites/barrow.png"),
    sentry: load("/sprites/sentry.png"),
    bloom: load("/sprites/bloom.png"),
    breach: load("/bg/breach.jpg"),
    plains: load("/bg/plains.jpg"),
    city: load("/bg/city.jpg"),
    works: load("/bg/works.jpg"),
    reef: load("/bg/reef.jpg"),
  };
}

export type Bubble = { x: number; y: number; r: number; life: number; vy: number };

function ready(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0;
}

function blit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  frame: number,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: boolean,
) {
  if (!ready(img)) return;
  const fw = img.width / cols;
  const fh = img.height / rows;
  const sx = (frame % cols) * fw;
  const sy = Math.floor(frame / cols) * fh;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, fw, fh, Math.round(-w / 2), Math.round(-h / 2), w, h);
  ctx.restore();
}

function screen(camX: number, camY: number, x: number, y: number) {
  return { x: x - camX, y: y - camY };
}

/** A drowned refuge: locker, pump, and a beacon mast. Not a map pin. */
function drawSaveStation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  powered: boolean,
  pinned: boolean,
) {
  const px = Math.round(x);
  const py = Math.round(y);
  ctx.fillStyle = "rgba(4, 10, 12, 0.72)";
  ctx.fillRect(px - 18, py + 10, 38, 4);
  ctx.fillStyle = "#1b1612";
  ctx.fillRect(px - 14, py + 8, 9, 3);
  ctx.fillRect(px + 6, py + 9, 8, 2);

  ctx.fillStyle = "#2a322e";
  ctx.fillRect(px - 17, py + 4, 36, 6);
  ctx.fillStyle = "#59645c";
  ctx.fillRect(px - 17, py + 4, 36, 1);
  ctx.fillStyle = "#101614";
  ctx.fillRect(px - 15, py + 8, 32, 1);

  ctx.fillStyle = "#2a3840";
  ctx.fillRect(px - 16, py - 14, 18, 20);
  ctx.fillStyle = "#3c515a";
  ctx.fillRect(px - 16, py - 14, 18, 2);
  ctx.fillStyle = "#0c1418";
  ctx.fillRect(px - 8, py - 14, 1, 20);
  ctx.fillStyle = "#c6a15a";
  ctx.fillRect(px - 12, py - 5, 2, 6);
  ctx.fillStyle = "#9aa59c";
  ctx.fillRect(px - 15, py - 12, 1, 1);
  ctx.fillRect(px - 0, py - 12, 1, 1);
  ctx.fillRect(px - 15, py + 4, 1, 1);
  ctx.fillRect(px, py + 4, 1, 1);

  ctx.fillStyle = "#17262c";
  ctx.fillRect(px + 3, py - 10, 15, 16);
  ctx.fillStyle = "#41545a";
  ctx.fillRect(px + 3, py - 10, 15, 2);
  ctx.fillStyle = "#070e12";
  ctx.fillRect(px + 7, py - 5, 7, 7);
  ctx.fillStyle = powered ? "#3ee0c5" : "#6a4030";
  ctx.fillRect(px + 8, py - 4, powered ? 5 : 2, 5);
  ctx.strokeStyle = "#d7c4a3";
  ctx.strokeRect(px + 6, py - 16, 9, 5);
  ctx.fillStyle = "#8a7344";
  ctx.fillRect(px + 9, py - 11, 2, 2);

  ctx.fillStyle = powered ? "#1d4c48" : "#2a2420";
  ctx.fillRect(px - 22, py + 2, 6, 3);
  ctx.fillRect(px + 18, py + 1, 7, 3);
  if (powered) {
    ctx.fillStyle = "rgba(62, 224, 197, 0.75)";
    ctx.fillRect(px - 21, py + 3, 4, 1);
    ctx.fillRect(px + 19, py + 2, 5, 1);
  }

  ctx.fillStyle = "#3a4648";
  ctx.fillRect(px - 2, py - 28, 2, 14);
  const blink = 0.55 + Math.sin(time * (pinned ? 4 : 1.6)) * 0.35;
  ctx.save();
  ctx.globalAlpha = pinned || powered ? blink : 0.5;
  ctx.fillStyle = pinned ? "#f2d180" : powered ? "#7ef0d8" : "#c46a32";
  ctx.fillRect(px - 4, py - 32, 6, 4);
  ctx.restore();
  if (pinned || powered) {
    ctx.fillStyle = pinned ? "rgba(242, 209, 128, 0.2)" : "rgba(62, 224, 197, 0.16)";
    ctx.fillRect(px - 12, py - 38, 22, 12);
  }
}

function drawInfoDesk(ctx: CanvasRenderingContext2D, x: number, y: number, awake: boolean) {
  const px = Math.round(x);
  const py = Math.round(y);
  ctx.fillStyle = "rgba(4, 10, 12, 0.65)";
  ctx.fillRect(px - 16, py + 10, 32, 3);
  ctx.fillStyle = "#3a342c";
  ctx.fillRect(px - 14, py - 2, 28, 5);
  ctx.fillStyle = "#6d6254";
  ctx.fillRect(px - 14, py - 2, 28, 1);
  ctx.fillStyle = "#241e18";
  ctx.fillRect(px - 12, py + 3, 3, 8);
  ctx.fillRect(px + 9, py + 3, 3, 8);
  ctx.fillStyle = awake ? "#d7c4a3" : "#3a342c";
  ctx.fillRect(px - 6, py - 8, 10, 6);
  ctx.fillStyle = awake ? "#8cf1d4" : "#1a1612";
  ctx.fillRect(px - 5, py - 7, 8, 4);
  ctx.fillStyle = "#2a3840";
  ctx.fillRect(px + 6, py - 12, 4, 10);
  ctx.fillStyle = awake ? "#f2d180" : "#5a4030";
  ctx.fillRect(px + 6, py - 14, 4, 3);
}

function drawRepair(ctx: CanvasRenderingContext2D, x: number, y: number, powered: boolean) {
  const px = Math.round(x);
  const py = Math.round(y);
  ctx.fillStyle = "rgba(4, 10, 12, 0.65)";
  ctx.fillRect(px - 14, py + 10, 28, 3);
  ctx.fillStyle = "#1c2a30";
  ctx.fillRect(px - 12, py - 8, 24, 18);
  ctx.fillStyle = "#3d5158";
  ctx.fillRect(px - 12, py - 8, 24, 2);
  ctx.fillStyle = "#070e12";
  ctx.fillRect(px - 4, py - 4, 8, 10);
  ctx.fillStyle = powered ? "#f2d180" : "#4a4034";
  ctx.fillRect(px - 2, py - 2, 4, 6);
  ctx.fillStyle = powered ? "#3ee0c5" : "#6a4030";
  ctx.fillRect(px - 1, py - 1, 2, 4);
  ctx.fillStyle = powered ? "#1d4c48" : "#2a2420";
  ctx.fillRect(px - 18, py + 2, 6, 3);
  ctx.fillRect(px + 12, py + 2, 6, 3);
  if (powered) {
    ctx.fillStyle = "rgba(62, 224, 197, 0.8)";
    ctx.fillRect(px - 17, py + 3, 4, 1);
    ctx.fillRect(px + 13, py + 3, 4, 1);
  }
}

function drawBench(ctx: CanvasRenderingContext2D, x: number, y: number, spent: boolean) {
  const px = Math.round(x);
  const py = Math.round(y);
  ctx.fillStyle = "rgba(4, 10, 12, 0.65)";
  ctx.fillRect(px - 16, py + 10, 32, 3);
  ctx.fillStyle = "#3a3228";
  ctx.fillRect(px - 14, py, 28, 6);
  ctx.fillStyle = "#6a5844";
  ctx.fillRect(px - 14, py, 28, 1);
  ctx.fillStyle = "#241c16";
  ctx.fillRect(px - 12, py + 6, 3, 5);
  ctx.fillRect(px + 9, py + 6, 3, 5);
  ctx.fillStyle = spent ? "#3a342c" : "#c4553a";
  ctx.fillRect(px - 8, py - 8, 16, 3);
  ctx.fillStyle = "#d7c4a3";
  ctx.fillRect(px - 2, py - 10, 2, 8);
  ctx.fillStyle = spent ? "#5a4030" : "#e7a04a";
  ctx.fillRect(px + 8, py - 6, 3, 3);
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = Math.round(x);
  const py = Math.round(y);
  ctx.fillStyle = "#1a140c";
  ctx.fillRect(px - 7, py - 8, 14, 16);
  ctx.fillStyle = "#c6a15a";
  ctx.fillRect(px - 6, py - 6, 12, 12);
  ctx.fillStyle = "#f2d180";
  ctx.fillRect(px - 2, py - 10, 4, 3);
  ctx.fillRect(px - 3, py - 2, 6, 4);
}

export function drawSea(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  camX: number,
  camY: number,
  art: Art,
  regionId: RegionId,
  bubbles: Bubble[],
  focusId: string,
) {
  const region = sim.regions[regionId];
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#041016";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const bg =
    regionId === "breach"
      ? art.breach
      : regionId === "city"
        ? art.city
        : regionId === "works"
          ? art.works
          : regionId === "reef"
            ? art.reef
            : art.plains;
  if (ready(bg)) {
    const w = VIEW_W * 1.35;
    const shift = -((camX * 0.22) % w);
    ctx.drawImage(bg, shift, 0, w, VIEW_H);
    ctx.drawImage(bg, shift + w, 0, w, VIEW_H);
    ctx.fillStyle = "rgba(2, 8, 12, 0.38)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.globalAlpha = regionId === "reef" ? 0.16 : regionId === "breach" ? 0.05 : 0.09;
    ctx.fillStyle = "#c6fff4";
    const drift = sim.time * 14;
    for (let i = 0; i < 16; i++) {
      const x = ((i * 73 + drift) % (VIEW_W + 24)) - 12;
      const y = (i * 41 + drift * 0.35) % (VIEW_H + 8);
      ctx.fillRect(x, y, 11, 1);
      ctx.fillRect(x + 7, y + 3, 6, 1);
    }
    ctx.restore();
  }
  if (regionId === "reef") {
    ctx.fillStyle = "rgba(186, 214, 204, 0.16)";
    ctx.fillRect(0, 0, VIEW_W, 36);
  }

  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const memory = sim.ecology[regionId];
  if (memory.powered && memory.station) {
    const x = memory.station.x - camX;
    const y = memory.station.y - camY;
    const radius = 65 + memory.bloom * 110;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, radius);
    glow.addColorStop(0, `rgba(70, 225, 190, ${0.16 + memory.bloom * 0.22})`);
    glow.addColorStop(1, "rgba(30, 135, 125, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    // Growth follows the conduits rather than creating an unrelated random event.
    ctx.fillStyle = "#76dac1";
    for (let i = 0; i < Math.floor(memory.bloom * 20); i += 1) {
      ctx.fillRect(x + Math.sin(i * 2.4) * radius * 0.7, y + Math.cos(i * 1.7) * radius * 0.35, 2, 2);
    }
  }
  const x1 = Math.min(region.w - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const y1 = Math.min(region.h - 1, Math.ceil((camY + VIEW_H) / TILE) + 1);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = region.tiles[ty * region.w + tx] ?? 0;
      const x = tx * TILE - camX;
      const y = ty * TILE - camY;
      if (t === 1 || (t === 8 && !sim.flags.mawDead)) {
        const n = (tx * 13 + ty * 7) & 3;
        ctx.fillStyle = n === 0 ? "#10262c" : n === 1 ? "#0c1e24" : n === 2 ? "#16323a" : "#0a181c";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "rgba(62, 224, 197, 0.18)";
        ctx.fillRect(x, y, TILE, 2);
        if ((tx + ty) % 5 === 0) {
          ctx.fillStyle = "#e7a04a";
          ctx.fillRect(x + 6, y + 8, 2, 2);
        }
      } else if (t === 2 && Math.sin(sim.time * 18 + tx) > 0.2) {
        ctx.fillStyle = "rgba(231, 160, 74, 0.95)";
        const j = (tx + Math.floor(sim.time * 14)) & 3;
        ctx.fillRect(x + 3, y + 4 + j, 2, 2);
        ctx.fillRect(x + 7, y + 8 - j, 2, 2);
        ctx.fillRect(x + 11, y + 6, 2, 3);
      } else if (t === 3) {
        ctx.strokeStyle = "rgba(62, 224, 197, 0.45)";
        ctx.beginPath();
        const sway = Math.sin(sim.time * 2 + tx) * 4;
        ctx.moveTo(x + TILE / 2, y + TILE);
        ctx.quadraticCurveTo(x + sway, y + 8, x + TILE / 2 + sway, y);
        ctx.stroke();
      } else if (t === 4 || t === 5) {
        ctx.fillStyle = "rgba(62, 224, 197, 0.08)";
        ctx.fillRect(x, y + 12, TILE, 4);
      } else if (t === 6) {
        ctx.fillStyle = "rgba(231, 160, 74, 0.18)";
        ctx.fillRect(x + 12, y + 6 + ((sim.time * 24) % 16), 8, 10);
      } else if (t === 7 && Math.sin(sim.time * 3 + tx) > 0) {
        ctx.fillStyle = "rgba(210, 180, 60, 0.45)";
        ctx.fillRect(x + 8, y + 10, 4, 4);
        ctx.fillRect(x + 18, y + 18, 3, 3);
      } else if (t === 8 && sim.flags.mawDead) {
        ctx.fillStyle = "rgba(231, 160, 74, 0.15)";
        ctx.fillRect(x, y, TILE, TILE);
      } else if (t === 9) {
        ctx.fillStyle = "#1a120c";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = "rgba(231, 160, 74, 0.7)";
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      }
      if (t !== 1 && !(t === 8 && !sim.flags.mawDead)) {
        const flow = sampleFlow(sim, regionId, (tx + 0.5) * TILE, (ty + 0.5) * TILE);
        const mag = Math.hypot(flow.x, flow.y);
        if (mag > 14) {
          ctx.strokeStyle = `rgba(150, 214, 204, ${Math.min(0.42, mag / 300)})`;
          ctx.beginPath();
          const len = Math.min(10, mag / 14);
          ctx.moveTo(x + TILE / 2, y + TILE / 2);
          ctx.lineTo(x + TILE / 2 + (flow.x / mag) * len, y + TILE / 2 + (flow.y / mag) * len);
          ctx.stroke();
        }
      }
    }
  }

  if (regionId === "breach") {
    gouge(ctx, camX, camY, 11 * TILE, 3 * TILE + 18);
    gouge(ctx, camX, camY, 13 * TILE + 8, 13 * TILE + 6);
  }

  ctx.fillStyle = "rgba(186, 206, 198, 0.45)";
  for (let i = 0; i < 22; i++) {
    const bx = (i * 211) % (region.w * TILE);
    const by = (i * 97) % (region.h * TILE);
    const flow = sampleFlow(sim, regionId, bx, by);
    const span = 2.4;
    const u = (sim.time % span) / span;
    const p = screen(camX, camY, bx + flow.x * u * span + Math.sin(sim.time + i) * 2, by + flow.y * u * span);
    if (p.x < -4 || p.y < -4 || p.x > VIEW_W + 4 || p.y > VIEW_H + 4) continue;
    ctx.fillRect(p.x, p.y, 2, 1);
  }

  const observer = sim.divers.find((d) => d.id === focusId);
  for (const marker of sim.markers) {
    if (marker.region !== regionId) continue;
    const p = screen(camX, camY, marker.x, marker.y);
    if (marker.kind === "lore") blit(ctx, art.props, 2, 2, 3, p.x, p.y, 36, 36, false);
    else {
      const kind = marker.kind;
      const pinnedHere = !!observer?.pinned && observer.beaconRegion === marker.region && Math.hypot(observer.beaconX - marker.x, observer.beaconY - marker.y) < 8;
      const refugeLive = regionId === "breach" || memory.powered;
      let lift = 29;
      if (kind === "save") {
        drawSaveStation(ctx, p.x, p.y, sim.time, refugeLive, pinnedHere);
        lift = 46;
      } else if (kind === "info") {
        drawInfoDesk(ctx, p.x, p.y, refugeLive);
        lift = 38;
      } else if (kind === "repair") {
        drawRepair(ctx, p.x, p.y, memory.powered);
        lift = 34;
      } else if (kind === "upgrade") {
        drawBench(ctx, p.x, p.y, sim.flags.upgraded);
        lift = 34;
      } else {
        ctx.strokeStyle = "#3ee0c5";
        ctx.strokeRect(p.x - 10, p.y - 10, 20, 20);
      }
      const near = !!observer?.alive && !observer.vehicleId && Math.hypot(observer.x - marker.x, observer.y - marker.y) <= 70;
      const label =
        kind === "repair" && near ? (memory.powered ? "GRID ONLINE" : "E / USE: GRID · 1 CELL") :
        kind === "save" && near ? (regionId !== "breach" && !memory.powered ? "E PIN · GRID OR SALVAGE" : "E / USE: SAVE · G LOCKER") :
        kind === "info" && near ? (regionId !== "breach" && !memory.powered ? "DESK DARK · RESTORE GRID" : "E / USE: FILE") :
        kind === "upgrade" && near ? (sim.flags.upgraded ? "SPRING TAKEN" : "E / USE: RELINE · 1 CELL") :
        "";
      if (label) {
        ctx.save();
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        const width = ctx.measureText(label).width + 10;
        ctx.fillStyle = "rgba(2, 12, 18, 0.9)";
        ctx.fillRect(p.x - width / 2, p.y - lift, width, 13);
        ctx.fillStyle = kind === "save" ? "#f2d180" : "#8cf1d4";
        ctx.fillText(label, p.x, p.y - lift + 9);
        ctx.restore();
      }
    }
  }

  for (const pickup of sim.pickups) {
    if (pickup.taken || pickup.region !== regionId) continue;
    const p = screen(camX, camY, pickup.x, pickup.y);
    const frame = pickup.kind === "o2" ? 0 : pickup.kind === "med" ? 1 : pickup.kind === "ammo" ? 2 : 0;
    const bob = Math.sin(sim.time * 2 + pickup.x) * 2;
    if (pickup.kind === "cell") drawCell(ctx, p.x, p.y + bob);
    else blit(ctx, art.props, 2, 2, frame, p.x, p.y + bob, 28, 28, false);
    if (pickup.reward) {
      ctx.save();
      const tint = pickup.kind === "med" ? "#f2b4a0" : pickup.kind === "cell" ? "#f2d180" : "#8cf1d4";
      ctx.strokeStyle = tint;
      ctx.fillStyle = tint;
      ctx.globalAlpha = 0.88;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`+${pickup.amount ?? 1}`, p.x, p.y + bob - 18);
      ctx.restore();
    }
  }

  for (const vehicle of sim.vehicles) {
    if (vehicle.region !== regionId) continue;
    drawVehicle(ctx, art, vehicle, camX, camY, sim.time);
  }

  for (const creature of sim.creatures) {
    if (!creature.alive || creature.region !== regionId) continue;
    drawCreature(ctx, art, creature, camX, camY, sim.time);
  }

  for (const shot of sim.projectiles) {
    if (shot.region !== regionId) continue;
    const p = screen(camX, camY, shot.x, shot.y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(shot.vy, shot.vx));
    if (shot.kind === "torpedo") {
      blit(ctx, art.torpedo, 2, 2, Math.floor(sim.time * 10) % 4, 0, 0, 30, 12, false);
    } else {
      ctx.fillStyle = shot.team === "wild" ? "#e7a04a" : "#e6f1ee";
      ctx.fillRect(-6, -1, 12, 2);
    }
    ctx.restore();
  }

  for (const diver of sim.divers) {
    if (diver.region !== regionId || !diver.alive) continue;
    drawDiver(ctx, art, diver, camX, camY, sim.time, diver.id === focusId);
  }

  for (const bubble of bubbles) {
    const p = screen(camX, camY, bubble.x, bubble.y);
    const a = Math.max(0, bubble.life);
    const r = Math.max(2, bubble.r);
    ctx.fillStyle = `rgba(230, 241, 238, ${a})`;
    ctx.fillRect(p.x, p.y, r, 1);
    ctx.fillRect(p.x, p.y + r - 1, r, 1);
    ctx.fillRect(p.x, p.y, 1, r);
    ctx.fillRect(p.x + r - 1, p.y, 1, r);
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.fillRect(p.x + 1, p.y + 1, 1, 1);
  }

  const you = sim.divers.find((d) => d.id === focusId);
  if (you && you.region === regionId) {
    const p = screen(camX, camY, you.x, you.y);
    const glow = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 150);
    glow.addColorStop(0, "rgba(62, 224, 197, 0.18)");
    glow.addColorStop(1, "rgba(2, 8, 12, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  const maw = sim.creatures.find((c) => c.kind === "maw" && c.alive && c.region === regionId && c.aggro);
  if (maw && (maw.state === "warn" || maw.state === "open")) {
    const p = screen(camX, camY, maw.x, maw.y);
    ctx.strokeStyle = maw.state === "open" ? "rgba(231, 160, 74, 0.9)" : "rgba(62, 224, 197, 0.7)";
    ctx.beginPath();
    const m = Math.hypot(maw.aimX, maw.aimY) || 1;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (maw.aimX / m) * 70, p.y + (maw.aimY / m) * 50);
    ctx.stroke();
    if (maw.state === "open") {
      ctx.fillStyle = "rgba(231, 160, 74, 0.85)";
      ctx.font = "10px Outfit, sans-serif";
      ctx.fillText("OPEN", p.x - 16, p.y - 28);
    }
  }

  for (const sentry of sim.creatures) {
    if (!sentry.alive || sentry.region !== regionId || sentry.kind !== "sentry" || sentry.state !== "warn") continue;
    const p = screen(camX, camY, sentry.x, sentry.y);
    const m = Math.hypot(sentry.aimX, sentry.aimY) || 1;
    ctx.strokeStyle = "rgba(231, 160, 74, 0.85)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (sentry.aimX / m) * 64, p.y + (sentry.aimY / m) * 48);
    ctx.stroke();
  }
  for (const bloom of sim.creatures) {
    if (!bloom.alive || bloom.region !== regionId || bloom.kind !== "bloom") continue;
    if (bloom.state !== "warn" && bloom.state !== "pulse") continue;
    const p = screen(camX, camY, bloom.x, bloom.y);
    ctx.strokeStyle = bloom.state === "pulse" ? "rgba(231, 160, 74, 0.9)" : "rgba(62, 224, 197, 0.55)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 28, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(2, 8, 12, 0.45)";
  ctx.fillRect(0, 0, VIEW_W, 18);
  ctx.fillRect(0, VIEW_H - 22, VIEW_W, 22);
}

function gouge(ctx: CanvasRenderingContext2D, camX: number, camY: number, x: number, y: number) {
  const p = screen(camX, camY, x, y);
  if (p.x < -40 || p.y < -40 || p.x > VIEW_W + 40 || p.y > VIEW_H + 40) return;
  ctx.strokeStyle = "rgba(231, 160, 74, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + 22, p.y - 10);
  ctx.moveTo(p.x + 6, p.y + 4);
  ctx.lineTo(p.x + 28, p.y - 4);
  ctx.moveTo(p.x + 2, p.y + 10);
  ctx.lineTo(p.x + 18, p.y + 2);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawVehicle(
  ctx: CanvasRenderingContext2D,
  art: Art,
  vehicle: Vehicle,
  camX: number,
  camY: number,
  time: number,
) {
  const p = screen(camX, camY, vehicle.x, vehicle.y);
  const stage = hullStage(vehicle);
  ctx.save();
  if (stage >= 2) ctx.globalAlpha = 0.85;
  if (vehicle.destroyed) ctx.globalAlpha = 0.55;
  if (vehicle.kind === "barrow") blit(ctx, art.barrow, 1, 1, 0, p.x, p.y, 176, 72, vehicle.facing < 0);
  else if (vehicle.kind === "kite") blit(ctx, art.kite, 1, 1, 0, p.x, p.y, 148, 78, vehicle.facing < 0);
  else blit(ctx, art.scooter, 1, 1, 0, p.x, p.y, 64, 32, vehicle.facing < 0);
  ctx.restore();
  if (vehicle.shield > 0) {
    ctx.strokeStyle = "rgba(62, 224, 197, 0.9)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, vehicle.kind === "scooter" ? 28 : 78, vehicle.kind === "scooter" ? 14 : 28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (stage >= 1 && !vehicle.destroyed && Math.sin(time * 20) > 0) {
    ctx.fillStyle = "#e7a04a";
    ctx.fillRect(p.x + 10, p.y - 8, 3, 3);
  }
}

function drawCreature(
  ctx: CanvasRenderingContext2D,
  art: Art,
  creature: Creature,
  camX: number,
  camY: number,
  time: number,
) {
  const p = screen(camX, camY, creature.x, creature.y);
  const flip = creature.facing < 0;
  const frame =
    creature.kind === "maw"
      ? creature.state === "warn"
        ? 1
        : creature.state === "dash" || creature.state === "open"
          ? 2
          : Math.floor(time * 3) % 2 === 0
            ? 0
            : 3
      : creature.state === "lunge"
        ? 2
        : creature.state === "warn"
          ? 1
          : Math.floor(time * 4 + creature.x) % 4;
  ctx.save();
  if (creature.hurt > 0) ctx.filter = "brightness(2)";
  if (creature.kind === "darter") blit(ctx, art.darter, 2, 2, frame % 4, p.x, p.y, 36, 18, flip);
  else if (creature.kind === "sentry") blit(ctx, art.sentry, 2, 2, frame % 4, p.x, p.y, 48, 36, flip);
  else if (creature.kind === "bloom") blit(ctx, art.bloom, 2, 2, Math.floor(time * 3) % 4, p.x, p.y, 64, 56, flip);
  else if (creature.kind === "eel") blit(ctx, art.eel, 2, 2, frame % 4, p.x, p.y, 78, 36, flip);
  else if (creature.kind === "hunter") {
    ctx.filter = creature.hurt > 0 ? "brightness(2)" : "hue-rotate(-18deg) saturate(1.3)";
    blit(ctx, art.eel, 2, 2, frame % 4, p.x, p.y, 104, 48, flip);
  } else blit(ctx, art.maw, 2, 2, frame % 4, p.x, p.y, 196, 104, flip);
  ctx.restore();
  if (creature.kind !== "darter") {
    const w = creature.kind === "maw" ? 70 : 28;
    ctx.fillStyle = "rgba(2,8,12,0.7)";
    ctx.fillRect(p.x - w / 2, p.y - (creature.kind === "maw" ? 58 : 28), w, 3);
    ctx.fillStyle = creature.kind === "maw" && creature.state === "open" ? "#e7a04a" : "#c4553a";
    ctx.fillRect(p.x - w / 2, p.y - (creature.kind === "maw" ? 58 : 28), w * Math.max(0, creature.hp / creature.hpMax), 3);
  }
}

function drawDiver(
  ctx: CanvasRenderingContext2D,
  art: Art,
  diver: Diver,
  camX: number,
  camY: number,
  time: number,
  focus: boolean,
) {
  const p = screen(camX, camY, diver.x, diver.y);
  const frame = Math.floor(time * 6) % 4;
  ctx.save();
  if (diver.iframe > 0 && Math.sin(time * 40) > 0) ctx.globalAlpha = 0.45;
  if (diver.tint === "partner") ctx.filter = "hue-rotate(200deg) saturate(0.9)";
  else if (diver.tint === "ai") ctx.filter = "hue-rotate(35deg) saturate(1.15)";
  else if (diver.tint === "remote") ctx.filter = "hue-rotate(90deg)";
  if (!diver.vehicleId) blit(ctx, art.diver, 2, 2, frame, p.x, p.y, 72, 50, diver.facing < 0);
  else blit(ctx, art.diver, 2, 2, frame, p.x, p.y - 6, 28, 20, diver.facing < 0);
  ctx.restore();
  ctx.fillStyle = focus ? "#3ee0c5" : "#e6f1ee";
  ctx.font = "10px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(diver.name, p.x, p.y - (diver.vehicleId ? 22 : 28));
  ctx.textAlign = "left";
  if (focus) {
    const m = Math.hypot(diver.aimX, diver.aimY) || 1;
    const ax = diver.aimX / m;
    const ay = diver.aimY / m;
    ctx.strokeStyle = "#3ee0c5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + ax * 14, p.y + ay * 12);
    ctx.lineTo(p.x + ax * 26, p.y + ay * 22);
    ctx.stroke();
  }
}

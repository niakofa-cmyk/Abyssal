import type { Creature, Diver, RegionId, Sim, Vehicle } from "./types";
import { TILE, VIEW_H, VIEW_W } from "./types";
import { hullStage } from "./sim";

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
  }

  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
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
        ctx.strokeStyle = "rgba(231, 160, 74, 0.85)";
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
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
    }
  }

  for (const marker of sim.markers) {
    if (marker.region !== regionId) continue;
    const p = screen(camX, camY, marker.x, marker.y);
    if (marker.kind === "lore") blit(ctx, art.props, 2, 2, 3, p.x, p.y, 36, 36, false);
    else {
      ctx.strokeStyle = marker.kind === "upgrade" ? "#e7a04a" : "#3ee0c5";
      ctx.strokeRect(p.x - 10, p.y - 10, 20, 20);
    }
  }

  for (const pickup of sim.pickups) {
    if (pickup.taken || pickup.region !== regionId) continue;
    const p = screen(camX, camY, pickup.x, pickup.y);
    const frame = pickup.kind === "o2" ? 0 : pickup.kind === "med" ? 1 : pickup.kind === "ammo" ? 2 : 0;
    const bob = Math.sin(sim.time * 2 + pickup.x) * 2;
    blit(ctx, art.props, 2, 2, frame, p.x, p.y + bob, 28, 28, false);
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
    ctx.strokeStyle = `rgba(230, 241, 238, ${Math.max(0, bubble.life)})`;
    ctx.strokeRect(p.x, p.y, bubble.r, bubble.r);
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
    ctx.strokeRect(p.x - 28, p.y - 22, 56, 44);
  }

  ctx.fillStyle = "rgba(2, 8, 12, 0.45)";
  ctx.fillRect(0, 0, VIEW_W, 18);
  ctx.fillRect(0, VIEW_H - 22, VIEW_W, 22);
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
    ctx.strokeRect(p.x - 78, p.y - 28, 156, 56);
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

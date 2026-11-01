import { VIEW_H, VIEW_W } from "./types.ts";

export type OpeningBeat = "deck" | "alarm" | "flood" | "blast" | "wake";

export type OpeningState = {
  beat: OpeningBeat;
  x: number;
  t: number;
  flood: number;
  done: boolean;
};

const DOOR_X = 330;

export function createOpening(): OpeningState {
  return { beat: "deck", x: 72, t: 0, flood: 0, done: false };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

/** A short walk on the gantry. Standing still still reaches the blast. The east lock does not save you. */
export function stepOpening(state: OpeningState, dt: number, ax: number): OpeningState {
  if (state.done) return state;
  const step = Math.max(0, Math.min(dt, 0.05));
  const next: OpeningState = { ...state, t: state.t + step };
  const speed = next.beat === "flood" ? 90 : 140;
  if (next.beat === "deck" || next.beat === "alarm" || next.beat === "flood") {
    next.x = clamp(state.x + Math.max(-1, Math.min(1, ax)) * speed * step, 24, 470);
  }
  if (next.beat === "deck" && (next.x > 250 || next.t > 7)) {
    next.beat = "alarm";
    next.t = 0;
  }
  if (next.beat === "alarm") {
    if (next.t > 1.1 && next.x > DOOR_X) next.x = DOOR_X;
    if (next.t > 2.4) {
      next.beat = "flood";
      next.t = 0;
    }
  }
  if (next.beat === "flood") {
    next.flood = Math.min(1, state.flood + step * 0.28);
    if (next.x > DOOR_X) next.x = DOOR_X;
    if (next.flood > 0.92 || next.t > 5) {
      next.beat = "blast";
      next.t = 0;
    }
  }
  if (next.beat === "blast" && next.t > 1.5) {
    next.beat = "wake";
    next.t = 0;
  }
  if (next.beat === "wake" && next.t > 2.6) next.done = true;
  return next;
}

export function openingCopy(state: OpeningState) {
  if (state.beat === "deck") {
    return {
      place: "Aurelian Grid",
      line: "The heart reading is steady. The collar is quiet.",
      order: "Walk east. A is left, D is right. The console is the only light.",
    };
  }
  if (state.beat === "alarm") {
    return {
      place: "Aurelian Grid",
      line: "Spike. The heart is not steady. Evacuate east.",
      order: state.t > 1.1 ? "The east door just sealed." : "The evacuation lock is east.",
    };
  }
  if (state.beat === "flood") {
    return {
      place: "Aurelian Grid",
      line: "The gantry is taking water. Something large already crossed the east lock.",
      order: "You will not outrun this.",
    };
  }
  if (state.beat === "blast") {
    return {
      place: "The Breach",
      line: state.t > 0.7 ? "Something was already in the water. It had a light." : "The wall is gone.",
      order: "You do not know its name.",
    };
  }
  return {
    place: "The Breach",
    line: "It passed over you. It did not stop.",
    order: "Wake up. Find the loft. The name can wait.",
  };
}

export function drawOpening(ctx: CanvasRenderingContext2D, state: OpeningState, reduced = false) {
  if (state.beat === "wake") {
    drawWake(ctx, state.t, reduced);
    return;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#041016";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = "#07141c";
  ctx.fillRect(18, 28, VIEW_W - 36, 132);
  for (let x = 28; x < VIEW_W - 20; x += 16) {
    ctx.fillStyle = (x / 16) % 2 === 0 ? "#10262c" : "#0c1e24";
    ctx.fillRect(x, 176, 14, 8);
  }
  ctx.fillStyle = "#16323a";
  ctx.fillRect(36, 48, 8, 120);
  ctx.fillRect(VIEW_W - 48, 48, 8, 120);
  ctx.fillStyle = "#e7a04a";
  for (let y = 58; y < 150; y += 18) ctx.fillRect(38, y, 4, 6);

  const alarm = state.beat !== "deck";
  const blink = alarm && (Math.floor(state.t * 6) % 2 === 0);
  ctx.fillStyle = blink ? "#c4553a" : state.beat === "deck" ? "#3ee0c5" : "#5a4030";
  ctx.fillRect(276, 78, 8, 8);
  ctx.fillStyle = state.beat === "deck" ? "#0d3a36" : "#3a2414";
  ctx.fillRect(252, 96, 64, 36);
  ctx.fillStyle = state.beat === "deck" ? "#3ee0c5" : "#e7a04a";
  const bars = state.beat === "deck" ? 2 : state.beat === "alarm" ? 5 : 6;
  for (let i = 0; i < bars; i++) ctx.fillRect(258 + i * 8, 118 - i * 3, 5, 8 + i * 3);

  if (state.beat !== "deck") {
    const shut = state.beat !== "alarm" || state.t > 1.1;
    ctx.fillStyle = "#1a120c";
    ctx.fillRect(392, shut ? 72 : 24, 22, shut ? 104 : 40);
    ctx.fillStyle = shut ? "#c4553a" : "#3ee0c5";
    ctx.fillRect(398, shut ? 80 : 28, 10, 6);
    if (!shut) {
      ctx.fillStyle = "#07141c";
      ctx.fillRect(392, 64, 22, 44);
    }
  }

  if (state.flood > 0) {
    const height = Math.floor(state.flood * (VIEW_H - 40));
    const top = VIEW_H - height;
    ctx.fillStyle = "rgba(8, 48, 58, 0.78)";
    ctx.fillRect(0, top, VIEW_W, height);
    ctx.fillStyle = "rgba(186, 214, 204, 0.45)";
    ctx.fillRect(0, top, VIEW_W, 3);
    ctx.fillStyle = "rgba(230, 241, 238, 0.35)";
    for (let i = 0; i < 8; i++) {
      const bx = (i * 67 + Math.floor(state.t * 40)) % VIEW_W;
      const by = top + 12 + ((i * 23) % Math.max(8, height - 16));
      ctx.fillRect(bx, by, 3, 3);
    }
  }

  const bob = state.beat === "flood" ? Math.sin(state.t * 8) * 2 : 0;
  ctx.fillStyle = "#1a2830";
  ctx.fillRect(state.x - 2, 140 + bob, 16, 22);
  ctx.fillStyle = "#e6f1ee";
  ctx.fillRect(state.x, 146 + bob, 12, 16);
  ctx.fillStyle = blink ? "#c4553a" : "#3ee0c5";
  ctx.fillRect(state.x + 3, 142 + bob, 6, 5);

  if (state.beat === "blast") {
    const mawX = 180 + state.t * 90;
    ctx.fillStyle = "#061018";
    ctx.beginPath();
    ctx.ellipse(mawX, 150, 90, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3ee0c5";
    ctx.fillRect(mawX + 40, 142, 6, 6);
    const flash = reduced ? Math.min(0.35, state.t) : Math.min(1, state.t / 0.25);
    ctx.fillStyle = `rgba(231, 160, 74, ${Math.max(0, flash - state.t * 0.35)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (state.t > 0.55) {
      const dark = Math.min(1, (state.t - 0.55) / 0.5);
      ctx.fillStyle = `rgba(4, 16, 22, ${dark})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}

function drawWake(ctx: CanvasRenderingContext2D, t: number, reduced: boolean) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#02080c";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const pass = Math.min(1, t / 2.2);
  const body = -80 + pass * (VIEW_W + 120);
  ctx.fillStyle = "rgba(8, 18, 22, 0.95)";
  ctx.beginPath();
  ctx.ellipse(body, 70, 150, 28, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = reduced ? "#16323a" : "#3ee0c5";
  ctx.fillRect(body + 70, 62, 5, 5);
  ctx.strokeStyle = "rgba(231, 160, 74, 0.35)";
  ctx.beginPath();
  ctx.moveTo(body - 40, 88);
  ctx.lineTo(body + 20, 110);
  ctx.moveTo(body - 20, 96);
  ctx.lineTo(body + 36, 118);
  ctx.stroke();
  const diverX = 240 + Math.sin(t * 3) * 18;
  const diverY = 168 + Math.cos(t * 2) * 10;
  ctx.fillStyle = "#e6f1ee";
  ctx.fillRect(diverX, diverY, 10, 16);
  ctx.fillStyle = "#3ee0c5";
  ctx.fillRect(diverX + 2, diverY - 3, 5, 4);
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = "rgba(186, 214, 204, 0.35)";
    ctx.strokeRect(80 + i * 60, 200 - ((t * 40 + i * 17) % 80), 3, 3);
  }
  if (t > 1.8) {
    ctx.fillStyle = `rgba(4, 16, 22, ${Math.min(1, (t - 1.8) / 0.7)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

/** The shape that passed the gantry, drawn once over the breach after a fresh warning. */
export function drawPassage(ctx: CanvasRenderingContext2D, age: number) {
  const pass = Math.min(1, age / 7);
  const body = -120 + pass * (VIEW_W + 200);
  ctx.fillStyle = "rgba(2, 8, 12, 0.28)";
  ctx.beginPath();
  ctx.ellipse(body, 48, 160, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(62, 224, 197, 0.8)";
  ctx.fillRect(body + 78, 42, 4, 4);
}

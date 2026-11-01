import { VIEW_H, VIEW_W } from "./types.ts";

export const VISION_LEN = 7.2;

export function stepVision(t: number, dt: number) {
  return Math.min(VISION_LEN, t + Math.max(0, Math.min(dt, 0.05)));
}

export function visionDone(t: number) {
  return t >= VISION_LEN;
}

export function visionCopy(t: number) {
  if (t < 2.2) {
    return {
      place: "Looking up",
      line: "The water goes pale. There is weather above it.",
      order: "This is not a door.",
    };
  }
  if (t < 5) {
    return {
      place: "The surface",
      line: "Platforms stand out of drowned streets. A coastal grid is half under. Nothing answers.",
      order: "No rescue. No road home.",
    };
  }
  return {
    place: "The collar",
    line: "The lock refuses this hull, this frequency, and this year.",
    order: "The surface is still shut.",
  };
}

/** A look at the world above. It does not move the diver and it does not open the collar. */
export function drawSurfaceVision(ctx: CanvasRenderingContext2D, t: number, reduced = false) {
  ctx.imageSmoothingEnabled = false;
  const risen = t > 2.1;
  ctx.fillStyle = risen ? "#243038" : "#04141c";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (risen && !reduced) {
    ctx.fillStyle = "rgba(231, 196, 120, 0.18)";
    ctx.beginPath();
    ctx.moveTo(360, 0);
    ctx.lineTo(300, 150);
    ctx.lineTo(430, 150);
    ctx.fill();
  }
  const line = risen ? 118 : 46;
  ctx.fillStyle = risen ? "#1a2830" : "#0a3040";
  ctx.fillRect(0, line, VIEW_W, VIEW_H - line);
  ctx.fillStyle = "rgba(186, 214, 204, 0.45)";
  ctx.fillRect(0, line, VIEW_W, 3);

  const towers = [40, 78, 110, 168, 210, 250, 310, 360, 410, 460];
  const heights = [70, 48, 90, 120, 64, 150, 80, 56, 100, 42];
  for (let i = 0; i < towers.length; i++) {
    const h = heights[i] ?? 40;
    const top = line - (risen ? h : h * 0.35);
    ctx.fillStyle = i === 5 ? "#c8c2b4" : "#2a3840";
    ctx.fillRect(towers[i] ?? 0, top, i === 5 ? 18 : 28, line - top + 40);
    if (risen && i % 2 === 0) {
      ctx.fillStyle = "#1e4a34";
      ctx.fillRect(towers[i] ?? 0, top, i === 5 ? 18 : 28, 4);
    }
  }
  ctx.strokeStyle = "#8a9290";
  ctx.beginPath();
  ctx.moveTo(430, line - 20);
  ctx.lineTo(500, line - 70);
  ctx.lineTo(500, line - 20);
  ctx.stroke();

  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(20, line - 28, 70, 16);
  ctx.fillRect(34, line - 8, 6, 36);
  ctx.fillRect(70, line - 8, 6, 36);

  if (!risen) {
    ctx.fillStyle = "rgba(4, 16, 22, 0.45)";
    ctx.fillRect(0, line, VIEW_W, VIEW_H - line);
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = "rgba(230, 241, 238, 0.35)";
      ctx.strokeRect(60 + i * 58, line + 20 + ((i * 13) % 40), 3, 3);
    }
  } else {
    ctx.fillStyle = "rgba(20, 28, 32, 0.25)";
    ctx.fillRect(0, 16, 180, 28);
    ctx.fillRect(300, 8, 140, 22);
  }

  if (t > 5) {
    const shut = Math.min(1, (t - 5) / 1.6);
    const band = Math.floor(shut * (VIEW_H / 2));
    ctx.fillStyle = "#041016";
    ctx.fillRect(0, 0, VIEW_W, band);
    ctx.fillRect(0, VIEW_H - band, VIEW_W, band);
    ctx.fillStyle = "#c4553a";
    ctx.fillRect(0, band, VIEW_W, 2);
    ctx.fillRect(0, VIEW_H - band - 2, VIEW_W, 2);
  }
}

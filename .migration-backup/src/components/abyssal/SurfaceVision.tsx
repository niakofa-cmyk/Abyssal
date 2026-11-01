import { useEffect, useRef, useState } from "react";
import { VIEW_H, VIEW_W } from "@/game/types";
import { drawSurfaceVision, stepVision, visionCopy, visionDone } from "@/game/vision";

export function SurfaceVision({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const doneRef = useRef(onDone);
  const finished = useRef(false);
  doneRef.current = onDone;
  const [copy, setCopy] = useState(() => visionCopy(0));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tRef.current = stepVision(tRef.current, media.matches ? dt * 1.6 : dt);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawSurfaceVision(ctx, tRef.current, media.matches);
      const next = visionCopy(tRef.current);
      setCopy((prev) => (prev.line === next.line ? prev : next));
      if (visionDone(tRef.current)) {
        if (!finished.current) {
          finished.current = true;
          doneRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 z-20 bg-deep">
      <div className="absolute inset-0 grid place-items-center [container-type:size]">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="bg-deep"
          style={{
            imageRendering: "pixelated",
            aspectRatio: `${VIEW_W} / ${VIEW_H}`,
            width: "min(100cqw, calc(100cqh * 512 / 288))",
            height: "auto",
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4">
        <div className="border border-line bg-deep/80 p-3">
          <p className="text-[10px] tracking-[0.18em] text-amber uppercase">{copy.place}</p>
          <p className="mt-2 max-w-md text-sm text-foam">{copy.line}</p>
        </div>
        <p className="mx-auto text-xs text-mist">{copy.order}</p>
      </div>
      <button
        type="button"
        className="absolute right-3 bottom-3 h-11 border border-line bg-deep/85 px-3 text-xs text-mist"
        onClick={() => {
          if (finished.current) return;
          finished.current = true;
          doneRef.current();
        }}
      >
        The collar is shut
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { VIEW_H, VIEW_W } from "@/game/types";
import { createOpening, drawOpening, openingCopy, stepOpening, type OpeningBeat, type OpeningState } from "@/game/opening";
import type { SeaAudio } from "@/game/audio";

export function Opening({ onDone, audio }: { onDone: () => void; audio: SeaAudio }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OpeningState>(createOpening());
  const axis = useRef(0);
  const doneRef = useRef(onDone);
  const finished = useRef(false);
  doneRef.current = onDone;
  const audioRef = useRef(audio);
  audioRef.current = audio;
  const [copy, setCopy] = useState(() => openingCopy(createOpening()));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onKey = (event: KeyboardEvent) => {
      if (event.type === "keydown") audioRef.current.unlock();
      if (event.code === "KeyA" || event.code === "ArrowLeft") axis.current = event.type === "keydown" ? -1 : axis.current === -1 ? 0 : axis.current;
      if (event.code === "KeyD" || event.code === "ArrowRight") axis.current = event.type === "keydown" ? 1 : axis.current === 1 ? 0 : axis.current;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    let raf = 0;
    let last = performance.now();
    let lastBeat: OpeningBeat = "deck";
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stateRef.current = stepOpening(stateRef.current, dt, axis.current);
      if (stateRef.current.beat !== lastBeat) {
        if (
          stateRef.current.beat === "alarm" ||
          stateRef.current.beat === "flood" ||
          stateRef.current.beat === "blast" ||
          stateRef.current.beat === "wake"
        ) {
          audioRef.current.cue(stateRef.current.beat);
        }
        lastBeat = stateRef.current.beat;
      }
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawOpening(ctx, stateRef.current, media.matches);
      const next = openingCopy(stateRef.current);
      setCopy((prev) => (prev.line === next.line && prev.order === next.order ? prev : next));
      if (stateRef.current.done) {
        if (!finished.current) {
          finished.current = true;
          doneRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  function skip() {
    if (finished.current) return;
    finished.current = true;
    doneRef.current();
  }

  return (
    <main className="relative h-full min-h-full overflow-hidden bg-deep text-foam">
      <div className="absolute inset-0 grid place-items-center [container-type:size]">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="bg-deep"
          style={{
            imageRendering: "pixelated",
            touchAction: "none",
            aspectRatio: `${VIEW_W} / ${VIEW_H}`,
            width: "min(100cqw, calc(100cqh * 512 / 288))",
            height: "auto",
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4">
        <div className="border border-line bg-deep/80 p-3">
          <p className="text-[10px] tracking-[0.18em] text-biolume uppercase">{copy.place}</p>
          <p className="mt-2 max-w-md text-sm text-foam">{copy.line}</p>
        </div>
        <div className="mx-auto mb-1 max-w-lg text-center">
          <p className="text-[10px] tracking-[0.18em] text-amber uppercase">The warning</p>
          <p className="mt-1 text-xs text-mist">{copy.order}</p>
        </div>
      </div>
      <div className="absolute right-3 bottom-3 flex gap-2 md:right-4">
        <button type="button" className="h-11 border border-line bg-deep/85 px-3 text-xs" onPointerDown={() => { audio.unlock(); axis.current = -1; }} onPointerUp={() => (axis.current = 0)} onPointerLeave={() => (axis.current = 0)}>
          Left
        </button>
        <button type="button" className="h-11 border border-line bg-deep/85 px-3 text-xs" onPointerDown={() => { audio.unlock(); axis.current = 1; }} onPointerUp={() => (axis.current = 0)} onPointerLeave={() => (axis.current = 0)}>
          Right
        </button>
        <button type="button" className="h-11 border border-line bg-deep/85 px-3 text-xs text-mist" onClick={skip}>
          Skip the warning
        </button>
      </div>
    </main>
  );
}

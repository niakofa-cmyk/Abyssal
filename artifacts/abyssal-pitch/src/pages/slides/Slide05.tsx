const base = import.meta.env.BASE_URL;

export default function Slide05() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute inset-y-0 left-0 w-[43vw]">
        <img
          src={`${base}abyssal/bg/works.jpg`}
          crossOrigin="anonymous"
          alt="Abandoned underwater infrastructure"
          className="h-full w-full object-cover object-[58%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg/35 to-bg" />
        <div className="absolute inset-y-0 left-0 w-[18vw] bg-gradient-to-r from-bg/60 to-transparent" />
      </div>
      <div className="absolute left-[6vw] top-[8vh] w-[53vw]">
        <h1 className="mt-[2vh] font-display text-[4vw] leading-[1.02] text-foam">DISCOVER THE TRUTH. DON&apos;T JUST READ IT.</h1>
        <p className="mt-[2vh] font-display text-[2.2vw] leading-tight text-accent">The ocean is an archaeological mystery.</p>
        <p className="mt-[3vh] font-body text-[1.8vw] leading-[1.27] text-foam/90">
          Its records disagree. Its machinery tells a different story from its official reports. Its ruins preserve fragments of lives that disappeared.
        </p>
        <p className="mt-[1.6vh] font-body text-[1.8vw] leading-[1.27] text-foam/90">
          Players investigate the truth by exploring, observing, recovering evidence, and connecting discoveries.
        </p>
        <div className="mt-[2.4vh] grid grid-cols-2 gap-x-[2vw] gap-y-[1.4vh] font-body text-[1.55vw] leading-[1.2] text-foam">
          <p><span className="mr-[0.6vw] text-primary">•</span>Recover historical archives and emergency recordings.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Investigate research stations and abandoned infrastructure.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Build a personal journal of discoveries.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Combine evidence from different regions to reconstruct larger investigations.</p>
          <p className="col-span-2"><span className="mr-[0.6vw] text-primary">•</span>Discover that understanding the ocean may be more important than defeating its creatures.</p>
        </div>
        <div className="mt-[3vh] border-t border-primary/45 pt-[1.7vh]">
          <p className="font-body text-[1.5vw] font-semibold uppercase tracking-[0.14em] text-primary">Design principle</p>
          <p className="mt-[1vh] font-display text-[2vw] leading-[1.18] text-foam">
            Every major location should offer something to discover, something to experience, and something to understand.
          </p>
        </div>
      </div>
    </div>
  );
}

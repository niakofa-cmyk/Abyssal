export default function Slide08() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute right-0 top-0 h-full w-[38vw] bg-hull" />
      <div className="absolute left-[6vw] top-[8vh] w-[88vw]">
        <h1 className="mt-[1.7vh] max-w-[70vw] font-display text-[4vw] leading-[1.02] text-foam">A DIVE THAT CAN CONTINUE</h1>
        <p className="mt-[1.4vh] font-display text-[2.1vw] leading-tight text-accent">Persistence is part of the experience.</p>
        <div className="mt-[3vh] grid grid-cols-[1.05fr_0.95fr] gap-[4vw]">
          <div>
            <p className="font-body text-[1.75vw] leading-[1.25] text-foam/90">
              Abyssal is being developed around a persistent-ocean model rather than treating every expedition as a disposable room.
            </p>
            <p className="mt-[2vh] font-body text-[1.5vw] font-semibold uppercase tracking-[0.14em] text-primary">The current implementation includes</p>
            <div className="mt-[1.5vh] space-y-[1.15vh] font-body text-[1.55vw] leading-[1.2] text-foam">
              <p><span className="mr-[0.6vw] text-primary">•</span>Persistent diver identity tied to a browser beacon.</p>
              <p><span className="mr-[0.6vw] text-primary">•</span>Saved diver position, air, journal, and vehicle-seat state.</p>
              <p><span className="mr-[0.6vw] text-primary">•</span>Region-specific simulation for occupied sectors.</p>
              <p><span className="mr-[0.6vw] text-primary">•</span>Shared creature and vehicle state within the ocean process.</p>
              <p><span className="mr-[0.6vw] text-primary">•</span>A separate experimental browser-to-browser multiplayer room.</p>
            </div>
            <p className="mt-[2.2vh] border-t border-line pt-[1.5vh] font-body text-[1.5vw] leading-[1.25] text-mist">
              <span className="font-semibold text-accent">Technical distinction:</span> The experimental browser-to-browser room is not the persistent ocean. The persistent architecture is implemented in the repository, but its deployed reliability and multiplayer scale must be established through live certification.
            </p>
          </div>
          <div className="relative flex flex-col justify-center bg-primary p-[1.5vw] text-bg">
            <div className="border border-bg/35 bg-bg/10 p-[1.5vw]">
              <p className="font-body text-[1.5vw] font-semibold uppercase tracking-[0.14em] text-bg">PERSISTENCE MODEL</p>
              <div className="mt-[2.3vh] grid grid-cols-3 gap-[0.8vw]">
                <div className="border border-primary/60 bg-ink px-[0.8vw] py-[1.2vh] text-primary">
                  <p className="font-body text-[1.5vw] font-bold uppercase tracking-[0.1em]">Occupied</p>
                  <p className="mt-[0.6vh] font-body text-[1.5vw] leading-tight">Simulate</p>
                </div>
                <div className="border border-primary/60 bg-ink px-[0.8vw] py-[1.2vh] text-primary">
                  <p className="font-body text-[1.5vw] font-bold uppercase tracking-[0.1em]">Occupied</p>
                  <p className="mt-[0.6vh] font-body text-[1.5vw] leading-tight">Simulate</p>
                </div>
                <div className="border border-bg/50 bg-hull px-[0.8vw] py-[1.2vh] text-foam">
                  <p className="font-body text-[1.5vw] font-bold uppercase tracking-[0.1em]">Empty</p>
                  <p className="mt-[0.6vh] font-body text-[1.5vw] leading-tight">Sleep</p>
                </div>
              </div>
              <div className="mt-[2.4vh] flex items-center gap-[1vw]">
                <div className="h-[1px] flex-1 bg-bg/50" />
                <span className="font-body text-[1.5vw] uppercase tracking-[0.1em] text-bg">Ocean process</span>
                <div className="h-[1px] flex-1 bg-bg/50" />
              </div>
            </div>
            <p className="mt-[2.4vh] max-w-[35vw] font-body text-[1.65vw] leading-[1.25] text-bg">
              The intended direction is a dependable shared world in which cooperative exploration can continue across visits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

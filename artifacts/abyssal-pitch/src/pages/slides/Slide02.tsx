const base = import.meta.env.BASE_URL;

export default function Slide02() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute inset-y-0 right-0 w-[47vw]">
        <img
          src={`${base}abyssal/bg/breach.jpg`}
          crossOrigin="anonymous"
          alt="The Breach underwater research facility"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/35 to-transparent" />
        <div className="absolute bottom-0 right-0 h-[22vh] w-full bg-gradient-to-t from-bg/90 to-transparent" />
      </div>
      <div className="absolute left-[6vw] top-[8vh] w-[54vw]">
        <h1 className="mt-[2vh] max-w-[53vw] font-display text-[3.8vw] leading-[1.04] text-foam">
          THE OCEAN DOESN&apos;T END AT THE EDGE OF YOUR SCREEN
        </h1>
        <p className="mt-[2vh] max-w-[47vw] font-body text-[2vw] leading-tight text-accent">
          A world that exists beyond your immediate surroundings.
        </p>
        <div className="mt-[4vh] space-y-[1.9vh] font-body text-[1.85vw] leading-[1.27] text-foam/90">
          <p><span className="mr-[0.8vw] text-primary">•</span>Explore interconnected underwater regions with distinct environments, threats, and discoveries.</p>
          <p><span className="mr-[0.8vw] text-primary">•</span>Occupied regions simulate independently; empty regions can sleep until needed.</p>
          <p><span className="mr-[0.8vw] text-primary">•</span>Encounter other divers as your paths converge.</p>
          <p><span className="mr-[0.8vw] text-primary">•</span>Return to the same dive and continue your expedition.</p>
        </div>
        <div className="mt-[4vh] max-w-[49vw] bg-primary p-[1.5vw]">
          <p className="font-body text-[1.5vw] font-semibold uppercase tracking-[0.14em] text-bg">The promise</p>
          <p className="mt-[1vh] font-body text-[1.8vw] leading-[1.25] text-bg">
            The ocean is more than a collection of levels. It is a connected world built to support continuing exploration.
          </p>
        </div>
      </div>
    </div>
  );
}

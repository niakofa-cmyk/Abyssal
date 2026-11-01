const base = import.meta.env.BASE_URL;

export default function Slide06() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute right-0 top-0 h-full w-[38vw] bg-hull" />
      <div className="absolute left-[6vw] top-[8vh] w-[88vw]">
        <h1 className="mt-[1.7vh] max-w-[79vw] font-display text-[3.8vw] leading-[1.04] text-foam">
          SURVIVE TOGETHER. EVERY ROLE MATTERS.
        </h1>
        <p className="mt-[1.6vh] max-w-[76vw] font-display text-[2vw] leading-tight text-accent">
          The right crew can make the difference between discovery and disaster.
        </p>
        <div className="mt-[2.3vh] flex items-center gap-[3vw]">
          <div className="relative flex h-[25vh] w-[39vw] items-center justify-center overflow-hidden border border-line bg-ink">
            <img
              src={`${base}abyssal/sprites/barrow.png`}
              crossOrigin="anonymous"
              alt="Barrow cooperative submersible"
              className="w-[36vw] object-contain [image-rendering:pixelated]"
            />
            <img
              src={`${base}abyssal/sprites/diver.png`}
              crossOrigin="anonymous"
              alt="A diver outside the vehicle"
              className="absolute bottom-[2vh] right-[2vw] w-[4vw] [image-rendering:pixelated]"
            />
          </div>
          <p className="max-w-[42vw] font-body text-[1.8vw] leading-[1.25] text-foam/90">
            Abyssal&apos;s vehicles provide the foundation for cooperative exploration and shared responsibilities.
          </p>
        </div>
        <div className="mt-[2.4vh] grid grid-cols-4 gap-[1.2vw] bg-primary p-[1.5vw]">
          <div className="border-t-2 border-bg pt-[1.2vh]">
            <p className="font-body text-[1.5vw] font-bold tracking-[0.1em] text-bg">PILOT</p>
            <p className="mt-[0.8vh] font-body text-[1.6vw] leading-[1.2] text-bg">Navigate dangerous passages and guide the expedition.</p>
          </div>
          <div className="border-t-2 border-bg pt-[1.2vh]">
            <p className="font-body text-[1.5vw] font-bold tracking-[0.1em] text-bg">GUNNER</p>
            <p className="mt-[0.8vh] font-body text-[1.6vw] leading-[1.2] text-bg">Operate the vehicle&apos;s weapon system and respond to threats.</p>
          </div>
          <div className="border-t-2 border-bg pt-[1.2vh]">
            <p className="font-body text-[1.5vw] font-bold tracking-[0.1em] text-bg">ENGINEER</p>
            <p className="mt-[0.8vh] font-body text-[1.6vw] leading-[1.2] text-bg">Manage repairs and support vehicle survival.</p>
          </div>
          <div className="border-t-2 border-bg pt-[1.2vh]">
            <p className="font-body text-[1.5vw] font-bold tracking-[0.1em] text-bg">DIVER</p>
            <p className="mt-[0.8vh] font-body text-[1.6vw] leading-[1.2] text-bg">Leave the vehicle to investigate wreckage, recover evidence, and explore places too dangerous or narrow for a submarine.</p>
          </div>
        </div>
        <p className="mt-[2.2vh] max-w-[83vw] font-body text-[1.65vw] leading-[1.23] text-foam/90">
          Players can board vehicles, occupy different seats, and cooperate during an expedition.
        </p>
        <p className="mt-[1.2vh] max-w-[83vw] border-l-2 border-accent pl-[1.2vw] font-body text-[1.55vw] leading-[1.22] text-mist">
          The larger vision is to develop this foundation into coordinated deep-sea missions in which crew members must communicate, make difficult decisions, and respond to changing conditions.
        </p>
      </div>
    </div>
  );
}

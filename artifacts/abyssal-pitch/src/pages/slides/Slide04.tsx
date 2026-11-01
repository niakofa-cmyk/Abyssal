const base = import.meta.env.BASE_URL;

export default function Slide04() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute right-0 top-0 h-full w-[34vw] bg-hull" />
      <div className="absolute left-[6vw] top-[7vh] w-[86vw]">
        <h1 className="font-display text-[4vw] leading-[1.02] text-foam">FIVE REGIONS. ONE DESCENT INTO THE UNKNOWN.</h1>
        <p className="mt-[1.3vh] font-body text-[1.9vw] text-accent">Every region reveals another part of the world.</p>
        <div className="relative mt-[3vh] space-y-[1.3vh]">
          <div className="absolute left-[7.25vw] top-[3vh] h-[47vh] w-[1px] bg-primary/60" />
          <div className="relative flex h-[9.5vh] items-center gap-[2vw]">
            <img src={`${base}abyssal/bg/breach.jpg`} crossOrigin="anonymous" alt="The Breach" className="h-[9.5vh] w-[14.5vw] object-cover" />
            <div className="w-[12vw] font-display text-[2vw] leading-tight text-foam">THE BREACH</div>
            <div className="w-[9vw] font-body text-[1.8vw] font-semibold text-primary">140 m</div>
            <p className="flex-1 font-body text-[1.75vw] leading-tight text-foam/90">A destroyed facility, the opening disaster, and the first clues.</p>
          </div>
          <div className="relative flex h-[9.5vh] items-center gap-[2vw]">
            <img src={`${base}abyssal/bg/plains.jpg`} crossOrigin="anonymous" alt="Abyssal Plains" className="h-[9.5vh] w-[14.5vw] object-cover" />
            <div className="w-[12vw] font-display text-[2vw] leading-tight text-foam">ABYSSAL PLAINS</div>
            <div className="w-[9vw] font-body text-[1.8vw] font-semibold text-primary">310 m</div>
            <p className="flex-1 font-body text-[1.75vw] leading-tight text-foam/90">An exposed deep-ocean landscape where the Lantern Maw becomes part of the mystery.</p>
          </div>
          <div className="relative flex h-[9.5vh] items-center gap-[2vw]">
            <img src={`${base}abyssal/bg/city.jpg`} crossOrigin="anonymous" alt="Submerged City" className="h-[9.5vh] w-[14.5vw] object-cover" />
            <div className="w-[12vw] font-display text-[2vw] leading-tight text-foam">SUBMERGED CITY</div>
            <div className="w-[9vw] font-body text-[1.8vw] font-semibold text-primary">90 m</div>
            <p className="flex-1 font-body text-[1.75vw] leading-tight text-foam/90">The remains of a settlement whose records reveal how people lived beneath the sea.</p>
          </div>
          <div className="relative flex h-[9.5vh] items-center gap-[2vw]">
            <img src={`${base}abyssal/bg/works.jpg`} crossOrigin="anonymous" alt="Industrial Depths" className="h-[9.5vh] w-[14.5vw] object-cover" />
            <div className="w-[12vw] font-display text-[2vw] leading-tight text-foam">INDUSTRIAL DEPTHS</div>
            <div className="w-[9vw] font-body text-[1.8vw] font-semibold text-primary">260 m</div>
            <p className="flex-1 font-body text-[1.75vw] leading-tight text-foam/90">Abandoned infrastructure, machinery, and evidence of the systems that sustained underwater civilization.</p>
          </div>
          <div className="relative flex h-[9.5vh] items-center gap-[2vw]">
            <img src={`${base}abyssal/bg/reef.jpg`} crossOrigin="anonymous" alt="Living Reef" className="h-[9.5vh] w-[14.5vw] object-cover" />
            <div className="w-[12vw] font-display text-[2vw] leading-tight text-foam">LIVING REEF</div>
            <div className="w-[9vw] font-body text-[1.8vw] font-semibold text-primary">70 m</div>
            <p className="flex-1 font-body text-[1.75vw] leading-tight text-foam/90">A biologically rich environment where the ocean&apos;s living systems become part of the exploration.</p>
          </div>
        </div>
        <p className="absolute bottom-[-7vh] left-0 max-w-[60vw] font-body text-[1.5vw] leading-tight text-mist">
          Depths are representative game-world labels, not a claim of real-world oceanographic accuracy.
        </p>
        <p className="absolute bottom-[-7vh] right-[2vw] max-w-[25vw] text-right font-body text-[1.5vw] leading-tight text-mist">
          The trench, upper ocean, and surface remain future campaign destinations until implemented and verified.
        </p>
      </div>
    </div>
  );
}

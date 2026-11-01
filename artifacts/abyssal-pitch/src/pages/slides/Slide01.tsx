const base = import.meta.env.BASE_URL;

export default function Slide01() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <img
        src={`${base}abyssal/bg/breach.jpg`}
        crossOrigin="anonymous"
        alt="A diver suspended beneath the wreckage of an underwater structure"
        className="absolute inset-0 h-full w-full object-cover object-[center_48%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-bg/10" />
      <div className="absolute inset-y-0 left-0 w-[2vw] bg-primary" />
      <div className="absolute left-[8vw] top-[11vh] max-w-[56vw]">
        <p className="font-body text-[1.5vw] font-semibold uppercase tracking-[0.18em] text-primary">
          THE DESCENT BEGINS
        </p>
        <h1 className="mt-[4vh] font-display text-[6.5vw] leading-[0.98] text-foam">
          <span className="block">ABYSSAL:</span>
          <span className="block">THE LAST ASCENT</span>
        </h1>
        <p className="mt-[3vh] max-w-[43vw] font-display text-[2.5vw] leading-tight text-accent">
          A cooperative descent through an ocean that remembers.
        </p>
        <p className="mt-[3vh] max-w-[43vw] font-body text-[1.9vw] leading-[1.35] text-foam/90">
          An underwater survival and exploration adventure where every expedition brings players closer to a lost civilization, a catastrophic mystery, and something waiting in the deep.
        </p>
      </div>
    </div>
  );
}

const base = import.meta.env.BASE_URL;

export default function Slide10() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <img
        src={`${base}abyssal/bg/breach.jpg`}
        crossOrigin="anonymous"
        alt="A lone diver suspended in the darkness beneath an underwater structure"
        className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/70 to-bg/15" />
      <div className="absolute left-0 top-0 h-full w-[2vw] bg-primary" />
      <div className="absolute left-[8vw] top-[15vh] max-w-[66vw]">
        <h1 className="mt-[2vh] font-display text-[5.4vw] leading-[1.02] text-foam">DESCEND TOGETHER. FIND WHAT HAPPENED.</h1>
        <p className="mt-[4vh] max-w-[55vw] font-display text-[2.5vw] leading-tight text-accent">
          The wreck still holds records, and they do not agree.
        </p>
        <p className="mt-[3vh] max-w-[55vw] font-body text-[1.9vw] leading-[1.3] text-foam/90">
          Abyssal: The Last Ascent is a cooperative underwater survival and exploration game built around discovery, historical mystery, dangerous encounters, and a world that can persist beyond a single dive.
        </p>
        <p className="mt-[2vh] max-w-[48vw] font-body text-[1.9vw] leading-[1.3] text-foam/90">
          Its ambition is not simply to create a larger ocean.
        </p>
        <p className="mt-[1.4vh] max-w-[48vw] font-display text-[2.5vw] leading-tight text-primary">
          It is to create an ocean worth understanding.
        </p>
        <p className="mt-[4vh] font-body text-[1.6vw] font-semibold uppercase tracking-[0.16em] text-foam">
          Explore the ruins. Survive the deep. Reconstruct the truth.
        </p>
      </div>
    </div>
  );
}

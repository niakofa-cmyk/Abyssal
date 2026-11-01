const base = import.meta.env.BASE_URL;

export default function Slide09() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute inset-y-0 right-0 w-[48vw]">
        <img
          src={`${base}abyssal/x-banner.jpg`}
          crossOrigin="anonymous"
          alt="A distant shaft of light rises above an underwater city"
          className="h-full w-full object-cover object-[88%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/55 to-bg/10" />
      </div>
      <div className="absolute left-[7vw] top-[9vh] w-[56vw]">
        <h1 className="mt-[2vh] max-w-[55vw] font-display text-[3.9vw] leading-[1.04] text-foam">
          THE BIGGER MYSTERY IS STILL ABOVE YOU
        </h1>
        <p className="mt-[2vh] inline-block bg-primary px-[1.2vw] py-[0.7vh] font-display text-[2.3vw] leading-tight text-bg">The deepest discovery may not be at the bottom.</p>
        <p className="mt-[3vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          The underwater world is the beginning of the journey, not its entire destination.
        </p>
        <p className="mt-[1.5vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          As players recover evidence, they begin to question what happened to the civilization above the waves.
        </p>
        <p className="mt-[1.5vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          The long-term campaign will lead toward deeper regions, the origins of the ocean&apos;s mysteries, and an eventual ascent to the surface.
        </p>
        <p className="mt-[1.5vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          The surface is intended to be a major narrative revelation, not simply another level.
        </p>
        <p className="mt-[1.5vh] max-w-[50vw] font-display text-[1.8vw] leading-[1.3] text-accent">
          What remains of the world above? What did humanity leave behind? And what will the player discover that changes the meaning of the entire expedition?
        </p>
        <p className="mt-[2vh] max-w-[52vw] border-t border-line pt-[1.5vh] font-body text-[1.5vw] leading-[1.25] text-mist">
          <span className="font-semibold text-primary">Future campaign ambition:</span> Expand the underwater journey toward the abyssal trench and, eventually, a playable surface chapter.
        </p>
        <p className="mt-[1.1vh] max-w-[52vw] font-body text-[1.5vw] leading-[1.2] text-mist">
          These destinations are planned elements of the larger vision, not claims about currently playable content.
        </p>
      </div>
    </div>
  );
}

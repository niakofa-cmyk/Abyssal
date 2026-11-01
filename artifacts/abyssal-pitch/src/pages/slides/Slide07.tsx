const base = import.meta.env.BASE_URL;

export default function Slide07() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <img
        src={`${base}abyssal/bg/plains.jpg`}
        crossOrigin="anonymous"
        alt="The Abyssal Plains disappear into dark water"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/35" />
      <div className="absolute right-[6vw] top-[15vh] h-[58vh] w-[58vh] overflow-hidden opacity-90">
        <img
          src={`${base}abyssal/sprites/maw.png`}
          crossOrigin="anonymous"
          alt="Lantern Maw sprite from the game"
          className="absolute left-0 top-0 h-[200%] w-[200%] max-w-none [image-rendering:pixelated]"
        />
      </div>
      <div className="absolute left-[7vw] top-[9vh] z-10 w-[57vw]">
        <h1 className="mt-[2vh] font-display text-[3.7vw] leading-[1.04] text-foam">
          THE OCEAN IS ALIVE. THE MAW IS NOT JUST A BOSS.
        </h1>
        <p className="mt-[2vh] font-display text-[2.4vw] leading-tight text-accent">Something lives in the darkness.</p>
        <p className="mt-[3vh] max-w-[53vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          The Lantern Maw is more than a target to defeat. It is part of the world&apos;s mystery.
        </p>
        <p className="mt-[1.4vh] max-w-[53vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          Players encounter clues to its presence, investigate its history, and confront the danger it represents.
        </p>
        <div className="mt-[2.5vh] space-y-[1.3vh] font-body text-[1.65vw] leading-tight text-foam">
          <p><span className="mr-[0.6vw] text-primary">•</span>Creatures patrol their environments.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Threats require observation, timing, and preparation.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>The Maw has recognizable encounter states and a place in the evolving narrative.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>The archive preserves evidence about its history and significance.</p>
        </div>
        <p className="mt-[2.6vh] max-w-[55vw] border-t border-line pt-[1.6vh] font-body text-[1.55vw] leading-[1.25] text-mist">
          <span className="font-semibold text-accent">The future ambition:</span> Build a richer ecosystem in which creatures respond to disturbance, inhabit territories, and influence the risks of exploration.
        </p>
        <p className="mt-[1.3vh] max-w-[55vw] font-body text-[1.55vw] leading-[1.25] text-foam/85">
          The long-term goal is to make players wonder whether they should fight, evade, distract, or simply observe what they have found.
        </p>
      </div>
    </div>
  );
}

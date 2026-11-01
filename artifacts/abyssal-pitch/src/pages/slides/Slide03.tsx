const base = import.meta.env.BASE_URL;

export default function Slide03() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-foam">
      <div className="absolute inset-y-0 right-0 w-[48vw]">
        <img
          src={`${base}abyssal/bg/works.jpg`}
          crossOrigin="anonymous"
          alt="A diver moving through the damaged industrial gantry"
          className="h-full w-full object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-t from-bg to-transparent" />
      </div>
      <div className="absolute left-[6vw] top-[8vh] w-[55vw]">
        <h1 className="mt-[2vh] max-w-[51vw] font-display text-[4vw] leading-[1.02] text-foam">
          THE CATASTROPHE IS ONLY THE BEGINNING
        </h1>
        <p className="mt-[2vh] font-display text-[2.4vw] leading-tight text-accent">You survived. You still don&apos;t know why.</p>
        <p className="mt-[3vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/90">
          A catastrophic failure tears through an underwater research facility.
        </p>
        <p className="mt-[1.8vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/85">
          You awaken among twisted metal, damaged machinery, and failing life-support systems. Your equipment is compromised. The facility is breaking apart. The first priority is survival.
        </p>
        <p className="mt-[1.8vh] max-w-[50vw] font-body text-[1.8vw] leading-[1.28] text-foam/85">
          But the wreck contains evidence that the disaster was not the whole story.
        </p>
        <div className="mt-[2.3vh] grid grid-cols-2 gap-x-[2vw] gap-y-[1.4vh] font-body text-[1.55vw] leading-tight text-foam">
          <p><span className="mr-[0.6vw] text-primary">•</span>Find oxygen and essential supplies.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Navigate the destroyed facility.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Recover damaged recordings and emergency transmissions.</p>
          <p><span className="mr-[0.6vw] text-primary">•</span>Investigate evidence that challenges the official explanation.</p>
        </div>
        <p className="mt-[2.4vh] max-w-[51vw] border-t border-line pt-[1.6vh] font-body text-[1.55vw] leading-[1.25] text-mist">
          <span className="font-semibold text-accent">The central mystery:</span> What happened beneath the ocean, and what was already happening before the catastrophe?
        </p>
      </div>
    </div>
  );
}

import { Reveal } from "./Reveal";

/**
 * "Trade from anywhere" — a floating browser frame playing the brand product
 * loop. The video is muted/looping/inline so it autoplays everywhere without
 * sound or user-gesture issues; if it ever fails to load the dark frame still
 * reads as a product screenshot.
 */
export function ProductShowcase() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          Now available on web
        </p>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          trade from anywhere.
          <br />
          never lose a beat.
        </h2>
        <p className="mt-4 text-lg text-muted">
          Open a trade on your phone, close it on your desktop — one account,
          every screen.
        </p>
      </Reveal>

      <Reveal delay={120} className="relative mt-14 flex justify-center">
        {/* Glow behind the device */}
        <div className="lp-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[100px]" />

        {/* Phone frame — sized to the video's native portrait resolution so it
            stays crisp (a larger frame would upscale the low-res clip). */}
        <div className="lp-float-slow relative w-[280px] rounded-[2.75rem] border-[10px] border-elevated bg-black shadow-2xl shadow-black/60 sm:w-[300px]">
          <div className="absolute left-1/2 top-2.5 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-elevated" />
          <video
            className="block aspect-[334/720] w-full rounded-[2.1rem] object-cover"
            src="/assets/video/chadwallet.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>
      </Reveal>
    </section>
  );
}

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

      <Reveal delay={120} className="relative mt-14">
        {/* Glow behind the frame */}
        <div className="lp-glow pointer-events-none absolute inset-x-10 -bottom-10 top-10 -z-10 rounded-full bg-brand/15 blur-[100px]" />

        <div className="lp-float-slow overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/60">
          {/* Faux browser chrome */}
          <div className="flex items-center gap-2 border-b border-line bg-elevated/60 px-4 py-3">
            <span className="size-3 rounded-full bg-down/80" />
            <span className="size-3 rounded-full bg-yellow-500/80" />
            <span className="size-3 rounded-full bg-brand/80" />
            <div className="mx-auto hidden rounded-md bg-canvas px-4 py-1 text-xs text-subtle sm:block">
              app.chadwallet.xyz
            </div>
          </div>
          <video
            className="block aspect-[16/10] w-full object-cover"
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

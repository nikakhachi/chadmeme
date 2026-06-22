/* eslint-disable @next/next/no-img-element -- static brand assets */
import { Reveal } from "./Reveal";
import { StoreBadges } from "./StoreBadges";

// Real ChadWallet app screens. Encoded path because the folder name has a space.
const SHOTS = [
  "token",
  "portfolio",
  "discover",
  "kol",
  "launch",
  "deposit",
  "search",
  "x",
].map((name) => `/assets/app%20store/${name}.png`);

/**
 * "Your whole trading life in one app" — an infinite, edge-faded marquee of the
 * real app screenshots. The track holds two identical copies and translates
 * -50%, so the loop is seamless; hovering pauses it (see globals.css).
 */
export function AppMarquee() {
  return (
    <section id="get-app" className="relative scroll-mt-20 py-24">
      <Reveal className="mx-auto max-w-2xl px-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          Download the app
        </p>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
          hunt every memecoin.
          <br />
          every chain. one wallet.
        </h2>
        <StoreBadges className="mt-7 justify-center" />
      </Reveal>

      <div className="relative mt-14 overflow-hidden">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-canvas to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-canvas to-transparent sm:w-40" />

        <div className="lp-marquee flex w-max gap-5 px-2.5">
          {[...SHOTS, ...SHOTS].map((src, i) => (
            <img
              key={i}
              src={src}
              alt="ChadWallet app screen"
              loading="lazy"
              decoding="async"
              className="h-[520px] w-auto shrink-0 rounded-3xl border border-line shadow-xl"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

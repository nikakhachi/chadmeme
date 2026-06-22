import { Coins } from "lucide-react";
import { Reveal } from "./Reveal";

/**
 * Rewards callout band — surfaces the $CHAD points value prop between the
 * feature grid and the app gallery.
 */
export function RewardsBand() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8">
      <div className="lp-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[110px]" />
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-line bg-panel/50 px-8 py-12 text-center backdrop-blur">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand/15 text-brand">
          <Coins className="size-7" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Rewards
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          earn <span className="text-brand">$CHAD</span> points on every fill
        </h2>
        <p className="mt-3 text-lg text-muted">
          Get rewarded to ape — every trade stacks points you can cash in.
        </p>
      </Reveal>
    </section>
  );
}

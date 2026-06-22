"use client";
/* eslint-disable @next/next/no-img-element -- static brand asset */
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Decorative avatars scattered around the headline. Positions are percentages
// of the stage; the smaller ones hide on mobile to avoid crowding the copy.
const ORBITERS = [
  { top: "8%", left: "14%", size: 64, delay: "0s", hue: "linear-gradient(135deg,#14f195,#0b8f59)", lg: false },
  { top: "18%", left: "82%", size: 52, delay: "1.2s", hue: "linear-gradient(135deg,#6366f1,#312e81)", lg: false },
  { top: "62%", left: "8%", size: 48, delay: "0.6s", hue: "linear-gradient(135deg,#f59e0b,#b45309)", lg: true },
  { top: "70%", left: "86%", size: 60, delay: "1.8s", hue: "linear-gradient(135deg,#22d3ee,#0e7490)", lg: false },
  { top: "84%", left: "40%", size: 44, delay: "0.9s", hue: "linear-gradient(135deg,#ec4899,#9d174d)", lg: true },
  { top: "30%", left: "50%", size: 40, delay: "2.1s", hue: "linear-gradient(135deg,#a855f7,#5b21b6)", lg: true },
];

export function FinalCta() {
  const { login } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* Deep indigo backdrop with brand glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-canvas via-[#0c0f2b] to-canvas" />
      <div className="lp-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[36rem] max-w-5xl items-center justify-center px-5 py-28">
        {/* Dotted orbit guides */}
        <div className="lp-spin-slow pointer-events-none absolute size-[26rem] rounded-full border border-dashed border-white/10 sm:size-[34rem]" />
        <div className="pointer-events-none absolute size-[40rem] rounded-full border border-dashed border-white/[0.06] sm:size-[52rem]" />

        {/* Scattered avatars */}
        {ORBITERS.map((o, i) => (
          <span
            key={i}
            className={cn(
              "lp-float absolute grid place-items-center overflow-hidden rounded-full border border-white/15 shadow-xl",
              o.lg && "hidden sm:grid",
            )}
            style={{
              top: o.top,
              left: o.left,
              width: o.size,
              height: o.size,
              background: o.hue,
              animationDelay: o.delay,
            }}
          >
            <img src="/assets/logo/dark.png" alt="" className="size-full object-cover" />
          </span>
        ))}

        {/* Center copy */}
        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            a trading app
            <br />
            for the rest of us
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted">
            Join 500,000 degens making their name on ChadWallet.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={login}
              size="lg"
              className="w-56 shadow-[0_0_40px_-8px] shadow-brand/50 sm:w-auto sm:px-8"
            >
              Start trading
            </Button>
            <Button
              onClick={() =>
                document
                  .getElementById("get-app")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              variant="outline"
              size="lg"
              className="w-56 sm:w-auto sm:px-8"
            >
              Download app
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

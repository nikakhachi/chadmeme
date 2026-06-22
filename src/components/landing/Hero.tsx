"use client";
/* eslint-disable @next/next/no-img-element -- static brand asset */
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { StarField } from "./StarField";
import { StoreBadges } from "./StoreBadges";

/** Smooth-scrolls to a section by id, respecting reduced-motion. */
function scrollToId(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Hero: giant wordmark over a deep-space backdrop with drifting aurora glow,
 * a twinkling star field, and the floating Chad mascot. Copy and CTAs echo
 * fomo's hero, reskinned to ChadWallet's green-on-black identity.
 */
export function Hero() {
  const { login } = useAuth();

  return (
    <section className="relative isolate overflow-hidden">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070f] via-canvas to-canvas" />
        {/* Aurora blobs: brand green + deep indigo, slowly drifting. */}
        <div className="lp-aurora absolute -top-40 left-1/4 size-[40rem] rounded-full bg-brand/20 blur-[120px]" />
        <div
          className="lp-aurora absolute -right-40 top-20 size-[34rem] rounded-full bg-indigo-500/20 blur-[120px]"
          style={{ animationDelay: "-7s" }}
        />
        <StarField count={70} />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-24 pt-36 text-center sm:pt-44">
        <span
          className="lp-rise mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted backdrop-blur"
          style={{ animationDelay: "0ms" }}
        >
          <span className="size-2 animate-pulse rounded-full bg-brand" />
          Now live on web &amp; mobile
        </span>

        {/* Floating mascot — sits right above the wordmark. */}
        <img
          src="/assets/logo/dark.png"
          alt=""
          aria-hidden
          className="lp-float mb-6 size-24 rounded-3xl border border-line/60 shadow-2xl shadow-brand/10 sm:size-28"
        />

        <h1
          className="lp-rise text-6xl font-extrabold leading-[0.95] tracking-tight sm:text-8xl"
          style={{ animationDelay: "80ms" }}
        >
          Chad<span className="text-brand">Wallet</span>
        </h1>

        <p
          className="lp-rise mt-6 text-2xl font-bold text-foreground sm:text-3xl"
          style={{ animationDelay: "180ms" }}
        >
          where degens become legends.
        </p>
        <p
          className="lp-rise mt-3 max-w-xl text-base text-muted sm:text-lg"
          style={{ animationDelay: "260ms" }}
        >
          From memecoins to viral tweets, trade any token on Solana in seconds.
        </p>

        <div
          className="lp-rise mt-9 flex flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "340ms" }}
        >
          <Button
            onClick={login}
            size="lg"
            className="w-56 shadow-[0_0_40px_-8px] shadow-brand/50 sm:w-auto sm:px-8"
          >
            Start trading
          </Button>
          <Button
            onClick={() => scrollToId("get-app")}
            variant="outline"
            size="lg"
            className="w-56 sm:w-auto sm:px-8"
          >
            Download app
          </Button>
        </div>

        <StoreBadges className="lp-rise mt-8 justify-center lg:hidden" />
      </div>
    </section>
  );
}

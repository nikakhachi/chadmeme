/* eslint-disable @next/next/no-img-element -- static brand asset */
import { Heart, Eye, Bell, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/** Shared card shell: kicker label, headline, and a bespoke UI snippet. */
function FeatureCard({
  kicker,
  title,
  children,
  className,
  delay = 0,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      className={cn(
        "group flex flex-col rounded-2xl border border-line bg-panel/70 p-6 transition-colors duration-300 hover:border-brand/40",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
        {kicker}
      </p>
      <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight">
        {title}
      </h3>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </Reveal>
  );
}

/** Small round avatar built from the Chad mark over a varied gradient ring. */
function ChadAvatar({ className, hue }: { className?: string; hue: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full",
        className,
      )}
      style={{ background: hue }}
    >
      <img src="/assets/logo/dark.png" alt="" className="size-full object-cover" />
    </span>
  );
}

const LEADERS = [
  { rank: 1, name: "gigachad", pnl: "+$1,726,513", hue: "linear-gradient(135deg,#14f195,#0b8f59)" },
  { rank: 2, name: "frankdegen", pnl: "+$1,236,362", hue: "linear-gradient(135deg,#6366f1,#312e81)" },
  { rank: 3, name: "_logjam", pnl: "+$810,605", hue: "linear-gradient(135deg,#f59e0b,#b45309)" },
];
const MEDALS = ["bg-yellow-500/20 text-yellow-400", "bg-slate-400/20 text-slate-300", "bg-amber-700/20 text-amber-600"];

export function FeatureGrid() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          never miss out again
        </h2>
        <p className="mt-4 text-lg text-muted">
          The only social-first memecoin trading app.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* ── Leaderboard ── */}
        <FeatureCard kicker="Leaderboard" title="become a legend, top the leaderboard">
          <div className="space-y-2.5">
            {LEADERS.map((l, i) => (
              <div
                key={l.rank}
                className="flex items-center gap-3 rounded-xl border border-line bg-canvas/60 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-md text-xs font-bold",
                    MEDALS[i],
                  )}
                >
                  {l.rank}
                </span>
                <ChadAvatar className="size-8" hue={l.hue} />
                <span className="flex-1 truncate text-sm font-semibold">
                  {l.name}
                </span>
                <span className="font-mono text-sm font-semibold text-up">
                  {l.pnl}
                </span>
              </div>
            ))}
          </div>
        </FeatureCard>

        {/* ── Feed ── */}
        <FeatureCard kicker="Feed" title="copy the wallets that are actually printing" delay={80}>
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2">
              <ChadAvatar className="size-8" hue="linear-gradient(135deg,#6366f1,#9333ea)" />
              <span className="text-sm font-semibold">remusofmars</span>
              <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                Thesis
              </span>
              <span className="ml-auto text-xs text-subtle">5m</span>
            </div>
            <p className="mt-3 text-sm text-foreground">we&apos;re so back 🚀</p>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2">
              <div className="flex items-center gap-2">
                <ChadAvatar className="size-7" hue="linear-gradient(135deg,#14f195,#0b8f59)" />
                <div className="leading-tight">
                  <p className="text-xs text-muted">Position</p>
                  <p className="text-sm font-semibold">$242.6K</p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-up">+$23.2K</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-subtle">
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" /> 293
              </span>
              <span className="flex items-center gap-1">
                <Eye className="size-3.5" /> 8,492
              </span>
            </div>
          </div>
        </FeatureCard>

        {/* ── Alerts ── */}
        <FeatureCard kicker="Alerts" title="real-time pings when whales buy" delay={160}>
          <div className="flex h-full flex-col justify-center gap-3">
            {[
              { token: "DOGE", move: "+5.98%", note: "50 top traders bought $88,203" },
              { token: "WIF", move: "+12.4%", note: "32 top traders bought $54,910" },
            ].map((a, i) => (
              <div
                key={a.token}
                className="flex items-start gap-3 rounded-xl border border-line bg-canvas/80 p-3 shadow-lg"
                style={{ marginLeft: i === 1 ? "1.25rem" : 0 }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {a.token} is up{" "}
                    <span className="text-up">{a.move}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="size-1.5 rounded-full bg-up" />
                    {a.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FeatureCard>

        {/* ── Easy onboarding ── */}
        <FeatureCard kicker="Easy onboarding" title="create an account in an instant" delay={0}>
          <div className="flex h-full flex-col justify-center gap-2.5">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <path d="M16.36 12.78c-.02-2.07 1.69-3.06 1.77-3.11-.96-1.41-2.46-1.6-2.99-1.62-1.27-.13-2.48.75-3.13.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.04 8.23.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.7.65 1.12-.02 1.82-1 2.5-2 .79-1.15 1.11-2.27 1.13-2.32-.02-.01-2.17-.83-2.19-3.29zM14.3 6.69c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.92.07 1.87-.47 2.44-1.16z" />
              </svg>
              Sign in with Apple
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-line bg-canvas py-2.5 text-sm font-semibold text-foreground">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.9 3.2-7.8z" />
                <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M6 14.4a6.6 6.6 0 0 1 0-4.2V7.4H2.3a11 11 0 0 0 0 9.8L6 14.4z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1 11 11 0 0 0 2.3 7.4L6 10.2c.9-2.6 3.2-4.8 6-4.8z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </FeatureCard>

        {/* ── Multichain & gasless ── */}
        <FeatureCard kicker="Zero complexity" title="multichain &amp; gasless" delay={80}>
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              {[
                "linear-gradient(135deg,#14f195,#0b8f59)",
                "linear-gradient(135deg,#6366f1,#312e81)",
                "linear-gradient(135deg,#22d3ee,#0e7490)",
                "linear-gradient(135deg,#f59e0b,#b45309)",
              ].map((g, i) => (
                <span
                  key={i}
                  className="lp-float size-12 rounded-2xl border border-white/10 shadow-lg"
                  style={{ background: g, animationDelay: `${i * 0.6}s` }}
                />
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Zap className="size-3.5" /> $0 gas fees
            </span>
          </div>
        </FeatureCard>

        {/* ── Apple Pay ── */}
        <FeatureCard kicker="One tap to buy" title="fund with Apple Pay" delay={160}>
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">$100</span>
              <span className="text-xs text-muted">493.5K PENGU</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {["$25", "$50", "$100", "$250"].map((v) => (
                <span
                  key={v}
                  className={cn(
                    "rounded-lg py-1.5 text-center text-xs font-medium",
                    v === "$100"
                      ? "bg-brand/15 text-brand"
                      : "border border-line text-muted",
                  )}
                >
                  {v}
                </span>
              ))}
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-semibold text-black">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <path d="M16.36 12.78c-.02-2.07 1.69-3.06 1.77-3.11-.96-1.41-2.46-1.6-2.99-1.62-1.27-.13-2.48.75-3.13.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.04 8.23.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.7.65 1.12-.02 1.82-1 2.5-2 .79-1.15 1.11-2.27 1.13-2.32-.02-.01-2.17-.83-2.19-3.29zM14.3 6.69c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.92.07 1.87-.47 2.44-1.16z" />
              </svg>
              Buy with Pay
            </button>
          </div>
        </FeatureCard>
      </div>
    </section>
  );
}

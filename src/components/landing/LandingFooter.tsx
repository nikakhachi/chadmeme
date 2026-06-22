/* eslint-disable @next/next/no-img-element -- static brand asset */
import { APP_STORE_URL, PLAY_STORE_URL } from "./StoreBadges";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "About",
    links: [
      { label: "Blog", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Affiliates", href: "#" },
    ],
  },
  {
    heading: "Social",
    links: [
      { label: "X / Twitter", href: "#" },
      { label: "Discord", href: "#" },
      { label: "Instagram", href: "#" },
    ],
  },
  {
    heading: "Get the app",
    links: [
      { label: "iOS — App Store", href: APP_STORE_URL },
      { label: "Android — Google Play", href: PLAY_STORE_URL },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/logo/dark.png"
              alt="ChadWallet"
              className="size-9 rounded-xl"
            />
            <span className="text-xl font-extrabold lowercase tracking-tight">
              chad<span className="text-brand">wallet</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">where degens become legends.</p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle">
              {col.heading}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-subtle sm:px-8">
          © {new Date().getFullYear()} ChadWallet. Paper-trading demo — not
          financial advice.
        </p>
      </div>
    </footer>
  );
}

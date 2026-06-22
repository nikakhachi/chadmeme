import { cn } from "@/lib/utils";

/** Live store URLs for the ChadWallet mobile apps. */
export const APP_STORE_URL =
  "https://apps.apple.com/us/app/chadwallet/id6757367474";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=xyz.chadwallet.www";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.36 12.78c-.02-2.07 1.69-3.06 1.77-3.11-.96-1.41-2.46-1.6-2.99-1.62-1.27-.13-2.48.75-3.13.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.04 8.23.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.7.65 1.12-.02 1.82-1 2.5-2 .79-1.15 1.11-2.27 1.13-2.32-.02-.01-2.17-.83-2.19-3.29zM14.3 6.69c.57-.69.96-1.65.85-2.61-.83.03-1.83.55-2.42 1.24-.53.61-.99 1.59-.87 2.53.92.07 1.87-.47 2.44-1.16z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3.6 2.3c-.2.2-.3.5-.3.9v17.6c0 .4.1.7.3.9l.1.1L13.5 12v-.1L3.7 2.2l-.1.1z" fill="#00d4ff" />
      <path d="M16.8 15.3 13.5 12v-.1l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-4 2.1z" fill="#ffce00" />
      <path d="m16.9 15.2-3.4-3.3-9.9 9.9c.4.4 1 .4 1.7 0l11.6-6.6z" fill="#ff3d44" />
      <path d="M3.6 2.3 13.5 11.9l3.4-3.3L5.3 2c-.6-.4-1.3-.3-1.7.3z" fill="#00f076" />
    </svg>
  );
}

/** A single dark pill store badge (App Store / Google Play). */
function Badge({
  href,
  icon,
  top,
  bottom,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  top: string;
  bottom: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/60 px-4 py-2 backdrop-blur transition-colors hover:border-white/30 hover:bg-black/80",
        className,
      )}
    >
      <span className="text-foreground">{icon}</span>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] uppercase tracking-wide text-muted">{top}</span>
        <span className="text-sm font-semibold text-foreground">{bottom}</span>
      </span>
    </a>
  );
}

/** App Store + Google Play badge pair. */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Badge
        href={APP_STORE_URL}
        icon={<AppleIcon className="size-6" />}
        top="Download on the"
        bottom="App Store"
      />
      <Badge
        href={PLAY_STORE_URL}
        icon={<PlayIcon className="size-5" />}
        top="Get it on"
        bottom="Google Play"
      />
    </div>
  );
}

import { Globe, Send } from "lucide-react";
import { formatCompactUsd } from "@/lib/utils";
import type { TokenDetail } from "@/types/market";

/** "About" card in the right rail: description, socials, market cap. */
export function AboutToken({ token }: { token: TokenDetail }) {
  const links = [
    token.website && { label: "Website", href: token.website, icon: Globe },
    token.twitter && { label: "X", href: token.twitter, icon: null },
    token.telegram && { label: "Telegram", href: token.telegram, icon: Send },
  ].filter(Boolean) as { label: string; href: string; icon: typeof Globe | null }[];

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">About {token.symbol}</h2>
        <span className="text-sm font-semibold">{formatCompactUsd(token.marketCap)}</span>
      </div>
      {token.description && (
        <p className="mb-3 text-sm leading-relaxed text-muted">{token.description}</p>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
            >
              {l.icon ? <l.icon className="size-3.5" /> : <span className="font-bold">𝕏</span>}
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

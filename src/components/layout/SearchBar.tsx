"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTrending } from "@/hooks/use-trending";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { PriceChange } from "@/components/ui/price-change";
import { formatCompactUsd } from "@/lib/utils";

/**
 * Token search with a live dropdown filtered from the trending list.
 * (A dedicated search endpoint can replace the client filter later without
 * changing this component's behavior.)
 */
export function SearchBar() {
  const router = useRouter();
  const { tokens } = useTrending(20);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tokens.slice(0, 8);
    return tokens
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, tokens]);

  function go(address: string) {
    setOpen(false);
    setQuery("");
    router.push(`/token/${address}`);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3.5 py-2.5">
        <Search className="size-4 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Search for tokens..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-panel shadow-xl"
          onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
        >
          {results.map((t) => (
            <button
              key={t.address}
              onClick={() => go(t.address)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-elevated"
            >
              <TokenAvatar symbol={t.symbol} logoURI={t.logoURI} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.symbol}</div>
                <div className="truncate text-xs text-muted">{t.name}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-foreground">
                  {formatCompactUsd(t.marketCap)}
                </div>
                <PriceChange value={t.priceChange24h} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

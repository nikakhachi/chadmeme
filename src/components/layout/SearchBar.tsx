"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { useTrending } from "@/hooks/use-trending";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { PriceChange } from "@/components/ui/price-change";
import { formatCompactUsd } from "@/lib/utils";
import type { Token } from "@/types/market";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Token search. Empty query shows trending; typing searches ALL Solana tokens
 * via /api/tokens/search (BirdEye), debounced to limit requests.
 */
export function SearchBar() {
  const router = useRouter();
  const { tokens: trending } = useTrending(20);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the query before hitting the search endpoint.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isLoading } = useSWR<{ tokens: Token[] }>(
    debounced ? `/api/tokens/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const results = debounced ? (data?.tokens ?? []) : trending.slice(0, 8);
  const searching = Boolean(debounced) && isLoading;

  function go(address: string) {
    setOpen(false);
    setQuery("");
    setDebounced("");
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
          placeholder="Search for any token…"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
        />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-panel shadow-xl"
          onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
        >
          {searching && results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No tokens found.</p>
          ) : (
            results.map((t) => (
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
                  <div className="text-foreground">{formatCompactUsd(t.marketCap)}</div>
                  <PriceChange value={t.priceChange24h} />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

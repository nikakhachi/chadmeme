"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { useTrending } from "@/hooks/use-trending";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { PriceChange } from "@/components/ui/price-change";
import { StarButton } from "@/components/watchlist/StarButton";
import { formatCompactUsd, formatTokenPrice, shortenAddress } from "@/lib/utils";
import type { Token } from "@/types/market";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Wait this long after the user stops typing before hitting the search API
// (keeps BirdEye search-call volume low). Min 2 chars to search at all.
const SEARCH_DEBOUNCE_MS = 1000;
const MIN_QUERY_LEN = 2;

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

  // Only search after the user pauses typing for SEARCH_DEBOUNCE_MS. Short
  // queries set no timer (and the cleanup cancels any pending one); the live
  // `query` length gates the UI, so a stale `debounced` is simply ignored.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LEN) return;
    const id = setTimeout(() => setDebounced(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isLoading } = useSWR<{ tokens: Token[] }>(
    debounced ? `/api/tokens/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const trimmed = query.trim();
  const isDefault = trimmed.length < MIN_QUERY_LEN;
  // Typed enough but the debounced fetch hasn't caught up yet.
  const waiting = !isDefault && (trimmed !== debounced || isLoading);
  const results = isDefault ? trending.slice(0, 8) : (data?.tokens ?? []);

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
          className="absolute left-1/2 top-full z-50 mt-2 w-[640px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-panel shadow-xl"
          // Keep the input focused on any click inside (so the dropdown stays
          // open) — e.g. tapping a row's star shouldn't close the results.
          onMouseDown={(e) => e.preventDefault()}
        >
          {waiting && results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No tokens found.</p>
          ) : (
            results.map((t) => (
              <div
                key={t.address}
                role="button"
                tabIndex={0}
                onClick={() => go(t.address)}
                onKeyDown={(e) => e.key === "Enter" && go(t.address)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-elevated"
              >
                <TokenAvatar symbol={t.symbol} logoURI={t.logoURI} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {t.symbol}
                    </span>
                    <StarButton address={t.address} size={13} alwaysVisible />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="truncate">{t.name}</span>
                    <span className="shrink-0 font-mono text-subtle">
                      {shortenAddress(t.address, 4, 4)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <Stat label="MC" value={formatCompactUsd(t.marketCap)} />
                  <span className="w-14 text-right text-foreground">
                    {formatTokenPrice(t.priceUsd)}
                  </span>
                  <PriceChange value={t.priceChange24h} className="w-14 text-right" />
                  <Stat label="VOL" value={formatCompactUsd(t.volume24h)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Compact labeled stat (e.g. "MC $127K") used in search rows. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="rounded bg-elevated px-1 py-px text-[10px] font-semibold text-subtle">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </span>
  );
}

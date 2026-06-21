"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { useTrending, useWatchlistTokens } from "@/hooks/use-trending";
import { useWatchlist } from "@/components/watchlist/watchlist-context";
import { TokenList } from "./TokenList";
import { cn } from "@/lib/utils";

const TABS = ["Trending", "Watchlist"] as const;
type Tab = (typeof TABS)[number];

/**
 * Left sidebar: Trending / Watchlist tabs + the token list.
 * Trending streams from BirdEye; Watchlist resolves live data for the tokens
 * the user has starred (fetched only while the tab is active, to save API).
 */
export function TokenSidebar() {
  const [tab, setTab] = useState<Tab>("Trending");
  const { addresses } = useWatchlist();
  const isWatchlist = tab === "Watchlist";

  const trending = useTrending(50);
  const watchlist = useWatchlistTokens(isWatchlist ? addresses : []);

  const tokens = isWatchlist ? watchlist.tokens : trending.tokens;
  const loading = isWatchlist ? watchlist.isLoading : trending.isLoading;

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-line bg-canvas">
      <div className="flex gap-1.5 px-3 py-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              t === tab ? "bg-elevated text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isWatchlist && addresses.length === 0 ? (
          <EmptyWatchlist />
        ) : loading && tokens.length === 0 ? (
          <ListSkeleton />
        ) : (
          <TokenList tokens={tokens} />
        )}
      </div>
    </aside>
  );
}

function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted">
      <Star className="size-6 text-subtle" />
      <p>Your watchlist is empty.</p>
      <p className="text-xs text-subtle">
        Tap the star on any token to add it here.
      </p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-1.5 px-1 py-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-panel" />
      ))}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { useTrending, useWatchlistTokens } from "@/hooks/use-trending";
import { useWatchlist } from "@/components/watchlist/watchlist-context";
import { ActivityFeed } from "@/components/feed/ActivityFeed";
import { TokenList } from "./TokenList";
import { cn } from "@/lib/utils";

const VIEWS = ["Tokens", "Feed"] as const;
type View = (typeof VIEWS)[number];

/**
 * Left sidebar. Top-level nav switches between:
 *   - Tokens: Trending / Watchlist sub-tabs + token list
 *   - Feed:   global activity of every trader (infinite scroll)
 */
export function TokenSidebar() {
  const [view, setView] = useState<View>("Tokens");

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-line bg-canvas">
      <nav className="flex items-center gap-4 px-4 pt-3">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "py-1 text-sm font-semibold transition-colors",
              v === view ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </nav>

      {view === "Tokens" ? <TokensPanel /> : <FeedPanel />}
    </aside>
  );
}

const TABS = ["Trending", "Watchlist"] as const;
type Tab = (typeof TABS)[number];

function TokensPanel() {
  const [tab, setTab] = useState<Tab>("Trending");
  const { addresses } = useWatchlist();
  const isWatchlist = tab === "Watchlist";

  const trending = useTrending(20);
  const watchlist = useWatchlistTokens(isWatchlist ? addresses : []);

  const tokens = isWatchlist ? watchlist.tokens : trending.tokens;
  const loading = isWatchlist ? watchlist.isLoading : trending.isLoading;

  return (
    <>
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
    </>
  );
}

function FeedPanel() {
  return (
    <div className="flex-1 overflow-y-auto px-2 pb-4 pt-2">
      <ActivityFeed />
    </div>
  );
}

function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted">
      <Star className="size-6 text-subtle" />
      <p>Your watchlist is empty.</p>
      <p className="text-xs text-subtle">Tap the star on any token to add it here.</p>
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

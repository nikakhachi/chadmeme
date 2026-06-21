import { getTrendingTokens } from "@/lib/birdeye";
import { TokenList } from "./TokenList";

const FILTERS = ["Trending", "Watchlist", "Crypto", "Most held", "Graduating"];

/**
 * Left sidebar: filter chips + scrollable trending token list.
 * Server component — fetches trending tokens on the server (real or mock).
 * The active row is highlighted client-side by TokenList from the route.
 */
export async function TokenSidebar() {
  const tokens = await getTrendingTokens(50);

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-line bg-canvas">
      <div className="flex gap-1.5 overflow-x-auto px-3 py-3">
        {FILTERS.map((filter, i) => (
          <button
            key={filter}
            className={
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors " +
              (i === 0
                ? "bg-elevated text-foreground"
                : "text-muted hover:text-foreground")
            }
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <TokenList tokens={tokens} />
      </div>
    </aside>
  );
}

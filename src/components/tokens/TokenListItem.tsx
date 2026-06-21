import Link from "next/link";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { PriceChange } from "@/components/ui/price-change";
import { StarButton } from "@/components/watchlist/StarButton";
import { cn, formatCompactUsd, formatTokenPrice } from "@/lib/utils";
import type { Token } from "@/types/market";

/** A single token row in the left sidebar list, with a watchlist star. */
export function TokenListItem({
  token,
  active,
}: {
  token: Token;
  active?: boolean;
}) {
  return (
    <Link
      href={`/token/${token.address}`}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors",
        active ? "bg-elevated" : "hover:bg-panel",
      )}
    >
      <StarButton address={token.address} />
      <TokenAvatar symbol={token.symbol} logoURI={token.logoURI} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {token.symbol}
        </div>
        <div className="truncate text-xs text-muted">
          {formatTokenPrice(token.priceUsd)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-foreground">
          {formatCompactUsd(token.marketCap)}
        </div>
        <PriceChange value={token.priceChange24h} className="text-xs" />
      </div>
    </Link>
  );
}

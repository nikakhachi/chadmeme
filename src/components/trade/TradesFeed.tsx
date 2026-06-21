"use client";
import { useTokenTrades } from "@/hooks/use-token-data";
import { CopyAddress } from "@/components/ui/copy-address";
import { cn, formatCompactUsd, formatTokenPrice, formatUsd, timeAgo } from "@/lib/utils";

/** Live swaps feed for a token: trader, side, price + market cap at the trade. */
export function TradesFeed({ address, supply }: { address: string; supply?: number }) {
  const { trades, isLoading } = useTokenTrades(address);

  if (isLoading && trades.length === 0) {
    return <FeedSkeleton />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th className="px-3 py-2 text-left font-medium">Trader</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
            <th className="px-3 py-2 text-right font-medium">MC</th>
            <th className="px-3 py-2 text-right font-medium">Value</th>
            <th className="px-3 py-2 text-right font-medium">Age</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, index) => (
            <tr key={index} className="border-b border-line/50">
              <td className="px-3 py-2 text-xs text-foreground">
                <CopyAddress address={t.traderAddress} />
              </td>
              <td className="px-3 py-2">
                <span className={cn("font-semibold capitalize", t.side === "buy" ? "text-up" : "text-down")}>
                  {t.side}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-muted">{formatTokenPrice(t.priceUsd)}</td>
              <td className="px-3 py-2 text-right text-muted">
                {supply && supply > 0 ? formatCompactUsd(t.priceUsd * supply) : "—"}
              </td>
              <td className="px-3 py-2 text-right">{formatUsd(t.valueUsd)}</td>
              <td className="px-3 py-2 text-right text-muted">{timeAgo(t.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-elevated" />
      ))}
    </div>
  );
}

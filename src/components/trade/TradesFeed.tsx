"use client";
import { useMemo } from "react";
import { useTokenTrades } from "@/hooks/use-token-data";
import { useActivity } from "@/hooks/use-profile-data";
import { useAuth } from "@/components/auth/auth-context";
import { CopyAddress } from "@/components/ui/copy-address";
import { cn, formatCompactUsd, formatTokenPrice, formatUsd, timeAgo } from "@/lib/utils";
import type { MarketTrade } from "@/types/market";

/** Live swaps feed for a token: trader, side, price + market cap at the trade. */
export function TradesFeed({ address, supply }: { address: string; supply?: number }) {
  const { trades, isLoading } = useTokenTrades(address);
  const { items } = useActivity();
  const { walletAddress } = useAuth();

  // Merge the signed-in user's own trades for this token (so they show up
  // immediately, before BirdEye indexes them), deduped by tx signature.
  const merged = useMemo(() => {
    const own: MarketTrade[] = items
      .filter((i) => i.type === "trade" && i.tokenAddress === address && i.txSignature)
      .map((i) => {
        const t = i as Extract<typeof i, { type: "trade" }>;
        return {
          txHash: t.txSignature!,
          side: t.side,
          traderAddress: walletAddress ?? "",
          valueUsd: t.valueUsd,
          tokenAmount: t.tokenAmount,
          priceUsd: t.priceUsd,
          timestamp: new Date(t.createdAt).getTime(),
        };
      });
    const seen = new Set(own.map((t) => t.txHash));
    const rest = trades.filter((t) => !seen.has(t.txHash));
    return [...own, ...rest].sort((a, b) => b.timestamp - a.timestamp);
  }, [items, trades, address, walletAddress]);

  if (isLoading && merged.length === 0) {
    return <FeedSkeleton />;
  }
  if (merged.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-muted">No swaps yet.</p>;
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
          {merged.map((t) => (
            <tr key={t.txHash} className="border-b border-line/50">
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

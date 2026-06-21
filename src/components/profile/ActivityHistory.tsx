"use client";
import { useActivity } from "@/hooks/use-profile-data";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { cn, formatUsd, timeAgo } from "@/lib/utils";

/** The user's trade history (buys and sells). */
export function ActivityHistory() {
  const { trades, isLoading } = useActivity();

  if (isLoading && trades.length === 0) {
    return <p className="p-4 text-sm text-muted">Loading activity…</p>;
  }
  if (trades.length === 0) {
    return <p className="p-4 text-sm text-muted">No trades yet. Buy a token to get started.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {trades.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
          <TokenAvatar symbol={t.tokenSymbol} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              <span className={cn("capitalize", t.side === "buy" ? "text-up" : "text-down")}>
                {t.side}
              </span>{" "}
              {t.tokenSymbol}
            </div>
            <div className="text-xs text-muted">{timeAgo(new Date(t.createdAt))} ago</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{formatUsd(t.valueUsd)}</div>
            <div className="text-xs text-muted">
              {t.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {t.tokenSymbol}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

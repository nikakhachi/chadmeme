"use client";
import Link from "next/link";
import { useFeed } from "@/hooks/use-feed";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { AssetIcon } from "@/components/ui/asset-icon";
import { cn, formatCompactUsd, shortenAddress, timeAgo } from "@/lib/utils";
import type { FeedActivity } from "@/types/trading";

/** Global activity feed of every trader's buys/sells (full list, auto-refreshed). */
export function ActivityFeed() {
  const { activities, isLoading } = useFeed();

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-2 px-2 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-panel" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted">
        No trades yet. Be the first to make one!
      </p>
    );
  }

  return (
    <div className="px-1">
      {activities.map((a) => (
        <FeedRow key={a.id} activity={a} />
      ))}
    </div>
  );
}

function FeedRow({ activity }: { activity: FeedActivity }) {
  const trader =
    activity.traderHandle ??
    (activity.traderWallet
      ? shortenAddress(activity.traderWallet)
      : shortenAddress(activity.traderId));
  const isBuy = activity.side === "buy";

  return (
    <Link
      href={`/token/${activity.tokenAddress}`}
      className="block rounded-lg px-2.5 py-2 hover:bg-panel"
    >
      {/* Line 1: trader + buy/sell badge + time */}
      <div className="flex items-center gap-2.5">
        <TokenAvatar
          symbol={trader}
          logoURI={activity.traderAvatarUrl ?? undefined}
          size="sm"
        />
        <span className="truncate text-sm font-semibold text-foreground">
          {trader}
        </span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-bold",
            isBuy ? "bg-up/15 text-up" : "bg-down/15 text-down",
          )}
        >
          {isBuy ? "Buy" : "Sell"}
        </span>
        <span className="ml-auto shrink-0 text-xs text-muted">
          {timeAgo(new Date(activity.createdAt))}
        </span>
      </div>

      {/* Line 2: token + value at market cap */}
      <div className="mt-1.5 flex items-center gap-2 pl-[46px] text-sm">
        <TokenAvatar
          symbol={activity.tokenSymbol}
          logoURI={activity.tokenLogoURI ?? undefined}
          size="sm"
        />
        <span className="font-semibold text-foreground">
          {activity.tokenSymbol}
        </span>
        <span className="font-semibold text-foreground">
          {formatCompactUsd(activity.valueUsd)}
        </span>
        {activity.payAsset && (
          <span className="flex items-center gap-1 text-xs text-muted">
            {isBuy ? "with" : "for"}
            <AssetIcon asset={activity.payAsset} className="size-3.5" />
            {activity.payAsset}
          </span>
        )}
      </div>
    </Link>
  );
}

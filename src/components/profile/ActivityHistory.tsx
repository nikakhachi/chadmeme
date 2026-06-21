"use client";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useActivity } from "@/hooks/use-profile-data";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { AssetIcon } from "@/components/ui/asset-icon";
import { cn, formatUsd, timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types/trading";

/** Unified activity: swaps + deposits + withdrawals. */
export function ActivityHistory() {
  const { items, isLoading } = useActivity();

  if (isLoading && items.length === 0) {
    return <p className="p-4 text-sm text-muted">Loading activity…</p>;
  }
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted">No activity yet.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3">
          {item.type === "trade" ? <TradeRow item={item} /> : <TransferRow item={item} />}
        </li>
      ))}
    </ul>
  );
}

function TradeRow({ item }: { item: Extract<ActivityItem, { type: "trade" }> }) {
  return (
    <>
      <TokenAvatar symbol={item.tokenSymbol} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className={cn("capitalize", item.side === "buy" ? "text-up" : "text-down")}>
            {item.side}
          </span>
          {item.tokenSymbol}
          {item.payAsset && (
            <span className="flex items-center gap-1 text-xs font-normal text-muted">
              {item.side === "buy" ? "with" : "for"}
              <AssetIcon asset={item.payAsset} className="size-3.5" />
              {item.payAsset}
            </span>
          )}
        </div>
        <div className="text-xs text-muted">{timeAgo(new Date(item.createdAt))} ago</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{formatUsd(item.valueUsd)}</div>
        <div className="text-xs text-muted">
          {item.tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
          {item.tokenSymbol}
        </div>
      </div>
    </>
  );
}

function TransferRow({ item }: { item: Extract<ActivityItem, { type: "deposit" | "withdraw" }> }) {
  const isDeposit = item.type === "deposit";
  return (
    <>
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full",
          isDeposit ? "bg-up/15 text-up" : "bg-down/15 text-down",
        )}
      >
        {isDeposit ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold capitalize">
          {item.type}
          <AssetIcon asset={item.asset} className="size-3.5" />
          {item.asset}
        </div>
        <div className="text-xs text-muted">{timeAgo(new Date(item.createdAt))} ago</div>
      </div>
      <div className={cn("text-right text-sm font-semibold", isDeposit ? "text-up" : "text-down")}>
        {isDeposit ? "+" : "−"}
        {item.amount.toLocaleString(undefined, { maximumFractionDigits: item.asset === "SOL" ? 4 : 2 })}{" "}
        {item.asset}
      </div>
    </>
  );
}

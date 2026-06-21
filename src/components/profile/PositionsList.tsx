"use client";
import Link from "next/link";
import { TokenAvatar } from "@/components/ui/token-avatar";
import { PriceChange } from "@/components/ui/price-change";
import { formatUsd } from "@/lib/utils";
import type { PositionWithPnl } from "@/types/trading";

/** Open positions with live value and PnL. */
export function PositionsList({ positions }: { positions: PositionWithPnl[] }) {
  if (positions.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">No open positions.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {positions.map((p) => (
        <li key={p.id}>
          <Link
            href={`/token/${p.tokenAddress}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-elevated"
          >
            <TokenAvatar symbol={p.tokenSymbol} logoURI={p.tokenLogoURI} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{p.tokenSymbol}</div>
              <div className="text-xs text-muted">
                {p.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{formatUsd(p.currentValueUsd)}</div>
              <div className="text-xs">
                <PriceChange value={p.pnlPercent} />{" "}
                <span className="text-muted">({formatUsd(p.pnlUsd)})</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

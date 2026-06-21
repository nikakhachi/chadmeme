import { TokenAvatar } from "@/components/ui/token-avatar";
import { PriceChange } from "@/components/ui/price-change";
import { CopyAddress } from "@/components/ui/copy-address";
import { StarButton } from "@/components/watchlist/StarButton";
import { formatCompactUsd, formatTokenPrice } from "@/lib/utils";
import type { TokenDetail } from "@/types/market";

/** Token title + key stats row shown above the chart. */
export function TokenHeader({ token }: { token: TokenDetail }) {
  const stats: { label: string; value: string; node?: React.ReactNode }[] = [
    { label: "Price", value: formatTokenPrice(token.priceUsd) },
    {
      label: "24H change",
      value: "",
      node: <PriceChange value={token.priceChange24h} className="font-semibold" />,
    },
    { label: "24H Vol", value: formatCompactUsd(token.volume24h) },
    { label: "Liquidity", value: formatCompactUsd(token.liquidity) },
    { label: "Holders", value: token.holders.toLocaleString() },
    {
      label: "Top 10",
      value: token.top10HoldersPercent ? `${token.top10HoldersPercent.toFixed(1)}%` : "—",
    },
  ];

  return (
    <div className="border-b border-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <TokenAvatar symbol={token.symbol} logoURI={token.logoURI} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{token.symbol}</h1>
              <span className="text-sm text-muted">{token.name}</span>
              <StarButton address={token.address} size={16} alwaysVisible />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <CopyAddress address={token.address} />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-x-6 gap-y-2">
          {stats.map((s) => (
            <div key={s.label} className="min-w-[72px]">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="text-sm font-semibold">{s.node ?? s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
